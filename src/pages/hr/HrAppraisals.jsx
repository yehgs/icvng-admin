import React, { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Trash2, Send, Star } from "lucide-react";
import { useAdminTranslation } from "../../hooks/useAdminTranslation.js";
import { handleApiError } from "../../utils/api";
import { Card, Field, inputCls, btnPrimary, btnGhost, btnDanger } from "../../components/campaign/ui.jsx";
import { useHr, hrGet, hrSend, Spinner } from "./hrApi.js";

const ACTIONS = ["NONE", "INCREMENT", "PROMOTION", "BONUS", "TRAINING", "PIP", "CONFIRMATION"];
const blank = () => ({ staffId: "", period: `${new Date().getFullYear()}-H${new Date().getMonth() < 6 ? 1 : 2}`, cycle: "HALF_YEARLY", goals: [{ title: "", weight: 50, score: 0, comment: "" }], competencies: [{ name: "", rating: 0 }], strengths: "", improvements: "", comments: "", recommendedAction: "NONE" });

export default function HrAppraisals() {
  const { t } = useAdminTranslation();
  const { country, can } = useHr();
  const [rows, setRows] = useState(null);
  const [staff, setStaff] = useState([]);
  const [edit, setEdit] = useState(null);
  const load = useCallback(() => hrGet("/appraisals", { countryCode: country, limit: 50 }).then((r) => r.success && setRows(r.data)).catch((e) => toast.error(handleApiError(e, t("hr.loadFailed")))), [country, t]);
  useEffect(() => { setRows(null); load(); }, [load]);
  useEffect(() => { if (can.manage) hrGet("/staff", { countryCode: country, status: "ACTIVE", limit: 100 }).then((r) => r.success && setStaff(r.data)).catch(() => {}); }, [country, can.manage]);

  const save = async (submit) => {
    try {
      const { _id, status, ...body } = edit;
      const res = _id ? await hrSend(`/appraisals/${_id}`, "PUT", body) : await hrSend("/appraisals", "POST", body);
      if (submit) await hrSend(`/appraisals/${res.data._id}/submit`, "POST");
      toast.success(t("hr.saved")); setEdit(null); load();
    } catch (e) { toast.error(handleApiError(e, t("hr.saveFailed"))); }
  };
  const remove = async (id) => { try { await hrSend(`/appraisals/${id}`, "DELETE"); load(); } catch (e) { toast.error(handleApiError(e, t("hr.saveFailed"))); } };
  const setList = (key, i, patch) => setEdit((e) => ({ ...e, [key]: e[key].map((x, j) => (j === i ? { ...x, ...patch } : x)) }));
  const locked = edit?.status && edit.status !== "DRAFT";

  if (edit) {
    return (
      <div className="space-y-4">
        <button type="button" className={btnGhost} onClick={() => setEdit(null)}>← {t("common.back")}</button>
        <Card title={edit._id ? t("hr.appr.edit") : t("hr.appr.new")}>
          <div className="grid gap-3 md:grid-cols-3">
            <Field label={t("hr.staff.one")}><select className={inputCls} disabled={!!edit._id} value={edit.staffId?._id || edit.staffId} onChange={(e) => setEdit({ ...edit, staffId: e.target.value })}><option value="" />{staff.map((s) => <option key={s._id} value={s._id}>{s.fullName}</option>)}</select></Field>
            <Field label={t("hr.appr.period")}><input className={inputCls} disabled={!!edit._id} maxLength={30} value={edit.period} onChange={(e) => setEdit({ ...edit, period: e.target.value })} /></Field>
            <Field label={t("hr.appr.cycle")}><select className={inputCls} disabled={locked} value={edit.cycle} onChange={(e) => setEdit({ ...edit, cycle: e.target.value })}>{["PROBATION", "QUARTERLY", "HALF_YEARLY", "ANNUAL"].map((c) => <option key={c} value={c}>{t(`hr.appr.cycles.${c}`)}</option>)}</select></Field>
          </div>
        </Card>
        <Card title={t("hr.appr.goals")} actions={!locked && <button type="button" className={btnGhost} onClick={() => setEdit({ ...edit, goals: [...edit.goals, { title: "", weight: 0, score: 0, comment: "" }] })}><Plus className="h-4 w-4" />{t("common.add")}</button>}>
          {edit.goals.map((g, i) => (
            <div key={i} className="mb-2 grid gap-2 md:grid-cols-[2fr_80px_80px_2fr_auto]">
              <input className={inputCls} disabled={locked} placeholder={t("hr.appr.goal")} value={g.title} onChange={(e) => setList("goals", i, { title: e.target.value })} />
              <input className={inputCls} disabled={locked} type="number" min="0" max="100" title={t("hr.appr.weight")} value={g.weight} onChange={(e) => setList("goals", i, { weight: e.target.value })} />
              <input className={inputCls} disabled={locked} type="number" min="0" max="5" step="0.5" title={t("hr.appr.score")} value={g.score} onChange={(e) => setList("goals", i, { score: e.target.value })} />
              <input className={inputCls} disabled={locked} placeholder={t("hr.appr.comment")} value={g.comment} onChange={(e) => setList("goals", i, { comment: e.target.value })} />
              {!locked && <button type="button" aria-label={t("common.delete")} className="p-2 text-red-600" onClick={() => setEdit({ ...edit, goals: edit.goals.filter((_, j) => j !== i) })}><Trash2 className="h-4 w-4" /></button>}
            </div>))}
          <p className="text-xs text-gray-500">{t("hr.appr.goalsHint")}</p>
        </Card>
        <Card title={t("hr.appr.competencies")} actions={!locked && <button type="button" className={btnGhost} onClick={() => setEdit({ ...edit, competencies: [...edit.competencies, { name: "", rating: 0 }] })}><Plus className="h-4 w-4" />{t("common.add")}</button>}>
          {edit.competencies.map((c, i) => (
            <div key={i} className="mb-2 grid gap-2 md:grid-cols-[3fr_100px_auto]">
              <input className={inputCls} disabled={locked} value={c.name} placeholder={t("hr.appr.competency")} onChange={(e) => setList("competencies", i, { name: e.target.value })} />
              <input className={inputCls} disabled={locked} type="number" min="0" max="5" step="0.5" value={c.rating} onChange={(e) => setList("competencies", i, { rating: e.target.value })} />
              {!locked && <button type="button" aria-label={t("common.delete")} className="p-2 text-red-600" onClick={() => setEdit({ ...edit, competencies: edit.competencies.filter((_, j) => j !== i) })}><Trash2 className="h-4 w-4" /></button>}
            </div>))}
        </Card>
        <Card title={t("hr.appr.feedback")}>
          <div className="grid gap-3 md:grid-cols-2">
            {["strengths", "improvements"].map((k) => <Field key={k} label={t(`hr.appr.${k}`)}><textarea rows={3} className={inputCls} disabled={locked} maxLength={1500} value={edit[k]} onChange={(e) => setEdit({ ...edit, [k]: e.target.value })} /></Field>)}
            <Field label={t("hr.appr.comments")}><textarea rows={3} className={inputCls} disabled={locked} maxLength={1500} value={edit.comments} onChange={(e) => setEdit({ ...edit, comments: e.target.value })} /></Field>
            <Field label={t("hr.appr.action")}><select className={inputCls} disabled={locked} value={edit.recommendedAction} onChange={(e) => setEdit({ ...edit, recommendedAction: e.target.value })}>{ACTIONS.map((a) => <option key={a} value={a}>{t(`hr.appr.actions.${a}`)}</option>)}</select></Field>
          </div>
        </Card>
        {!locked && can.manage && <div className="flex gap-2"><button type="button" className={btnGhost} onClick={() => save(false)} disabled={!edit.staffId}>{t("hr.appr.saveDraft")}</button><button type="button" className={btnPrimary} onClick={() => save(true)} disabled={!edit.staffId}><Send className="h-4 w-4" />{t("hr.appr.submit")}</button></div>}
        {locked && <p className="text-sm text-gray-500">{t("hr.appr.lockedNotice")} · {edit.overallRating}/5</p>}
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {can.manage && <button type="button" className={btnPrimary} onClick={() => setEdit(blank())}><Plus className="h-4 w-4" />{t("hr.appr.new")}</button>}
      {!rows ? <Spinner /> : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <table className="w-full text-left text-sm"><thead className="border-b text-xs uppercase text-gray-500 dark:border-gray-700"><tr><th className="p-3">{t("hr.staff.one")}</th><th className="p-3">{t("hr.appr.period")}</th><th className="p-3">{t("hr.appr.rating")}</th><th className="p-3">{t("hr.appr.action")}</th><th className="p-3">{t("common.status")}</th><th /></tr></thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-gray-500">{t("hr.appr.none")}</td></tr>}
              {rows.map((r) => (
                <tr key={r._id} className="cursor-pointer border-b last:border-0 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/40" onClick={() => setEdit({ ...r, staffId: r.staffId?._id || r.staffId })}>
                  <td className="p-3"><div className="font-medium">{r.staffId?.fullName}</div><div className="text-xs text-gray-500">{r.staffId?.employment?.jobTitle}</div></td>
                  <td className="p-3">{r.period}</td><td className="p-3"><span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 text-amber-500" />{r.overallRating}</span></td>
                  <td className="p-3">{t(`hr.appr.actions.${r.recommendedAction}`)}</td><td className="p-3">{t(`hr.appr.status.${r.status}`)}</td>
                  <td className="p-3 text-right">{can.manage && r.status === "DRAFT" && <button type="button" aria-label={t("common.delete")} className={btnDanger} onClick={(e) => { e.stopPropagation(); remove(r._id); }}><Trash2 className="h-4 w-4" /></button>}</td>
                </tr>))}
            </tbody></table>
        </div>)}
    </div>
  );
}
