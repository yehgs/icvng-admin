import React from "react";
import { useAdminTranslation } from "../../hooks/useAdminTranslation.js";
import { Field, inputCls } from "../campaign/ui.jsx";

/**
 * "Which logo / signature goes on this document?" — empty value = the country's default.
 * Used by payroll, the blank staff form and the staff-details export.
 */
export default function BrandingPicker({ logos = [], signatures = [], logoId, signatureId, onChange, showLogo = true, showSignature = true, disabled = false }) {
  const { t } = useAdminTranslation();
  const def = (list) => list.find((x) => x.isDefault)?.label;
  const opts = (list) => [<option key="" value="">{def(list) ? t("hr.branding.useDefault", { name: def(list) }) : t("hr.branding.none")}</option>, ...list.filter((x) => !x.isDefault).map((x) => <option key={x._id} value={x._id}>{x.label}</option>)];
  const current = (list, id) => list.find((x) => x._id === id) || list.find((x) => x.isDefault) || list[0];
  const preview = (list, id) => { const it = current(list, id); return it?.url ? <img src={it.url} alt={it.label} className="mt-1 h-10 max-w-[140px] rounded border bg-white object-contain" /> : null; };
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {showLogo && <Field label={t("hr.branding.chooseLogo")}><select disabled={disabled} className={inputCls} value={logoId || ""} onChange={(e) => onChange({ logoId: e.target.value })}>{opts(logos)}</select>{preview(logos, logoId)}</Field>}
      {showSignature && <Field label={t("hr.branding.chooseSignature")}><select disabled={disabled} className={inputCls} value={signatureId || ""} onChange={(e) => onChange({ signatureId: e.target.value })}>{opts(signatures)}</select>{preview(signatures, signatureId)}</Field>}
    </div>
  );
}
