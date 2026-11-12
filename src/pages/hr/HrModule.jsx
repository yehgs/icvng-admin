// admin/src/pages/hr/HrModule.jsx
//
// HR module shell — IT, Director and HR only (permission hr.view; the SERVER enforces country scope:
// IT/Director may pick a country, a country HR is confined to theirs, an unscoped HR is Nigeria-only).
import React, { useEffect, useMemo, useState } from "react";
import { Briefcase, LayoutDashboard, Users, CalendarCheck, Plane, Star, Wallet, Settings } from "lucide-react";
import { useAdminTranslation } from "../../hooks/useAdminTranslation.js";
import { handleApiError } from "../../utils/api";
import { inputCls } from "../../components/campaign/ui.jsx";
import { HrContext, hrGet } from "./hrApi.js";
import HrDashboard from "./HrDashboard.jsx";
import HrStaff from "./HrStaff.jsx";
import HrAttendance from "./HrAttendance.jsx";
import HrLeave from "./HrLeave.jsx";
import HrAppraisals from "./HrAppraisals.jsx";
import HrPayroll from "./HrPayroll.jsx";
import HrSettings from "./HrSettings.jsx";

const TABS = [
  { id: "dashboard", icon: LayoutDashboard, C: HrDashboard },
  { id: "staff", icon: Users, C: HrStaff },
  { id: "attendance", icon: CalendarCheck, C: HrAttendance },
  { id: "leave", icon: Plane, C: HrLeave },
  { id: "appraisals", icon: Star, C: HrAppraisals },
  { id: "payroll", icon: Wallet, C: HrPayroll, needs: "payroll" },
  { id: "settings", icon: Settings, C: HrSettings, needs: "manage" },
];

export default function HrModule() {
  const { t } = useAdminTranslation();
  const [meta, setMeta] = useState(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState(() => new URLSearchParams(window.location.search).get("tab") || "dashboard");
  const [country, setCountry] = useState("");

  useEffect(() => {
    hrGet("/meta").then((r) => {
      if (!r.success) return;
      setMeta(r.data);
      setCountry(r.data.scope.isGlobal ? r.data.countries[0]?.code || "NG" : r.data.scope.countryCode);
    }).catch((e) => setError(handleApiError(e, t("hr.loadFailed"))));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ctx = useMemo(() => ({ meta, country, isGlobal: !!meta?.scope.isGlobal, can: meta?.permissions || {} }), [meta, country]);
  if (error) return <div className="p-10 text-center text-red-600" role="alert">{error}</div>;
  if (!meta) return <div className="p-10 text-center text-gray-500">{t("common.loading")}</div>;

  const tabs = TABS.filter((x) => !x.needs || meta.permissions[x.needs]);
  const Active = (tabs.find((x) => x.id === tab) || tabs[0]).C;
  const go = (id) => { setTab(id); const u = new URL(window.location.href); u.searchParams.set("tab", id); window.history.replaceState({}, "", u); };

  return (
    <HrContext.Provider value={ctx}>
      <div className="space-y-4 p-4 md:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-white"><Briefcase className="h-5 w-5" />{t("hr.title")}</h1>
            <p className="text-sm text-gray-500">{meta.scope.isGlobal ? t("hr.subtitleGlobal") : t("hr.subtitleCountry", { country: meta.countries[0]?.name })}</p>
          </div>
          {meta.scope.isGlobal && (
            <select aria-label={t("hr.country")} className={`${inputCls} ml-auto w-auto`} value={country} onChange={(e) => setCountry(e.target.value)}>
              {meta.countries.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
            </select>
          )}
        </div>
        <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-gray-200 dark:border-gray-700">
          {tabs.map(({ id, icon: I }) => (
            <button key={id} role="tab" aria-selected={tab === id} type="button" onClick={() => go(id)}
              className={`inline-flex items-center gap-2 whitespace-nowrap px-4 py-2 text-sm font-medium ${tab === id ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-600 hover:text-gray-900 dark:text-gray-300"}`}>
              <I className="h-4 w-4" />{t(`hr.tabs.${id}`)}
            </button>
          ))}
        </div>
        {/* key on country so every tab refetches when IT/Director switch country */}
        <Active key={`${tab}-${country}`} />
      </div>
    </HrContext.Provider>
  );
}
