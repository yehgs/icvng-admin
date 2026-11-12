import React, { useEffect, useState } from "react";
import { Users, MapPin, Home, Plane, Cake, FileClock, Wallet } from "lucide-react";
import { useAdminTranslation } from "../../hooks/useAdminTranslation.js";
import { Card } from "../../components/campaign/ui.jsx";
import { useHr, hrGet, money, Spinner } from "./hrApi.js";

const Stat = ({ icon: I, label, value, tone = "blue" }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
    <div className={`mb-2 inline-flex rounded-lg bg-${tone}-50 p-2 text-${tone}-600 dark:bg-${tone}-900/20`}><I className="h-5 w-5" /></div>
    <div className="text-2xl font-semibold text-gray-900 dark:text-white">{value}</div>
    <div className="text-xs text-gray-500">{label}</div>
  </div>
);
const List = ({ rows, empty }) => rows?.length ? <ul className="space-y-1 text-sm">{rows.map((r, i) => <li key={i} className="flex justify-between"><span>{r.fullName}</span><span className="text-gray-500">{r.date}</span></li>)}</ul> : <p className="text-sm text-gray-500">{empty}</p>;

export default function HrDashboard() {
  const { t } = useAdminTranslation();
  const { country, meta } = useHr();
  const [d, setD] = useState(null);
  useEffect(() => { hrGet("/dashboard", { countryCode: country }).then((r) => r.success && setD(r.data)).catch(() => {}); }, [country]);
  if (!d) return <Spinner />;
  const cur = meta.countries.find((c) => c.code === d.latestPayroll?.countryCode) || meta.countries.find((c) => c.code === country);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat icon={Users} label={t("hr.dash.headcount")} value={d.headcount} />
        <Stat icon={MapPin} label={t("hr.dash.inOffice")} value={d.presentToday.office} tone="green" />
        <Stat icon={Home} label={t("hr.dash.remoteToday")} value={d.presentToday.remote} tone="indigo" />
        <Stat icon={Plane} label={t("hr.dash.onLeave")} value={d.onLeaveToday} tone="amber" />
        <Stat icon={FileClock} label={t("hr.dash.pendingLeave")} value={d.pendingLeave} tone="red" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card title={t("hr.dash.workModes")}>
          <ul className="space-y-1 text-sm">{["FULL_TIME", "HYBRID", "REMOTE"].map((m) => <li key={m} className="flex justify-between"><span>{t(`hr.workMode.${m}`)}</span><b>{d.byWorkMode[m] || 0}</b></li>)}</ul>
          <h4 className="mb-1 mt-4 text-xs font-semibold uppercase text-gray-500">{t("hr.dash.departments")}</h4>
          <ul className="space-y-1 text-sm">{d.byDepartment.map((x) => <li key={x.department} className="flex justify-between"><span>{x.department}</span><b>{x.count}</b></li>)}</ul>
        </Card>
        <Card title={<span className="inline-flex items-center gap-2"><Cake className="h-4 w-4" />{t("hr.dash.birthdays")}</span>}><List rows={d.upcomingBirthdays} empty={t("hr.dash.none")} /></Card>
        <Card title={t("hr.dash.endingSoon")}>
          <h4 className="mb-1 text-xs font-semibold uppercase text-gray-500">{t("hr.dash.probation")}</h4><List rows={d.probationEnding} empty={t("hr.dash.none")} />
          <h4 className="mb-1 mt-3 text-xs font-semibold uppercase text-gray-500">{t("hr.dash.contracts")}</h4><List rows={d.contractsEnding} empty={t("hr.dash.none")} />
        </Card>
      </div>
      {d.latestPayroll && (
        <Card title={<span className="inline-flex items-center gap-2"><Wallet className="h-4 w-4" />{t("hr.dash.latestPayroll")}</span>}>
          <div className="flex flex-wrap gap-6 text-sm">
            <span>{d.latestPayroll.period}</span><span className="rounded bg-gray-100 px-2 dark:bg-gray-700">{t(`hr.payrollStatus.${d.latestPayroll.status}`)}</span>
            <span>{t("hr.payroll.net")}: <b>{money(d.latestPayroll.totals.net, cur?.decimals ?? 2, d.latestPayroll.currency, true)}</b></span>
            <span>{t("hr.dash.headcount")}: <b>{d.latestPayroll.totals.headcount}</b></span>
          </div>
        </Card>
      )}
    </div>
  );
}
