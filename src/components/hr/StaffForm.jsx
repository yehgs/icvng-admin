// admin/src/components/hr/StaffForm.jsx
//
// The detailed staff record form (personal, address, emergency contact, health, employment, salary, bank).
// Shared by the HR module and User Management ("add staff details with the account").
// Secrets (account number, tax id, health notes) are write-only here: when editing, leave them blank to keep
// the stored value; the masked account is shown for reference.
import React, { useState } from "react";
import { Plus, Trash2, Upload } from "lucide-react";
import toast from "react-hot-toast";
import { fileAPI } from "../../utils/api";
import { useAdminTranslation } from "../../hooks/useAdminTranslation.js";
import { Card, Field, inputCls, btnGhost } from "../campaign/ui.jsx";

const d = (v) => (v ? new Date(v).toISOString().slice(0, 10) : "");
export const emptyStaff = (over = {}) => ({
  fullName: "", gender: "UNDISCLOSED", dateOfBirth: "", maritalStatus: "", nationality: "", phone: "", personalEmail: "", photoUrl: "",
  address: { line1: "", line2: "", city: "", state: "", country: "", postalCode: "" },
  emergencyContact: { name: "", relationship: "", phone: "" },
  health: { status: "UNDISCLOSED", bloodGroup: "", genotype: "", notes: "" },
  employment: { jobTitle: "", department: "", employmentType: "PERMANENT", workMode: "FULL_TIME", status: "ACTIVE", startDate: "", probationEndDate: "", contractEndDate: "", officeId: "", hybridOfficeDays: [] },
  salary: { currency: "", baseSalary: "", allowances: [], deductions: [] },
  bank: { bankName: "", accountName: "", accountNumber: "", branch: "", sortCode: "", taxId: "", pensionId: "" },
  leaveEntitlementDays: 20, notes: "", ...over,
});
/** API record → form state (secrets are never returned, so they start blank). */
export const staffToForm = (s) => emptyStaff({
  ...s, dateOfBirth: d(s.dateOfBirth),
  address: { ...emptyStaff().address, ...s.address }, emergencyContact: { ...emptyStaff().emergencyContact, ...s.emergencyContact },
  health: { status: s.health?.status || "UNDISCLOSED", bloodGroup: s.health?.bloodGroup || "", genotype: s.health?.genotype || "", notes: "" },
  employment: { ...emptyStaff().employment, ...s.employment, startDate: d(s.employment?.startDate), probationEndDate: d(s.employment?.probationEndDate), contractEndDate: d(s.employment?.contractEndDate), officeId: s.employment?.officeId?._id || s.employment?.officeId || "" },
  salary: { currency: s.salary?.currency || "", baseSalary: s.salary?.baseSalary ?? "", allowances: s.salary?.allowances || [], deductions: s.salary?.deductions || [] },
  bank: { ...emptyStaff().bank, bankName: s.bank?.bankName || "", accountName: s.bank?.accountName || "", branch: s.bank?.branch || "", sortCode: s.bank?.sortCode || "", pensionId: s.bank?.pensionId || "" },
});
/** Form state → API payload; blank secrets are omitted so they are not overwritten. */
export function formToPayload(f, { isNew }) {
  const p = JSON.parse(JSON.stringify(f));
  delete p._id; delete p.employeeId; delete p.countryCode; delete p.createdAt; delete p.updatedAt; delete p.__v; delete p.createdBy; delete p.updatedBy; delete p.userId;
  if (!isNew) { for (const k of ["accountNumber", "taxId"]) if (!p.bank[k]) delete p.bank[k]; if (!p.health.notes) delete p.health.notes; }
  if (p.salary.baseSalary === "") delete p.salary.baseSalary;
  if (!p.salary.currency) delete p.salary.currency;
  if (!p.employment.officeId) p.employment.officeId = null;
  for (const k of ["startDate", "probationEndDate", "contractEndDate"]) if (!p.employment[k]) p.employment[k] = "";
  return p;
}

const Sel = ({ value, onChange, options, label, t }) => <select className={inputCls} value={value} onChange={(e) => onChange(e.target.value)}>{options.map((o) => <option key={o} value={o}>{t(`${label}.${o}`)}</option>)}</select>;

