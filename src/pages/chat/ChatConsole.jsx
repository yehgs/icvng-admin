//admin
// src/pages/chat/ChatConsole.jsx
//
// Live-chat console for the AI chatbot (storefront + mobile app).
//  • Inbox of conversations in YOUR scope (server-enforced): IT/Director = every country,
//    foreign roles = their country, other HQ roles = the HQ country.
//  • Alarm: while a chat is waiting for your desk (or your assigned chat has unread messages)
//    the console beeps every N seconds, flashes the tab title and raises a desktop notification.
//    "OVERDUE" (waiting > SLA) turns the banner red and is escalated to managers/IT/Director by the server.
//  • Take over from the AI, reply (the visitor sees your name, role and photo), internal notes,
//    transfer to Sales / Manager / IT / Director, hand back to the AI, resolve, close, export leads (CSV).
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MessageCircle, Bell, BellOff, Send, UserCheck, Bot, ArrowRightLeft, CheckCircle2, XCircle, Download,
  Settings, Search, Globe, Phone, Mail, Radio, StickyNote, RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";
import { getCurrentUser } from "../../utils/api";
import { useAdminTranslation } from "../../hooks/useAdminTranslation.js";

const API_BASE = import.meta.env.VITE_APP_API_URL || "http://localhost:8080/api";
const hdr = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("accessToken")}` });
async function api(path, opts = {}) {
  const res = await fetch(`${API_BASE}/admin/chat${path}`, { ...opts, headers: { ...hdr(), ...(opts.headers || {}) } });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(body.message || res.statusText), { status: res.status });
  return body;
}

const INPUT = "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent";
const STATUS_STYLE = {
  ai: "bg-blue-100 text-blue-700", waiting_agent: "bg-red-100 text-red-700", agent: "bg-green-100 text-green-700",
  resolved: "bg-teal-100 text-teal-700", closed: "bg-gray-100 text-gray-600",
};
const flag = (c) => ({ NG: "🇳🇬", TG: "🇹🇬", BJ: "🇧🇯", IT: "🇮🇹" }[c] || "🌍");
const timeAgo = (d) => {
  const s = Math.max(0, Math.floor((Date.now() - new Date(d).getTime()) / 1000));
  if (s < 60) return `${s}s`; if (s < 3600) return `${Math.floor(s / 60)}m`; if (s < 86400) return `${Math.floor(s / 3600)}h`; return `${Math.floor(s / 86400)}d`;
};

// Alarm tone via Web Audio (no asset). Needs one user gesture to unlock → "Enable alarm" button.
function useAlarm() {
  const ctxRef = useRef(null);
  const [enabled, setEnabled] = useState(() => { try { return localStorage.getItem("chatAlarm") !== "off"; } catch { return true; } });
  const [unlocked, setUnlocked] = useState(false);
  const unlock = useCallback(() => {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!ctxRef.current) ctxRef.current = new AC();
      ctxRef.current.resume?.();
      setUnlocked(true);
    } catch { /* no audio */ }
  }, []);
  const beep = useCallback((urgent) => {
    const ctx = ctxRef.current; if (!ctx || ctx.state !== "running") return;
    const tone = (f, t0, dur) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine"; o.frequency.value = f; o.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(0.0001, ctx.currentTime + t0);
      g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t0 + dur);
      o.start(ctx.currentTime + t0); o.stop(ctx.currentTime + t0 + dur + 0.05);
    };
    tone(880, 0, 0.18); tone(660, 0.22, 0.18); if (urgent) { tone(880, 0.44, 0.18); tone(660, 0.66, 0.18); }
  }, []);
  const toggle = () => setEnabled((e) => { const n = !e; try { localStorage.setItem("chatAlarm", n ? "on" : "off"); } catch { /* */ } return n; });
  return { enabled, toggle, unlocked, unlock, beep };
}

export default function ChatConsole() {
  const { t } = useAdminTranslation();
  const me = getCurrentUser();
  const canManage = true; // server enforces; SALES/MANAGER/IT/DIRECTOR all hold chat.manage
  const isHqAdmin = ["IT", "DIRECTOR"].includes(me?.subRole);
  const alarm = useAlarm();

  const [alerts, setAlerts] = useState(null);
  const [list, setList] = useState([]);
  const [tab, setTab] = useState("needs"); // needs | mine | open | done
  const [country, setCountry] = useState("");
  const [q, setQ] = useState("");
  const [hasContact, setHasContact] = useState(false);
  const [sel, setSel] = useState(null); // selected conversation id
  const [conv, setConv] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState("");
  const [note, setNote] = useState(false);
  const [sending, setSending] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [stats, setStats] = useState(null);
  const lastSeq = useRef(0);
  const bottomRef = useRef(null);

  const query = useMemo(() => {
    const p = new URLSearchParams();
    if (tab === "needs") p.set("status", "waiting_agent");
    if (tab === "mine") { p.set("mine", "1"); p.set("status", "open"); }
    if (tab === "open") p.set("status", "open");
    if (tab === "done") { /* resolved + closed handled below */ }
    if (country) p.set("country", country);
    if (q.trim()) p.set("q", q.trim());
    if (hasContact) p.set("hasContact", "1");
    return p.toString();
  }, [tab, country, q, hasContact]);

  // ── polling ────────────────────────────────────────────────────────────────
  const loadList = useCallback(async () => {
    try {
      if (tab === "done") {
        const [a, b] = await Promise.all([api(`/conversations?${query}&status=resolved`), api(`/conversations?${query}&status=closed`)]);
        setList([...(a.data || []), ...(b.data || [])].sort((x, y) => new Date(y.lastMessageAt) - new Date(x.lastMessageAt)));
      } else {
        const r = await api(`/conversations?${query}`);
        setList(r.data || []);
      }
    } catch (e) { if (e.status !== 401) console.warn(e.message); }
  }, [query, tab]);

  useEffect(() => { loadList(); const id = setInterval(loadList, 8000); return () => clearInterval(id); }, [loadList]);
  useEffect(() => { api("/stats").then((r) => setStats(r.data)).catch(() => {}); }, []);

  // alerts + alarm
  const prevWaiting = useRef(0);
  useEffect(() => {
    let alive = true; let lastBeep = 0;
    const tick = async () => {
      try {
        const { data } = await api("/alerts");
        if (!alive) return;
        setAlerts(data);
        const now = Date.now();
        if (data.alarm && alarm.enabled && now - lastBeep >= (data.repeatSeconds || 30) * 1000) { alarm.beep(data.urgent); lastBeep = now; }
        if (data.waitingForMe > prevWaiting.current) {
          lastBeep = now; if (alarm.enabled) alarm.beep(data.urgent);
          if ("Notification" in window && Notification.permission === "granted") {
            const it = data.items[0];
            try { new Notification(t("chat.notifTitle"), { body: it ? `${flag(it.countryCode)} ${it.who}: ${it.reason || ""}` : "" }); } catch { /* */ }
          }
        }
        prevWaiting.current = data.waitingForMe;
      } catch { /* offline */ }
    };
    tick(); const id = setInterval(tick, 5000);
    return () => { alive = false; clearInterval(id); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alarm.enabled, alarm.beep]);

  // tab-title flash
  useEffect(() => {
    const base = document.title.replace(/^\(\d+\)\s*/, "");
    const n = alerts?.waitingForMe || 0;
    if (!n) { document.title = base; return; }
    let on = true;
    const id = setInterval(() => { document.title = on ? `(${n}) ${t("chat.waitingTitle")}` : base; on = !on; }, 1000);
    return () => { clearInterval(id); document.title = base; };
  }, [alerts?.waitingForMe, t]);

  // open from notification link ?c=
  useEffect(() => { const c = new URLSearchParams(window.location.search).get("c"); if (c) setSel(c); }, []);

  // thread
  const loadThread = useCallback(async (id, reset = false) => {
    if (!id) return;
    try {
      const after = reset ? 0 : lastSeq.current;
      const { data } = await api(`/conversations/${id}?after=${after}`);
      setConv(data.conversation);
      if (reset) setMsgs(data.messages); else if (data.messages.length) setMsgs((m) => [...m, ...data.messages]);
      if (data.messages.length) lastSeq.current = data.messages[data.messages.length - 1].seq;
    } catch (e) { if (e.status === 404) { setSel(null); setConv(null); toast.error(t("chat.notFound")); } }
  }, [t]);
  useEffect(() => { lastSeq.current = 0; setMsgs([]); setConv(null); if (sel) loadThread(sel, true); }, [sel, loadThread]);
  useEffect(() => { if (!sel) return; const id = setInterval(() => loadThread(sel), 3000); return () => clearInterval(id); }, [sel, loadThread]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs.length]);

  const act = async (path, body = {}) => {
    try {
      const r = await api(`/conversations/${sel}${path}`, { method: "POST", body: JSON.stringify({ ...body, after: lastSeq.current }) });
      if (r.data?.conversation) setConv(r.data.conversation);
      if (r.data?.messages?.length) { setMsgs((m) => [...m, ...r.data.messages]); lastSeq.current = r.data.messages[r.data.messages.length - 1].seq; }
      loadList();
      return r;
    } catch (e) { toast.error(e.message); }
  };
  const send = async () => {
    const v = text.trim(); if (!v || sending) return;
    setSending(true);
    const r = await act("/messages", { text: v, internal: note });
    if (r) setText("");
    setSending(false);
  };

  const exportCsv = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/chat/conversations/export.csv?${query}`, { headers: hdr() });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || res.statusText);
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement("a"); a.href = url; a.download = `chat-leads-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (e) { toast.error(e.message); }
  };

  const askNotif = () => { if ("Notification" in window && Notification.permission === "default") Notification.requestPermission(); };
  const closed = conv && ["closed"].includes(conv.status);

  return (
    <div className="p-3 md:p-5 max-w-[1600px] mx-auto" onClick={() => { alarm.unlock(); }}>
      {/* Header + alarm banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-6 h-6 text-blue-600" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t("chat.title")}</h1>
          {alerts && (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-50 text-green-700 dark:bg-green-900/40 dark:text-green-300">
              <Radio className="w-3 h-3" /> {t("chat.onlineNow", { count: alerts.onlineVisitors })}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { alarm.unlock(); alarm.toggle(); askNotif(); }} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm dark:text-gray-200">
            {alarm.enabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />} {alarm.enabled ? t("chat.alarmOn") : t("chat.alarmOff")}
          </button>
          {!alarm.unlocked && alarm.enabled && <span className="text-xs text-amber-600">{t("chat.clickToEnableSound")}</span>}
          <button onClick={exportCsv} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm dark:text-gray-200"><Download className="w-4 h-4" /> {t("chat.exportLeads")}</button>
          {isHqAdmin && <button onClick={() => setShowSettings(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm dark:text-gray-200"><Settings className="w-4 h-4" /> {t("chat.settings")}</button>}
        </div>
      </div>

      {alerts?.waitingForMe > 0 && (
        <div className={`mb-3 rounded-lg px-4 py-2 text-sm flex flex-wrap items-center gap-3 ${alerts.urgent ? "bg-red-600 text-white animate-pulse" : "bg-amber-100 text-amber-900"}`}>
          <Bell className="w-4 h-4" />
          <strong>{alerts.urgent ? t("chat.overdue") : t("chat.waitingForYou", { count: alerts.waitingForMe })}</strong>
          {alerts.items.slice(0, 3).map((it) => (
            <button key={it.id} onClick={() => { setSel(it.id); setTab("needs"); }} className="underline">{flag(it.countryCode)} {it.who} · {timeAgo(it.since)}</button>
          ))}
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-3 text-center">
          {[[t("chat.stats30"), stats.total], [t("chat.statsEscalated"), stats.escalated], [t("chat.statsLeads"), stats.leads], [t("chat.statsAvgResponse"), stats.avgFirstResponseSec != null ? `${stats.avgFirstResponseSec}s` : "—"], [t("chat.statsRating"), stats.avgRating ?? "—"]].map(([l, v]) => (
            <div key={l} className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-2"><div className="text-lg font-semibold dark:text-white">{v}</div><div className="text-[11px] text-gray-500">{l}</div></div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr_300px] gap-3 min-h-[60vh]">
        {/* Inbox */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col max-h-[75vh]">
          <div className="p-2 border-b border-gray-100 dark:border-gray-700 space-y-2">
            <div className="flex gap-1 text-xs">
              {[["needs", t("chat.tabNeeds"), alerts?.waiting], ["mine", t("chat.tabMine")], ["open", t("chat.tabOpen")], ["done", t("chat.tabDone")]].map(([k, l, n]) => (
                <button key={k} onClick={() => setTab(k)} className={`px-2.5 py-1 rounded-full ${tab === k ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-700 dark:text-gray-200"}`}>{l}{n ? ` (${n})` : ""}</button>
              ))}
            </div>
            <div className="relative"><Search className="w-4 h-4 absolute left-2.5 top-2.5 text-gray-400" /><input className={`${INPUT} pl-8`} placeholder={t("chat.searchPlaceholder")} value={q} onChange={(e) => setQ(e.target.value)} /></div>
            <div className="flex items-center gap-2">
              {isHqAdmin && (
                <select className={`${INPUT} py-1`} value={country} onChange={(e) => setCountry(e.target.value)}>
                  <option value="">{t("chat.allCountries")}</option>
                  {["NG", "TG", "BJ", "IT"].map((c) => <option key={c} value={c}>{flag(c)} {c}</option>)}
                </select>
              )}
              <label className="flex items-center gap-1 text-xs whitespace-nowrap dark:text-gray-200"><input type="checkbox" checked={hasContact} onChange={(e) => setHasContact(e.target.checked)} /> {t("chat.hasContact")}</label>
            </div>
          </div>
          <div className="overflow-auto flex-1 divide-y divide-gray-100 dark:divide-gray-700">
            {list.length === 0 && <div className="p-6 text-center text-sm text-gray-400">{t("chat.empty")}</div>}
            {list.map((c) => (
              <button key={c.id} onClick={() => setSel(c.id)} className={`w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${sel === c.id ? "bg-blue-50 dark:bg-gray-700" : ""}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`w-2 h-2 rounded-full ${c.online ? "bg-green-500" : "bg-gray-300"}`} title={c.online ? t("chat.visitorOnline") : t("chat.visitorOffline")} />
                    <span className="font-medium text-sm truncate dark:text-white">{flag(c.countryCode)} {c.visitor?.name || c.visitor?.email || c.visitor?.whatsapp || t("chat.anonymous")}</span>
                  </div>
                  <span className="text-[11px] text-gray-400">{timeAgo(c.lastMessageAt)}</span>
                </div>
                <div className="text-xs text-gray-500 truncate mt-0.5">{c.lastMessagePreview}</div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${STATUS_STYLE[c.status]}`}>{t(`chat.status_${c.status}`)}</span>
                  {c.escalation?.targetRole && c.status === "waiting_agent" && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">{t(`chat.role_${c.escalation.targetRole}`)}</span>}
                  {c.forMe && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-600 text-white">{t("chat.forYou")}</span>}
                  {c.unread > 0 && <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-blue-600 text-white">{c.unread}</span>}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Thread */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col max-h-[75vh]">
          {!conv ? (
            <div className="flex-1 grid place-items-center text-sm text-gray-400 p-10">{t("chat.selectOne")}</div>
          ) : (
            <>
              <div className="p-3 border-b border-gray-100 dark:border-gray-700 flex flex-wrap items-center gap-2">
                <div className="font-semibold dark:text-white">{flag(conv.countryCode)} {conv.visitor?.name || conv.visitor?.email || t("chat.anonymous")}</div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${STATUS_STYLE[conv.status]}`}>{t(`chat.status_${conv.status}`)}</span>
                {conv.assigned && <span className="text-xs text-gray-500 inline-flex items-center gap-1">{conv.assigned.image && <img src={conv.assigned.image} alt="" className="w-4 h-4 rounded-full object-cover" />}{conv.assigned.name} · {conv.assigned.roleLabel}</span>}
                <div className="ml-auto flex flex-wrap gap-1.5">
                  {!closed && (conv.status !== "agent" || !conv.mine) ? (
                    <button onClick={() => act("/takeover")} className="btn-sm bg-blue-600 text-white"><UserCheck className="w-3.5 h-3.5" /> {t("chat.takeOver")}</button>
                  ) : null}
                  {!closed && conv.status !== "ai" && <button onClick={async () => { const r = await act("/hand-back"); if (r) toast.success(t("chat.handedBack")); }} className="btn-sm border"><Bot className="w-3.5 h-3.5" /> {t("chat.handBack")}</button>}
                  {!closed && (
                    <select className="btn-sm border bg-white dark:bg-gray-700 dark:text-white" value="" onChange={(e) => e.target.value && act("/transfer", { role: e.target.value })}>
                      <option value="">{t("chat.transferTo")}</option>
                      {["SALES", "MANAGER", "IT", "DIRECTOR"].map((r) => <option key={r} value={r}>{t(`chat.role_${r}`)}</option>)}
                    </select>
                  )}
                  {!closed && <button onClick={() => act("/close", { resolved: true })} className="btn-sm border"><CheckCircle2 className="w-3.5 h-3.5" /> {t("chat.resolve")}</button>}
                  {!closed && <button onClick={() => window.confirm(t("chat.confirmClose")) && act("/close")} className="btn-sm border text-red-600"><XCircle className="w-3.5 h-3.5" /> {t("chat.close")}</button>}
                </div>
              </div>
              {conv.summary && <div className="px-3 py-2 text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-200 border-b border-amber-100"><strong>{t("chat.aiSummary")}:</strong> {conv.summary}</div>}
              <div className="flex-1 overflow-auto p-3 space-y-2 bg-gray-50 dark:bg-gray-900/40">
                {msgs.map((m) => {
                  if (m.senderType === "system") return <div key={m.seq} className="text-center text-[11px] text-gray-400">{m.text}</div>;
                  const mineSide = m.senderType === "agent";
                  return (
                    <div key={m.seq} className={`flex ${mineSide ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.internal ? "bg-yellow-100 text-yellow-900 border border-yellow-300" : m.senderType === "visitor" ? "bg-white dark:bg-gray-700 dark:text-white border border-gray-200 dark:border-gray-600" : m.senderType === "ai" ? "bg-blue-50 dark:bg-blue-900/30 dark:text-blue-100 border border-blue-100" : "bg-blue-600 text-white"}`}>
                        <div className="text-[10px] opacity-70 mb-0.5 flex items-center gap-1">
                          {m.internal && <StickyNote className="w-3 h-3" />}
                          {m.senderType === "agent" ? `${m.sender?.name} · ${m.sender?.role}` : m.senderType === "ai" ? t("chat.aiAssistant") : t("chat.visitor")}
                          {m.internal && ` · ${t("chat.internalNote")}`}
                        </div>
                        <div className="whitespace-pre-wrap break-words">{m.text}</div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
              {!closed && (
                <div className="p-2 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-1.5 text-xs">
                    <label className="inline-flex items-center gap-1 dark:text-gray-200"><input type="checkbox" checked={note} onChange={(e) => setNote(e.target.checked)} /> {t("chat.internalNote")}</label>
                    {conv.status === "ai" && <span className="text-amber-600">{t("chat.replyWillTakeOver")}</span>}
                  </div>
                  <div className="flex gap-2">
                    <textarea rows={2} className={`${INPUT} resize-none ${note ? "bg-yellow-50" : ""}`} placeholder={note ? t("chat.notePlaceholder") : t("chat.replyPlaceholder")} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} />
                    <button onClick={send} disabled={sending || !text.trim()} className="px-4 rounded-lg bg-blue-600 text-white disabled:opacity-50">{sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Visitor panel */}
        <VisitorPanel conv={conv} t={t} onSaved={(c) => { setConv(c); loadList(); }} />
      </div>

      {showSettings && <SettingsModal t={t} onClose={() => setShowSettings(false)} />}
      <style>{`.btn-sm{display:inline-flex;align-items:center;gap:.3rem;padding:.3rem .6rem;border-radius:.5rem;font-size:.75rem;border-color:#d1d5db}`}</style>
    </div>
  );
}

function VisitorPanel({ conv, t, onSaved }) {
  const [edit, setEdit] = useState(false);
  const [f, setF] = useState({ name: "", email: "", whatsapp: "" });
  useEffect(() => { if (conv) setF({ name: conv.visitor?.name || "", email: conv.visitor?.email || "", whatsapp: conv.visitor?.whatsapp || "" }); setEdit(false); }, [conv?.id]); // eslint-disable-line
  if (!conv) return <div className="hidden lg:block" />;
  const v = conv.visitor || {};
  const save = async () => {
    try { const r = await api(`/conversations/${conv.id}`, { method: "PATCH", body: JSON.stringify({ visitor: f }) }); onSaved(r.data.conversation); setEdit(false); toast.success(t("chat.saved")); } catch (e) { toast.error(e.message); }
  };
  const prio = async (priority) => { try { const r = await api(`/conversations/${conv.id}`, { method: "PATCH", body: JSON.stringify({ priority }) }); onSaved(r.data.conversation); } catch (e) { toast.error(e.message); } };
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-sm space-y-3 max-h-[75vh] overflow-auto">
      <div className="flex items-center justify-between"><h3 className="font-semibold dark:text-white">{t("chat.visitorInfo")}</h3><button className="text-xs text-blue-600" onClick={() => (edit ? save() : setEdit(true))}>{edit ? t("chat.save") : t("chat.edit")}</button></div>
      {edit ? (
        <div className="space-y-2">{["name", "email", "whatsapp"].map((k) => <input key={k} className={INPUT} placeholder={t(`chat.${k}`)} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} />)}</div>
      ) : (
        <ul className="space-y-1.5 dark:text-gray-200">
          <li>{v.name || <span className="text-gray-400">{t("chat.noName")}</span>}</li>
          <li className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{v.email ? <a className="text-blue-600 truncate" href={`mailto:${v.email}`}>{v.email}</a> : <span className="text-gray-400">{t("chat.noEmail")}</span>}</li>
          <li className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{v.whatsapp ? <a className="text-green-600" target="_blank" rel="noreferrer" href={`https://wa.me/${v.whatsapp.replace(/\D/g, "")}`}>{v.whatsapp} · WhatsApp</a> : <span className="text-gray-400">{t("chat.noWhatsapp")}</span>}</li>
        </ul>
      )}
      <dl className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-gray-600 dark:text-gray-300">
        <dt>{t("chat.country")}</dt><dd><Globe className="inline w-3 h-3" /> {flag(conv.countryCode)} {conv.countryCode}</dd>
        <dt>{t("chat.language")}</dt><dd>{conv.language?.toUpperCase()}</dd>
        <dt>{t("chat.channel")}</dt><dd>{conv.channel}</dd>
        <dt>{t("chat.account")}</dt><dd>{v.userId ? t("chat.customer") : t("chat.guest")}</dd>
        <dt>{t("chat.messages")}</dt><dd>{conv.messageCount}</dd>
        <dt>{t("chat.started")}</dt><dd>{new Date(conv.createdAt).toLocaleString()}</dd>
        {conv.rating?.score && (<><dt>{t("chat.rating")}</dt><dd>{"★".repeat(conv.rating.score)}{"☆".repeat(5 - conv.rating.score)}</dd></>)}
      </dl>
      {v.pageUrl && <div className="text-xs break-all text-gray-500">{t("chat.page")}: {v.pageUrl}</div>}
      <div>
        <div className="text-xs text-gray-500 mb-1">{t("chat.priority")}</div>
        <div className="flex gap-1">{["low", "normal", "high", "urgent"].map((p) => <button key={p} onClick={() => prio(p)} className={`text-[11px] px-2 py-0.5 rounded-full border ${conv.priority === p ? "bg-blue-600 text-white border-blue-600" : "dark:text-gray-200"}`}>{t(`chat.prio_${p}`)}</button>)}</div>
      </div>
    </div>
  );
}

function SettingsModal({ t, onClose }) {
  const [s, setS] = useState(null);
  useEffect(() => { api("/settings").then((r) => setS(r.data)).catch((e) => toast.error(e.message)); }, []);
  if (!s) return null;
  const save = async () => {
    try { await api("/settings", { method: "PUT", body: JSON.stringify(s) }); toast.success(t("chat.saved")); onClose(); } catch (e) { toast.error(e.message); }
  };
  const Row = ({ children }) => <div className="mb-3">{children}</div>;
  return (
    <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-lg max-h-[90vh] overflow-auto p-5" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold mb-4 dark:text-white">{t("chat.settingsTitle")}</h2>
        {[["enabled", "chat.setEnabled"], ["aiEnabled", "chat.setAi"], ["requireContactForEscalation", "chat.setRequireContact"]].map(([k, l]) => (
          <Row key={k}><label className="flex items-center gap-2 text-sm dark:text-gray-200"><input type="checkbox" checked={!!s[k]} onChange={(e) => setS({ ...s, [k]: e.target.checked })} /> {t(l)}</label></Row>
        ))}
        <div className="grid grid-cols-2 gap-3">
          <Row><label className="text-xs text-gray-600 dark:text-gray-300">{t("chat.setSla")}</label><input type="number" className={INPUT} value={s.slaSeconds} onChange={(e) => setS({ ...s, slaSeconds: e.target.value })} /></Row>
          <Row><label className="text-xs text-gray-600 dark:text-gray-300">{t("chat.setRepeat")}</label><input type="number" className={INPUT} value={s.alarmRepeatSeconds} onChange={(e) => setS({ ...s, alarmRepeatSeconds: e.target.value })} /></Row>
        </div>
        <Row><label className="text-xs text-gray-600 dark:text-gray-300">{t("chat.setModel")}</label><input className={INPUT} value={s.model || ""} placeholder="gpt-5-mini" onChange={(e) => setS({ ...s, model: e.target.value })} /></Row>
        <Row><label className="text-xs text-gray-600 dark:text-gray-300">{t("chat.setDisabledCountries")}</label><input className={INPUT} value={(s.disabledCountries || []).join(",")} placeholder="TG,BJ" onChange={(e) => setS({ ...s, disabledCountries: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })} /></Row>
        <Row><label className="text-xs text-gray-600 dark:text-gray-300">{t("chat.setInstructions")}</label><textarea rows={5} className={INPUT} value={s.extraInstructions || ""} onChange={(e) => setS({ ...s, extraInstructions: e.target.value })} /></Row>
        <div className="flex justify-end gap-2"><button onClick={onClose} className="px-4 py-2 text-sm border rounded-lg dark:text-gray-200">{t("chat.cancel")}</button><button onClick={save} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg">{t("chat.save")}</button></div>
      </div>
    </div>
  );
}
