import React, { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Plus, ArrowLeft, Eye, Download, FileCheck2, Send, RefreshCw, Trash2, BadgeCheck } from "lucide-react";
import { useAdminTranslation } from "../../hooks/useAdminTranslation.js";
import { handleApiError } from "../../utils/api";
import { Card, ConfirmDialog, Field, inputCls, btnPrimary, btnGhost, btnDanger } from "../../components/campaign/ui.jsx";
import BrandingPicker from "../../components/hr/BrandingPicker.jsx";
import { useHr, hrGet, hrSend, hrFile, money, Spinner, useBranding } from "./hrApi.js";

const TONE = { DRAFT: "bg-gray-100 text-gray-700", APPROVED: "bg-blue-100 text-blue-700", PAID: "bg-green-100 text-green-700" };

export default function HrPayroll() {
  const { t } = useAdminTranslation();
  const { country } = useHr();
  const [runs, setRuns] = useState(null);
  const [run, setRun] = useState(null);
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [sendResult, setSendResult] = useState(null);
  const branding = useBranding(country);
  const [newIds, setNewIds] = useState({ logoId: "", signatureId: "" });
  const [apprSig, setApprSig] = useState("");

  const loadRuns = useCallback(() => hrGet("/payroll", { countryCode: country, limit: 24 }).then((r) => r.success && setRuns(r.data)).catch((e) => toast.error(handleApiError(e, t("hr.loadFailed")))), [country, t]);
  useEffect(() => { loadRuns(); }, [loadRuns]);
  const open = (id) => hrGet(`/payroll/${id}`).then((r) => { if (r.success) { setRun(r.data); setSendResult(null); } }).catch((e) => toast.error(handleApiError(e, t("hr.loadFailed"))));

  const act = async (fn, okMsg) => {
    setBusy(true);
    try { const r = await fn(); if (okMsg) toast.success(okMsg); return r; }
    catch (e) {
      const d = e?.response?.data;
      toast.error(d?.code === "MISSING_BANK" ? `${t("hr.payroll.missingBank")}: ${d.staff.join(", ")}` : handleApiError(e, t("hr.saveFailed")), { duration: 7000 });
    } finally { setBusy(false); }
  };
  const create = () => act(async () => { const r = await hrSend("/payroll", "POST", { period, countryCode: country, ...newIds }); if (r.success) { setRun(r.data); loadRuns(); } }, t("hr.saved"));
  const set = (r) => { if (r?.success) { setRun(r.data); loadRuns(); } };
  const file = (path, opts) => act(() => hrFile(path, opts));

  if (run) {
    const d = run.decimals, c = run.currency, draft = run.status === "DRAFT";
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className={btnGhost} onClick={() => { setRun(null); loadRuns(); }}><ArrowLeft className="h-4 w-4" />{t("common.back")}</button>
          <h2 className="text-lg font-semibold">{t("hr.payroll.run")} {run.period} · {run.countryCode}</h2>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TONE[run.status]}`}>{t(`hr.payrollStatus.${run.status}`)}</span>
          <div className="ml-auto flex flex-wrap gap-2">
            <button type="button" className={btnGhost} disabled={busy} onClick={() => file(`/payroll/${run._id}/preview`)}><Eye className="h-4 w-4" />{t("hr.payroll.preview")}</button>
            <button type="button" className={btnGhost} disabled={busy} onClick={() => file(`/payroll/${run._id}/download`, { mode: "save", filename: `payroll-${run.countryCode}-${run.period}.pdf` })}><Download className="h-4 w-4" />{t("hr.payroll.download")}</button>
            {draft && <button type="button" className={btnGhost} disabled={busy} onClick={() => act(async () => set(await hrSend(`/payroll/${run._id}/recalculate`, "POST")), t("hr.saved"))}><RefreshCw className="h-4 w-4" />{t("hr.payroll.recalculate")}</button>}
            {draft && <button type="button" className={btnPrimary} disabled={busy} onClick={() => setConfirm("approve")}><FileCheck2 className="h-4 w-4" />{t("hr.payroll.approve")}</button>}
            {!draft && <button type="button" className={btnPrimary} disabled={busy} onClick={() => setConfirm("send")}><Send className="h-4 w-4" />{t("hr.payroll.send")}</button>}
            {run.status === "APPROVED" && <button type="button" className={btnGhost} disabled={busy} onClick={() => act(async () => set(await hrSend(`/payroll/${run._id}/mark-paid`, "POST")), t("hr.saved"))}><BadgeCheck className="h-4 w-4" />{t("hr.payroll.markPaid")}</button>}
            {draft && <button type="button" className={btnDanger} disabled={busy} onClick={() => setConfirm("delete")}><Trash2 className="h-4 w-4" /></button>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[["gross", run.totals.gross], ["deductions", run.totals.deductions], ["net", run.totals.net]].map(([k, v]) => <div key={k} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"><div className="text-xs text-gray-500">{t(`hr.payroll.${k}`)}</div><div className="text-lg font-semibold">{money(v, d, c, true)}</div></div>)}
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"><div className="text-xs text-gray-500">{t("hr.dash.headcount")}</div><div className="text-lg font-semibold">{run.totals.headcount}</div></div>
        </div>
        {draft ? (
          <Card title={t("hr.branding.payrollTitle")}>
            <p className="mb-2 text-xs text-gray-500">{t("hr.branding.payrollHint")}</p>
            <BrandingPicker logos={branding.logos} signatures={branding.signatures} logoId={run.branding?.logoId} signatureId={apprSig || run.branding?.signatureId} disabled={busy}
              onChange={(p) => { if (p.signatureId !== undefined) setApprSig(p.signatureId); act(async () => set(await hrSend(`/payroll/${run._id}/branding`, "PUT", { logoId: p.logoId ?? run.branding?.logoId ?? "", signatureId: p.signatureId ?? run.branding?.signatureId ?? "" })), t("hr.saved")); }} />
          </Card>
        ) : null}
        {run.signedBy?.name && <p className="text-sm text-gray-600">{t("hr.payroll.signedBy", { name: run.signedBy.name })} · {new Date(run.signedBy.signedAt).toLocaleString()}</p>}
        {sendResult && <Card title={t("hr.payroll.sendResult")}><p className="text-sm">{t("hr.payroll.sendSummary", { sent: sendResult.sent.length, failed: sendResult.failed.length, none: sendResult.noEmail.length })}</p>{sendResult.failed.length > 0 && <ul className="mt-1 list-disc pl-5 text-xs text-red-700">{sendResult.failed.map((f) => <li key={f.name}>{f.name}: {f.reason}</li>)}</ul>}{sendResult.noEmail.length > 0 && <p className="mt-1 text-xs text-amber-700">{t("hr.payroll.noEmail")}: {sendResult.noEmail.join(", ")}</p>}</Card>}
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <table className="w-full text-left text-sm"><thead className="border-b text-xs uppercase text-gray-500 dark:border-gray-700"><tr><th className="p-3">{t("hr.staff.one")}</th><th className="p-3">{t("hr.staff.sections.bank")}</th><th className="p-3 text-right">{t("hr.payroll.base")}</th><th className="p-3 text-right">{t("hr.payroll.bonus")}</th><th className="p-3 text-right">{t("hr.payroll.overtime")}</th><th className="p-3 text-right">{t("hr.payroll.other")}</th><th className="p-3 text-right">{t("hr.payroll.gross")}</th><th className="p-3 text-right">{t("hr.payroll.deductions")}</th><th className="p-3 text-right">{t("hr.payroll.net")}</th><th /></tr></thead>
            <tbody>{run.lines.map((l) => <Line key={l.staffId} l={l} run={run} draft={draft} t={t} onSaved={set} act={act} onSlip={() => file(`/payroll/${run._id}/download?staffId=${l.staffId}`, { mode: "save", filename: `payslip-${run.period}-${l.employeeId}.pdf` })} />)}</tbody></table>
        </div>
        <ConfirmDialog open={confirm === "approve"} title={t("hr.payroll.approveTitle")} body={t("hr.payroll.approveBody")} confirmLabel={t("hr.payroll.approve")} cancelLabel={t("common.cancel")} busy={busy} onConfirm={async () => { setConfirm(null); await act(async () => set(await hrSend(`/payroll/${run._id}/approve`, "POST", { signatureId: apprSig || run.branding?.signatureId || "" })), t("hr.payroll.approved")); }} onCancel={() => setConfirm(null)} />
        <ConfirmDialog open={confirm === "send"} title={t("hr.payroll.sendTitle")} body={t("hr.payroll.sendBody", { n: run.lines.length })} confirmLabel={t("hr.payroll.send")} cancelLabel={t("common.cancel")} busy={busy} onConfirm={async () => { setConfirm(null); const r = await act(() => hrSend(`/payroll/${run._id}/send`, "POST", {})); if (r?.success) { setSendResult(r.data); open(run._id); } }} onCancel={() => setConfirm(null)} />
        <ConfirmDialog open={confirm === "delete"} danger title={t("hr.payroll.deleteTitle")} body={t("hr.payroll.deleteBody")} confirmLabel={t("common.delete")} cancelLabel={t("common.cancel")} onConfirm={async () => { setConfirm(null); await act(() => hrSend(`/payroll/${run._id}`, "DELETE")); setRun(null); loadRuns(); }} onCancel={() => setConfirm(null)} />
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <Field label={t("hr.payroll.period")}><input type="month" className={`${inputCls} w-auto`} max={new Date().toISOString().slice(0, 7)} value={period} onChange={(e) => setPeriod(e.target.value)} /></Field>
        <button type="button" className={btnPrimary} disabled={busy || !period} onClick={create}><Plus className="h-4 w-4" />{t("hr.payroll.create")}</button>
      </div>
      {(branding.logos.length > 1 || branding.signatures.length > 1) && <Card title={t("hr.branding.payrollTitle")}><BrandingPicker logos={branding.logos} signatures={branding.signatures} logoId={newIds.logoId} signatureId={newIds.signatureId} onChange={(p) => setNewIds({ ...newIds, ...p })} /></Card>}
      {!runs ? <Spinner /> : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <table className="w-full text-left text-sm"><thead className="border-b text-xs uppercase text-gray-500 dark:border-gray-700"><tr><th className="p-3">{t("hr.payroll.period")}</th><th className="p-3">{t("common.status")}</th><th className="p-3 text-right">{t("hr.dash.headcount")}</th><th className="p-3 text-right">{t("hr.payroll.net")}</th></tr></thead>
            <tbody>
              {runs.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-gray-500">{t("hr.payroll.none")}</td></tr>}
              {runs.map((r) => <tr key={r._id} className="cursor-pointer border-b last:border-0 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/40" onClick={() => open(r._id)}><td className="p-3 font-medium">{r.period} · {r.countryCode}</td><td className="p-3"><span className={`rounded-full px-2 py-0.5 text-xs ${TONE[r.status]}`}>{t(`hr.payrollStatus.${r.status}`)}</span></td><td className="p-3 text-right">{r.totals.headcount}</td><td className="p-3 text-right">{money(r.totals.net, r.decimals, r.currency, true)}</td></tr>)}
            </tbody></table>
        </div>)}
    </div>
  );
}

function Line({ l, run, draft, t, onSaved, act, onSlip }) {
  const d = run.decimals;
  const [adj, setAdj] = useState(null);
  const major = (v) => (v || 0) / 10 ** d;
  const start = () => setAdj({ bonus: major(l.bonus), overtime: major(l.overtime), otherDeductions: major(l.otherDeductions), note: l.note || "" });
  const save = async () => { const r = await act(() => hrSend(`/payroll/${run._id}/lines/${l.staffId}`, "PUT", adj), t("hr.saved")); if (r?.success) { onSaved(r); setAdj(null); } };
  return (
    <>
      <tr className="border-b last:border-0 dark:border-gray-700">
        <td className="p-3"><div className="font-medium">{l.fullName}</div><div className="text-xs text-gray-500">{l.employeeId}{l.unpaidLeaveDays ? ` · ${t("hr.payroll.unpaidDays", { n: l.unpaidLeaveDays })}` : ""}</div></td>
        <td className="p-3 text-xs">{l.bank.bankName || <span className="text-red-600">{t("hr.payroll.noBank")}</span>}<div className="text-gray-500">{l.bank.accountName} {l.bank.accountMasked}</div></td>
        <td className="p-3 text-right">{money(l.baseSalary, d, "", true)}</td><td className="p-3 text-right">{money(l.bonus, d, "", true)}</td><td className="p-3 text-right">{money(l.overtime, d, "", true)}</td><td className="p-3 text-right">{money(l.otherDeductions, d, "", true)}</td>
        <td className="p-3 text-right">{money(l.gross, d, "", true)}</td><td className="p-3 text-right">{money(l.totalDeductions, d, "", true)}</td><td className="p-3 text-right font-semibold">{money(l.net, d, "", true)}</td>
        <td className="p-3 text-right whitespace-nowrap">{draft && <button type="button" className="text-blue-600 hover:underline" onClick={adj ? () => setAdj(null) : start}>{t("hr.payroll.adjust")}</button>}{!draft && <button type="button" className="text-blue-600 hover:underline" onClick={onSlip}>{t("hr.payroll.payslip")}</button>}</td>
      </tr>
      {adj && <tr className="bg-gray-50 dark:bg-gray-900/40"><td colSpan={10} className="p-3"><div className="grid gap-2 md:grid-cols-5">
        {["bonus", "overtime", "otherDeductions"].map((k) => <Field key={k} label={t(`hr.payroll.${k === "otherDeductions" ? "other" : k}`)}><input type="number" min="0" className={inputCls} value={adj[k]} onChange={(e) => setAdj({ ...adj, [k]: e.target.value })} /></Field>)}
        <Field label={t("hr.att.note")}><input className={inputCls} maxLength={200} value={adj.note} onChange={(e) => setAdj({ ...adj, note: e.target.value })} /></Field>
        <div className="flex items-end"><button type="button" className={btnPrimary} onClick={save}>{t("common.save")}</button></div></div></td></tr>}
    </>
  );
}