export default function StaffForm({ value, onChange, offices = [], masked = "", compact = false, defaultCurrency = "" }) {
  const { t } = useAdminTranslation();
  const [uploading, setUploading] = useState(false);
  const f = value;
  const up = (path, v) => { const next = JSON.parse(JSON.stringify(f)); const parts = path.split("."); let o = next; parts.slice(0, -1).forEach((k) => (o = o[k])); o[parts.at(-1)] = v; onChange(next); };
  const upload = async (e) => {
    const file = e.target.files?.[0]; if (!file) return; setUploading(true);
    try { const r = await fileAPI.uploadImage(file); if (r?.data?.url) up("photoUrl", r.data.url); } catch { toast.error(t("hr.staff.uploadFailed")); } finally { setUploading(false); }
  };
  const days = ["0", "1", "2", "3", "4", "5", "6"];
  const list = (key, blank) => (
    <div className="space-y-2">
      {f.salary[key].map((row, i) => (
        <div key={i} className="grid grid-cols-[2fr_1fr_auto] gap-2 md:grid-cols-[2fr_1fr_1fr_1fr_auto]">
          <input className={inputCls} placeholder={t("hr.staff.itemName")} value={row.name} onChange={(e) => up(`salary.${key}.${i}.name`, e.target.value)} />
          {key === "deductions" && <select className={inputCls} value={row.type} onChange={(e) => up(`salary.${key}.${i}.type`, e.target.value)}><option value="FIXED">{t("hr.staff.fixed")}</option><option value="PERCENT">%</option></select>}
          <input className={inputCls} type="number" min="0" value={row.amount ?? row.value} onChange={(e) => up(`salary.${key}.${i}.${key === "deductions" ? "value" : "amount"}`, e.target.value)} />
          {key === "deductions" && row.type === "PERCENT" && <select className={inputCls} value={row.of} onChange={(e) => up(`salary.${key}.${i}.of`, e.target.value)}><option value="GROSS">{t("hr.staff.ofGross")}</option><option value="BASE">{t("hr.staff.ofBase")}</option></select>}
          <button type="button" aria-label={t("common.delete")} className="p-2 text-red-600" onClick={() => up(`salary.${key}`, f.salary[key].filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></button>
        </div>))}
      <button type="button" className={btnGhost} onClick={() => up(`salary.${key}`, [...f.salary[key], blank])}><Plus className="h-4 w-4" />{t("common.add")}</button>
    </div>
  );
  const g = compact ? "grid gap-3 md:grid-cols-2" : "grid gap-3 md:grid-cols-3";
  return (
    <div className="space-y-4">
      <Card title={t("hr.staff.sections.personal")}>
        <div className="mb-3 flex items-center gap-3">
          {f.photoUrl ? <img src={f.photoUrl} alt="" className="h-16 w-16 rounded-full object-cover" /> : <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-xl text-gray-400 dark:bg-gray-700">{(f.fullName || "?").charAt(0)}</div>}
          <label className={`${btnGhost} cursor-pointer`}><Upload className="h-4 w-4" />{uploading ? "…" : t("hr.staff.photo")}<input type="file" accept="image/*" className="hidden" onChange={upload} /></label>
        </div>
        <div className={g}>
          <Field label={t("hr.staff.fullName")}><input className={inputCls} maxLength={120} value={f.fullName} onChange={(e) => up("fullName", e.target.value)} /></Field>
          <Field label={t("hr.staff.gender")}><Sel t={t} label="hr.gender" value={f.gender} onChange={(v) => up("gender", v)} options={["MALE", "FEMALE", "OTHER", "UNDISCLOSED"]} /></Field>
          <Field label={t("hr.staff.dob")}><input type="date" className={inputCls} value={f.dateOfBirth} onChange={(e) => up("dateOfBirth", e.target.value)} /></Field>
          <Field label={t("hr.staff.marital")}><select className={inputCls} value={f.maritalStatus} onChange={(e) => up("maritalStatus", e.target.value)}>{["", "SINGLE", "MARRIED", "DIVORCED", "WIDOWED", "OTHER"].map((o) => <option key={o} value={o}>{o ? t(`hr.marital.${o}`) : "—"}</option>)}</select></Field>
          <Field label={t("hr.staff.nationality")}><input className={inputCls} value={f.nationality} onChange={(e) => up("nationality", e.target.value)} /></Field>
          <Field label={t("hr.staff.phone")}><input className={inputCls} value={f.phone} onChange={(e) => up("phone", e.target.value)} /></Field>
          <Field label={t("hr.staff.personalEmail")}><input type="email" className={inputCls} value={f.personalEmail} onChange={(e) => up("personalEmail", e.target.value)} /></Field>
        </div>
      </Card>
      <Card title={t("hr.staff.sections.address")}>
        <div className={g}>
          <Field label={t("hr.staff.line1")}><input className={inputCls} value={f.address.line1} onChange={(e) => up("address.line1", e.target.value)} /></Field>
          <Field label={t("hr.staff.line2")}><input className={inputCls} value={f.address.line2} onChange={(e) => up("address.line2", e.target.value)} /></Field>
          <Field label={t("hr.staff.city")}><input className={inputCls} value={f.address.city} onChange={(e) => up("address.city", e.target.value)} /></Field>
          <Field label={t("hr.staff.state")}><input className={inputCls} value={f.address.state} onChange={(e) => up("address.state", e.target.value)} /></Field>
          <Field label={t("hr.staff.country")}><input className={inputCls} value={f.address.country} onChange={(e) => up("address.country", e.target.value)} /></Field>
          <Field label={t("hr.staff.postal")}><input className={inputCls} value={f.address.postalCode} onChange={(e) => up("address.postalCode", e.target.value)} /></Field>
        </div>
        <h4 className="mb-2 mt-4 text-xs font-semibold uppercase text-gray-500">{t("hr.staff.emergency")}</h4>
        <div className={g}>
          <Field label={t("hr.staff.fullName")}><input className={inputCls} value={f.emergencyContact.name} onChange={(e) => up("emergencyContact.name", e.target.value)} /></Field>
          <Field label={t("hr.staff.relationship")}><input className={inputCls} value={f.emergencyContact.relationship} onChange={(e) => up("emergencyContact.relationship", e.target.value)} /></Field>
          <Field label={t("hr.staff.phone")}><input className={inputCls} value={f.emergencyContact.phone} onChange={(e) => up("emergencyContact.phone", e.target.value)} /></Field>
        </div>
      </Card>
      <Card title={t("hr.staff.sections.employment")}>
        <div className={g}>
          <Field label={t("hr.staff.jobTitle")}><input className={inputCls} value={f.employment.jobTitle} onChange={(e) => up("employment.jobTitle", e.target.value)} /></Field>
          <Field label={t("hr.staff.department")}><input className={inputCls} value={f.employment.department} onChange={(e) => up("employment.department", e.target.value)} /></Field>
          <Field label={t("hr.staff.employmentType")}><Sel t={t} label="hr.empType" value={f.employment.employmentType} onChange={(v) => up("employment.employmentType", v)} options={["PERMANENT", "CONTRACT", "PART_TIME", "INTERN"]} /></Field>
          <Field label={t("hr.staff.workMode")} hint={t("hr.staff.workModeHint")}><Sel t={t} label="hr.workMode" value={f.employment.workMode} onChange={(v) => up("employment.workMode", v)} options={["FULL_TIME", "HYBRID", "REMOTE"]} /></Field>
          <Field label={t("common.status")}><Sel t={t} label="hr.empStatus" value={f.employment.status} onChange={(v) => up("employment.status", v)} options={["ACTIVE", "ON_LEAVE", "SUSPENDED", "TERMINATED"]} /></Field>
          <Field label={t("hr.staff.startDate")}><input type="date" className={inputCls} value={f.employment.startDate} onChange={(e) => up("employment.startDate", e.target.value)} /></Field>
          <Field label={t("hr.staff.probationEnd")}><input type="date" className={inputCls} value={f.employment.probationEndDate} onChange={(e) => up("employment.probationEndDate", e.target.value)} /></Field>
          <Field label={t("hr.staff.contractEnd")}><input type="date" className={inputCls} value={f.employment.contractEndDate} onChange={(e) => up("employment.contractEndDate", e.target.value)} /></Field>
          <Field label={t("hr.staff.office")}><select className={inputCls} value={f.employment.officeId} onChange={(e) => up("employment.officeId", e.target.value)}><option value="">—</option>{offices.map((o) => <option key={o._id} value={o._id}>{o.name}</option>)}</select></Field>
          <Field label={t("hr.staff.leaveDays")}><input type="number" min="0" max="366" className={inputCls} value={f.leaveEntitlementDays} onChange={(e) => up("leaveEntitlementDays", e.target.value)} /></Field>
        </div>
        {f.employment.workMode === "HYBRID" && (
          <div className="mt-3"><span className="mb-1 block text-sm font-medium">{t("hr.staff.hybridDays")}</span><div className="flex flex-wrap gap-3">{days.map((n) => <label key={n} className="inline-flex items-center gap-1 text-sm"><input type="checkbox" checked={f.employment.hybridOfficeDays.includes(Number(n))} onChange={(e) => up("employment.hybridOfficeDays", e.target.checked ? [...f.employment.hybridOfficeDays, Number(n)] : f.employment.hybridOfficeDays.filter((x) => x !== Number(n)))} />{t(`hr.weekday.${n}`)}</label>)}</div></div>
        )}
      </Card>
      <Card title={t("hr.staff.sections.salary")}>
        <div className={g}>
          <Field label={t("hr.staff.currency")}><input className={inputCls} maxLength={3} placeholder={defaultCurrency} value={f.salary.currency} onChange={(e) => up("salary.currency", e.target.value.toUpperCase())} /></Field>
          <Field label={t("hr.staff.baseSalary")} hint={t("hr.staff.baseSalaryHint")}><input type="number" min="0" className={inputCls} value={f.salary.baseSalary} onChange={(e) => up("salary.baseSalary", e.target.value)} /></Field>
        </div>
        <h4 className="mb-2 mt-4 text-xs font-semibold uppercase text-gray-500">{t("hr.staff.allowances")}</h4>{list("allowances", { name: "", amount: 0 })}
        <h4 className="mb-2 mt-4 text-xs font-semibold uppercase text-gray-500">{t("hr.staff.deductions")}</h4>{list("deductions", { name: "", type: "PERCENT", value: 0, of: "GROSS" })}
      </Card>
      <Card title={t("hr.staff.sections.bank")}>
        <div className={g}>
          <Field label={t("hr.staff.bankName")}><input className={inputCls} value={f.bank.bankName} onChange={(e) => up("bank.bankName", e.target.value)} /></Field>
          <Field label={t("hr.staff.accountName")}><input className={inputCls} value={f.bank.accountName} onChange={(e) => up("bank.accountName", e.target.value)} /></Field>
          <Field label={t("hr.staff.accountNumber")} hint={masked ? t("hr.staff.keepHint", { masked }) : t("hr.staff.encryptedHint")}><input className={inputCls} autoComplete="off" value={f.bank.accountNumber} onChange={(e) => up("bank.accountNumber", e.target.value)} /></Field>
          <Field label={t("hr.staff.branch")}><input className={inputCls} value={f.bank.branch} onChange={(e) => up("bank.branch", e.target.value)} /></Field>
          <Field label={t("hr.staff.sortCode")}><input className={inputCls} value={f.bank.sortCode} onChange={(e) => up("bank.sortCode", e.target.value)} /></Field>
          <Field label={t("hr.staff.taxId")}><input className={inputCls} autoComplete="off" value={f.bank.taxId} onChange={(e) => up("bank.taxId", e.target.value)} /></Field>
          <Field label={t("hr.staff.pensionId")}><input className={inputCls} value={f.bank.pensionId} onChange={(e) => up("bank.pensionId", e.target.value)} /></Field>
        </div>
      </Card>
      <Card title={t("hr.staff.sections.health")}>
        <div className={g}>
          <Field label={t("hr.staff.healthStatus")}><Sel t={t} label="hr.health" value={f.health.status} onChange={(v) => up("health.status", v)} options={["FIT", "CONDITION_NOTED", "UNDISCLOSED"]} /></Field>
          <Field label={t("hr.staff.bloodGroup")}><input className={inputCls} maxLength={5} value={f.health.bloodGroup} onChange={(e) => up("health.bloodGroup", e.target.value)} /></Field>
          <Field label={t("hr.staff.genotype")}><input className={inputCls} maxLength={5} value={f.health.genotype} onChange={(e) => up("health.genotype", e.target.value)} /></Field>
          <Field label={t("hr.staff.healthNotes")} hint={t("hr.staff.encryptedHint")} className="md:col-span-3"><textarea rows={2} className={inputCls} maxLength={1000} value={f.health.notes} onChange={(e) => up("health.notes", e.target.value)} /></Field>
        </div>
      </Card>
      <Card title={t("hr.staff.sections.notes")}><textarea rows={3} className={inputCls} maxLength={2000} value={f.notes} onChange={(e) => up("notes", e.target.value)} /></Card>
    </div>
  );
}
