// admin/src/pages/marketing/CampaignManagement.jsx
//
// Seasonal Campaigns (Black Friday, Christmas, custom): list + editor.
// Country scope and capabilities are decided by the SERVER (see
// server/utils/campaignScope.js and route/campaign.route.js). This page only
// reflects them: IT/Director get a country filter; everyone else sees their own
// country and nothing else.
import React, { useCallback, useEffect, useState } from "react";
import { Plus, Search, RefreshCw, Snowflake, Tag } from "lucide-react";
import toast from "react-hot-toast";
import { apiCall, handleApiError } from "../../utils/api";
import { useAdminTranslation } from "../../hooks/useAdminTranslation.js";
import CampaignEditor from "../../components/campaign/CampaignEditor.jsx";
import { inputCls, btnPrimary, btnGhost } from "../../components/campaign/ui.jsx";
import { CAMPAIGN_TYPES, STATUSES, STATUS_STYLE, formatInZone } from "../../components/campaign/campaignUtils.js";

export default function CampaignManagement() {
  const { t, language } = useAdminTranslation();
  const [meta, setMeta] = useState(null);
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ search: "", type: "", status: "", countryCode: "", from: "", to: "" });
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null); // null = list, "new" or an id

  useEffect(() => {
    apiCall("/campaign/admin/meta").then((r) => r.success && setMeta(r.data)).catch((e) => setError(handleApiError(e, t("campaigns.loadFailed"))));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const q = new URLSearchParams({ page: String(page), limit: "20" });
      Object.entries(filters).forEach(([k, v]) => v && q.set(k, v));
      const res = await apiCall(`/campaign/admin/list?${q.toString()}`);
      if (res.success) { setRows(res.data || []); setPagination(res.pagination || { page: 1, pages: 1, total: 0 }); }
    } catch (err) {
      setError(handleApiError(err, t("campaigns.loadFailed")));
      toast.error(handleApiError(err, t("campaigns.loadFailed")));
    } finally { setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, page]);

  useEffect(() => { if (editing === null) fetchList(); }, [fetchList, editing]);

  const setFilter = (patch) => { setPage(1); setFilters((f) => ({ ...f, ...patch })); };

  if (!meta && !error) return <div className="p-10 text-center text-gray-500">{t("common.loading")}</div>;
  if (!meta) return <div className="p-10 text-center text-red-600" role="alert">{error}</div>;

  if (editing !== null) {
    return (
      <div className="p-4 md:p-6">
        <CampaignEditor
          key={editing}
          campaignId={editing === "new" ? null : editing}
          meta={meta}
          onChanged={fetchList}
          onClose={(openId) => setEditing(openId || null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <Snowflake className="h-6 w-6 text-blue-600" aria-hidden="true" />
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{t("campaigns.title")}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{meta.isGlobal ? t("campaigns.subtitleGlobal") : t("campaigns.subtitleCountry", { country: meta.countries?.[0]?.name || meta.countryCode })}</p>
        </div>
        <div className="ml-auto flex gap-2">
          <button type="button" className={btnGhost} onClick={fetchList}><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />{t("common.refresh")}</button>
          {meta.permissions.manage && <button type="button" className={btnPrimary} onClick={() => setEditing("new")}><Plus className="h-4 w-4" />{t("campaigns.newCampaign")}</button>}
        </div>
      </div>

      <div className="grid gap-2 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800 sm:grid-cols-2 lg:grid-cols-6">
        <div className="relative lg:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input className={`${inputCls} pl-9`} placeholder={t("campaigns.filters.search")} value={filters.search} onChange={(e) => setFilter({ search: e.target.value })} aria-label={t("campaigns.filters.search")} />
        </div>
        <select className={inputCls} value={filters.type} onChange={(e) => setFilter({ type: e.target.value })} aria-label={t("campaigns.fields.type")}>
          <option value="">{t("campaigns.filters.allTypes")}</option>
          {CAMPAIGN_TYPES.map((x) => <option key={x} value={x}>{t(`campaigns.type.${x}`)}</option>)}
        </select>
        <select className={inputCls} value={filters.status} onChange={(e) => setFilter({ status: e.target.value })} aria-label={t("common.status")}>
          <option value="">{t("campaigns.filters.allStatuses")}</option>
          {STATUSES.map((x) => <option key={x} value={x}>{t(`campaigns.status.${x}`)}</option>)}
        </select>
        {meta.isGlobal && (
          <select className={inputCls} value={filters.countryCode} onChange={(e) => setFilter({ countryCode: e.target.value })} aria-label={t("campaigns.fields.country")}>
            <option value="">{t("campaigns.filters.allCountries")}</option>
            {meta.countries.map((c) => <option key={c.code} value={c.code}>{c.name || c.code}</option>)}
          </select>
        )}
        <input type="date" className={inputCls} value={filters.from} onChange={(e) => setFilter({ from: e.target.value })} aria-label={t("campaigns.filters.from")} />
        <input type="date" className={inputCls} value={filters.to} onChange={(e) => setFilter({ to: e.target.value })} aria-label={t("campaigns.filters.to")} />
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left text-xs uppercase text-gray-500 dark:border-gray-700 dark:bg-gray-900/30">
              <th className="px-4 py-3">{t("campaigns.fields.name")}</th><th className="px-4">{t("campaigns.fields.type")}</th>
              <th className="px-4">{t("campaigns.fields.country")}</th><th className="px-4">{t("common.status")}</th>
              <th className="px-4">{t("campaigns.list.schedule")}</th><th className="px-4">{t("campaigns.list.rules")}</th>
              <th className="px-4">{t("campaigns.list.updated")}</th>
            </tr>
          </thead>
          <tbody>
            {loading && rows.length === 0 && [0, 1, 2].map((i) => <tr key={i}><td colSpan={7} className="px-4 py-4"><div className="h-4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" /></td></tr>)}
            {!loading && error && <tr><td colSpan={7} className="px-4 py-8 text-center text-red-600" role="alert">{error}</td></tr>}
            {!loading && !error && rows.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-500"><Tag className="mx-auto mb-2 h-8 w-8 text-gray-300" />{t("campaigns.list.empty")}</td></tr>
            )}
            {rows.map((c) => (
              <tr key={c._id} className="cursor-pointer border-b last:border-0 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/40" onClick={() => setEditing(c._id)}>
                <td className="px-4 py-3">
                  <button type="button" className="text-left font-medium text-blue-700 hover:underline dark:text-blue-300" onClick={(e) => { e.stopPropagation(); setEditing(c._id); }}>{c.name}</button>
                  <div className="text-xs text-gray-400">/{c.slug}</div>
                </td>
                <td className="px-4">{t(`campaigns.type.${c.type}`)}</td>
                <td className="px-4"><span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium dark:bg-gray-700">{c.countryCode}</span></td>
                <td className="px-4"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[c.status]}`}>{t(`campaigns.status.${c.status}`)}</span></td>
                <td className="px-4 text-xs text-gray-600 dark:text-gray-300">{formatInZone(c.startsAt, c.timezone, language)}<br />→ {formatInZone(c.endsAt, c.timezone, language)}<br /><span className="text-gray-400">{c.timezone}</span></td>
                <td className="px-4">{c.activeRuleCount}</td>
                <td className="px-4 text-xs text-gray-500">{c.updatedBy?.name || c.createdBy?.name || "—"}<br />{formatInZone(c.updatedAt, c.timezone, language)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm">
          <button type="button" className={btnGhost} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>{t("common.back")}</button>
          <span>{page} / {pagination.pages}</span>
          <button type="button" className={btnGhost} disabled={page >= pagination.pages} onClick={() => setPage((p) => p + 1)}>{t("campaigns.list.next")}</button>
        </div>
      )}
    </div>
  );
}
