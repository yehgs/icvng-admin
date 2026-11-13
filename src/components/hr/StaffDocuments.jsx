import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FileDown, Mail, ShieldCheck, Lock } from "lucide-react";
import { useAdminTranslation } from "../../hooks/useAdminTranslation.js";
import { handleApiError } from "../../utils/api";
import { Card, Field, inputCls, btnPrimary, btnGhost } from "../campaign/ui.jsx";
import BrandingPicker from "./BrandingPicker.jsx";
import { useHr, hrFile, hrGet, hrSend, hrPostFile, useBranding } from "../../pages/hr/hrApi.js";

/** Asks the signed-in user to re-enter THEIR password, then runs `onConfirm(password)`; shows wrong-password / lock-out inline. */
export function PasswordModal({ open, title, hint, confirmLabel, onConfirm, onClose }) {
  const { t } = useAdminTranslation();
  const [pw, setPw] = useState(""), [err, setErr] = useState(""), [busy, setBusy] = useState(false);
  useEffect(() => { if (open) { setPw(""); setErr(""); setBusy(false); } }, [open]);
  if (!open) return null;
  const submit = async (e) => {
    e.preventDefault(); if (!pw || busy) return;
    setBusy(true); setErr("");
    try { await onConfirm(pw); setPw(""); onClose(); }
    catch (x) {
      setPw("");
      if (x.status === 429) setErr(t("hr.docs.locked", { min: Math.max(1, Math.ceil((x.retryAfter || 900) / 60)) }));
      else if (x.status === 403) setErr(t("hr.docs.wrongPassword"));
      else setErr(x.message || t("hr.saveFailed"));
    } finally { setBusy(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="pw-title">
      <form onSubmit={submit} className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl dark:bg-gray-800">
        <div className="mb-2 flex items-center gap-2"><Lock className="h-5 w-5 text-amber-600" /><h3 id="pw-title" className="text-base font-semibold">{title}</h3></div>
        <p className="mb-3 text-sm text-gray-600 dark:text-gray-300">{hint}</p>
        <Field label={t("hr.docs.yourPassword")}><input type="password" autoFocus autoComplete="current-password" className={inputCls} value={pw} onChange={(e) => setPw(e.target.value)} /></Field>
        {err && <p role="alert" className="mt-2 text-sm text-red-600">{err}</p>}
        <div className="mt-4 flex justify-end gap-2"><button type="button" className={btnGhost} onClick={onClose}>{t("common.cancel")}</button><button type="submit" className={btnPrimary} disabled={!pw || busy}>{busy ? "…" : confirmLabel}</button></div>
      </form>
    </div>
  );
}

/** Export card for one already-open staff member (used on the staff edit screen). */
export function ExportOne({ staff, country }) {
  const { t } = useAdminTranslation();
  const branding = useBranding(country);
  const [ids, setIds] = useState({ logoId: "", signatureId: "" });
  const [includeSensitive, setIncludeSensitive] = useState(false);
  const [ask, setAsk] = useState(false);
  const run = (password) => hrPostFile(`/staff/${staff._id}/export`, { password, includeSensitive, ...ids }, { filename: `staff-${staff.employeeId || "details"}.pdf` }).then(() => toast.success(t("hr.docs.exported")));
  return (
    <Card title={t("hr.docs.exportTitle")}>
      <p className="mb-3 text-xs text-gray-500">{t("hr.docs.exportHint")}</p>
      <BrandingPicker logos={branding.logos} signatures={branding.signatures} logoId={ids.logoId} signatureId={ids.signatureId} onChange={(p) => setIds({ ...ids, ...p })} />
      <label className="mt-3 flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1" checked={includeSensitive} onChange={(e) => setIncludeSensitive(e.target.checked)} /><span>{t("hr.docs.includeSensitive")}<span className="block text-xs text-amber-700">{t("hr.docs.includeSensitiveHint")}</span></span></label>
      <button type="button" className={`${btnPrimary} mt-3`} onClick={() => setAsk(true)}><ShieldCheck className="h-4 w-4" />{t("hr.docs.exportBtn")}</button>
      <PasswordModal open={ask} title={t("hr.docs.pwTitle")} hint={t("hr.docs.pwHint", { name: staff.fullName || "" })} confirmLabel={t("hr.docs.exportBtn")} onConfirm={run} onClose={() => setAsk(false)} />
    </Card>
  );
}

/** "Forms & exports" panel on the staff list. */
export default function StaffDocuments() {
  const { t } = useAdminTranslation();
  const { country, can } = useHr();
  const branding = useBranding(country);
  const [formIds, setFormIds] = useState({ logoId: "" });
  const [to, setTo] = useState("");
  const [busy, setBusy] = useState("");
  const [people, setPeople] = useState([]);
  const [staffId, setStaffId] = useState("");
  const [exportIds, setExportIds] = useState({ logoId: "", signatureId: "" });
  const [includeSensitive, setIncludeSensitive] = useState(false);
  const [askPw, setAskPw] = useState(false);

  useEffect(() => { setStaffId(""); hrGet("/staff", { countryCode: country, limit: 100 }).then((r) => r.success && setPeople(r.data)).catch(() => setPeople([])); }, [country]);
  const chosen = people.find((p) => p._id === staffId);

  const download = async () => { setBusy("dl"); try { await hrFile(`/forms/staff-form?countryCode=${country}&logoId=${formIds.logoId || ""}`, { mode: "save", filename: `staff-information-form-${country}.pdf` }); } catch (e) { toast.error(e.message || t("hr.saveFailed")); } finally { setBusy(""); } };
  const email = async () => { setBusy("mail"); try { await hrSend("/forms/staff-form/send", "POST", { to, logoId: formIds.logoId, countryCode: country }); toast.success(t("hr.docs.emailed", { to })); setTo(""); } catch (e) { toast.error(handleApiError(e, t("hr.saveFailed"))); } finally { setBusy(""); } };
  const doExport = (password) => hrPostFile(`/staff/${staffId}/export`, { password, includeSensitive, ...exportIds }, { filename: `staff-${chosen?.employeeId || "details"}.pdf` }).then(() => toast.success(t("hr.docs.exported")));

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title={t("hr.docs.blankTitle")}>
        <p className="mb-3 text-xs text-gray-500">{t("hr.docs.blankHint")}</p>
        <BrandingPicker logos={branding.logos} logoId={formIds.logoId} showSignature={false} onChange={(p) => setFormIds({ ...formIds, ...p })} />
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <button type="button" className={btnPrimary} disabled={busy === "dl"} onClick={download}><FileDown className="h-4 w-4" />{t("hr.docs.downloadBlank")}</button>
          {can.manage && <>
            <Field label={t("hr.docs.emailTo")} className="min-w-[200px] flex-1"><input type="email" className={inputCls} placeholder="name@example.com" value={to} onChange={(e) => setTo(e.target.value)} /></Field>
            <button type="button" className={btnGhost} disabled={busy === "mail" || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(to)} onClick={email}><Mail className="h-4 w-4" />{t("hr.docs.emailBlank")}</button>
          </>}
        </div>
      </Card>
      {can.manage && (
        <Card title={t("hr.docs.exportTitle")}>
          <p className="mb-3 text-xs text-gray-500">{t("hr.docs.exportHint")}</p>
          <Field label={t("hr.docs.pickStaff")}><select className={inputCls} value={staffId} onChange={(e) => setStaffId(e.target.value)}><option value="">{t("hr.docs.selectStaff")}</option>{people.map((p) => <option key={p._id} value={p._id}>{p.fullName} — {p.employeeId}</option>)}</select></Field>
          <div className="mt-3"><BrandingPicker logos={branding.logos} signatures={branding.signatures} logoId={exportIds.logoId} signatureId={exportIds.signatureId} onChange={(p) => setExportIds({ ...exportIds, ...p })} /></div>
          <label className="mt-3 flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1" checked={includeSensitive} onChange={(e) => setIncludeSensitive(e.target.checked)} /><span>{t("hr.docs.includeSensitive")}<span className="block text-xs text-amber-700">{t("hr.docs.includeSensitiveHint")}</span></span></label>
          <button type="button" className={`${btnPrimary} mt-3`} disabled={!staffId} onClick={() => setAskPw(true)}><ShieldCheck className="h-4 w-4" />{t("hr.docs.exportBtn")}</button>
        </Card>)}
      <PasswordModal open={askPw} title={t("hr.docs.pwTitle")} hint={t("hr.docs.pwHint", { name: chosen?.fullName || "" })} confirmLabel={t("hr.docs.exportBtn")} onConfirm={doExport} onClose={() => setAskPw(false)} />
    </div>
  );
}
