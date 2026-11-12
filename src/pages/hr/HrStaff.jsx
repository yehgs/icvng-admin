import React, { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Search, ArrowLeft, Save, Eye, EyeOff, UserMinus } from "lucide-react";
import { useAdminTranslation } from "../../hooks/useAdminTranslation.js";
import { handleApiError } from "../../utils/api";
import { Card, ConfirmDialog, Field, inputCls, btnPrimary, btnGhost, btnDanger } from "../../components/campaign/ui.jsx";
import StaffForm, { emptyStaff, staffToForm, formToPayload } from "../../components/hr/StaffForm.jsx";
import { useHr, hrGet, hrSend, Spinner, day } from "./hrApi.js";

const TONE = { ACTIVE: "bg-green-100 text-green-700", ON_LEAVE: "bg-amber-100 text-amber-800", SUSPENDED: "bg-red-100 text-red-700", TERMINATED: "bg-gray-200 text-gray-600" };

export default function HrStaff() {
  const { t } = useAdminTranslation();
  const { country, meta, can } = useHr();
  const [filters, setFilters] = useState({ q: "", status: "", workMode: "" });
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState(null);
  const [pg, setPg] = useState({ pages: 1, total: 0 });
  const [offices, setOffices] = useState([]);
  const [edit, setEdit] = useState(null); // { id, form, masked, linkUser }
  const [candidates, setCandidates] = useState([]);
  const [saving, setSaving] = useState(false);
  const [secret, setSecret] = useState(null);
  const [confirm, setConfirm] = useState(false);

  const load = useCallback(async () => {
    try { const r = await hrGet("/staff", { countryCode: country, page, limit: 20, q: filters.q, status: filters.status, workMode: filters.workMode }); if (r.success) { setRows(r.data); setPg(r.pagination); } }
    catch (e) { toast.error(handleApiError(e, t("hr.loadFailed"))); }
  }, [country, page, filters, t]);
  useEffect(() => { const id = setTimeout(load, 250); return () => clearTimeout(id); }, [load]);
  useEffect(() => { hrGet("/offices", { countryCode: country }).then((r) => r.success && setOffices(r.data)).catch(() => {}); }, [country]);

  const cur = meta.countries.find((c) => c.code === country);
  const openNew = async () => {
    setSecret(null); setEdit({ id: null, form: emptyStaff({ salary: { ...emptyStaff().salary, currency: cur?.currency || "" } }), masked: "", linkUser: "" });
    try { const r = await hrGet("/staff-candidates", { countryCode: country }); if (r.success) setCandidates(r.data); } catch { setCandidates([]); }
  };
  const openEdit = (s) => { setSecret(null); setEdit({ id: s._id, form: staffToForm(s), masked: s.bank?.accountMasked, employeeId: s.employeeId }); };

  const save = async () => {
    setSaving(true);
    try {
      const payload = formToPayload(edit.form, { isNew: !edit.id });
      if (!edit.id) { payload.countryCode = country; if (edit.linkUser) payload.userId = edit.linkUser; }
      const r = edit.id ? await hrSend(`/staff/${edit.id}`, "PUT", payload) : await hrSend("/staff", "POST", payload);
      if (r.success) { toast.success(t("hr.saved")); setEdit(null); load(); }
    } catch (e) { toast.error(handleApiError(e, t("hr.saveFailed"))); } finally { setSaving(false); }
  };
  const reveal = async () => { try { const r = await hrGet(`/staff/${edit.id}/sensitive`); if (r.success) setSecret(r.data); } catch (e) { toast.error(handleApiError(e, t("hr.saveFailed"))); } };
  const terminate = async () => { try { await hrSend(`/staff/${edit.id}`, "DELETE"); toast.success(t("hr.saved")); setConfirm(false); setEdit(null); load(); } catch (e) { toast.error(handleApiError(e, t("hr.saveFailed"))); } };

  if (edit) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className={btnGhost} onClick={() => setEdit(null)}><ArrowLeft className="h-4 w-4" />{t("common.back")}</button>
          <h2 className="text-lg font-semibold">{edit.id ? edit.form.fullName : t("hr.staff.add")}</h2>{edit.employeeId && <span className="rounded bg-gray-100 px-2 py-0.5 text-xs dark:bg-gray-700">{edit.employeeId}</span>}
          <div className="ml-auto flex gap-2">
            {edit.id && can.manage && <button type="button" className={btnGhost} onClick={secret ? () => setSecret(null) : reveal}>{secret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}{secret ? t("hr.staff.hideSensitive") : t("hr.staff.showSensitive")}</button>}
            {edit.id && can.manage && edit.form.employment.status !== "TERMINATED" && <button type="button" className={btnDanger} onClick={() => setConfirm(true)}><UserMinus className="h-4 w-4" />{t("hr.staff.terminate")}</button>}
            {can.manage && <button type="button" className={btnPrimary} disabled={saving || !edit.form.fullName && !edit.linkUser} onClick={save}><Save className="h-4 w-4" />{t("common.save")}</button>}
          </div>
        </div>
        {secret && (
          <Card title={t("hr.staff.sensitive")}>
            <p className="mb-2 text-xs text-amber-700">{t("hr.staff.auditedNotice")}</p>
            <dl className="grid gap-2 text-sm md:grid-cols-3"><div><dt className="text-xs text-gray-500">{t("hr.staff.accountNumber")}</dt><dd className="font-mono">{secret.accountNumber || "—"}</dd></div><div><dt className="text-xs text-gray-500">{t("hr.staff.taxId")}</dt><dd className="font-mono">{secret.taxId || "—"}</dd></div><div><dt className="text-xs text-gray-500">{t("hr.staff.healthNotes")}</dt><dd>{secret.healthNotes || "—"}</dd></div></dl>
          </Card>)}
        {!edit.id && (
          <Card title={t("hr.staff.linkAccount")}>
            <Field label={t("hr.staff.linkHint")}><select className={inputCls} value={edit.linkUser} onChange={(e) => { const u = candidates.find((c) => c._id === e.target.value); setEdit({ ...edit, linkUser: e.target.value, form: { ...edit.form, fullName: edit.form.fullName || u?.name || "" } }); }}><option value="">{t("hr.staff.noAccount")}</option>{candidates.map((u) => <option key={u._id} value={u._id}>{u.name} — {u.subRole} ({u.email})</option>)}</select></Field>
          </Card>)}
        <StaffForm value={edit.form} onChange={(form) => setEdit({ ...edit, form })} offices={offices} masked={edit.masked} defaultCurrency={cur?.currency} />
        <ConfirmDialog open={confirm} danger title={t("hr.staff.terminateTitle")} body={t("hr.staff.terminateBody")} confirmLabel={t("hr.staff.terminate")} cancelLabel={t("common.cancel")} onConfirm={terminate} onCancel={() => setConfirm(false)} />
      </div>
    );
  }
  const setF = (p) => { setPage(1); setFilters((f) => ({ ...f, ...p })); };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[220px] flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" /><input className={`${inputCls} pl-9`} placeholder={t("hr.staff.searchPlaceholder")} value={filters.q} onChange={(e) => setF({ q: e.target.value })} /></div>
        <select className={`${inputCls} w-auto`} value={filters.status} onChange={(e) => setF({ status: e.target.value })}><option value="">{t("hr.all")}</option>{["ACTIVE", "ON_LEAVE", "SUSPENDED", "TERMINATED"].map((s) => <option key={s} value={s}>{t(`hr.empStatus.${s}`)}</option>)}</select>
        <select className={`${inputCls} w-auto`} value={filters.workMode} onChange={(e) => setF({ workMode: e.target.value })}><option value="">{t("hr.staff.workMode")}</option>{["FULL_TIME", "HYBRID", "REMOTE"].map((s) => <option key={s} value={s}>{t(`hr.workMode.${s}`)}</option>)}</select>
        {can.manage && <button type="button" className={btnPrimary} onClick={openNew}><Plus className="h-4 w-4" />{t("hr.staff.add")}</button>}
      </div>
      {!rows ? <Spinner /> : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <table className="w-full text-left text-sm"><thead className="border-b text-xs uppercase text-gray-500 dark:border-gray-700"><tr><th className="p-3">{t("hr.staff.one")}</th><th className="p-3">{t("hr.staff.jobTitle")}</th><th className="p-3">{t("hr.staff.workMode")}</th><th className="p-3">{t("hr.staff.startDate")}</th><th className="p-3">{t("common.status")}</th></tr></thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-gray-500">{t("hr.staff.none")}</td></tr>}
              {rows.map((s) => (
                <tr key={s._id} className="cursor-pointer border-b last:border-0 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/40" onClick={() => openEdit(s)}>
                  <td className="p-3"><div className="flex items-center gap-3">{s.photoUrl ? <img src={s.photoUrl} alt="" className="h-9 w-9 rounded-full object-cover" /> : <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-gray-700">{s.fullName.charAt(0)}</div>}<div><div className="font-medium">{s.fullName}</div><div className="text-xs text-gray-500">{s.employeeId}{s.userId ? "" : ` · ${t("hr.staff.noLogin")}`}</div></div></div></td>
                  <td className="p-3">{s.employment.jobTitle}<div className="text-xs text-gray-500">{s.employment.department}</div></td>
                  <td className="p-3">{t(`hr.workMode.${s.employment.workMode}`)}</td><td className="p-3">{day(s.employment.startDate)}</td>
                  <td className="p-3"><span className={`rounded-full px-2 py-0.5 text-xs ${TONE[s.employment.status]}`}>{t(`hr.empStatus.${s.employment.status}`)}</span></td>
                </tr>))}
            </tbody></table>
        </div>)}
      {pg.pages > 1 && <div className="flex items-center justify-center gap-3 text-sm"><button className={btnGhost} disabled={page <= 1} onClick={() => setPage(page - 1)}>‹</button><span>{page} / {pg.pages}</span><button className={btnGhost} disabled={page >= pg.pages} onClick={() => setPage(page + 1)}>›</button></div>}
    </div>
  );
}
