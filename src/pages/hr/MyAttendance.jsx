// admin/src/pages/hr/MyAttendance.jsx
//
// Self-service attendance for any admin with an HR record. Full-time staff mark "present in office";
// hybrid staff choose office or remote; remote staff mark a remote day. Marking presence in the office
// PROMPTS the browser for location, reads the current position, and the server verifies it against the
// office geofence, stores the address and e-mails the office's assigned address(es).
import React, { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { MapPin, Home, LogOut, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { useAdminTranslation } from "../../hooks/useAdminTranslation.js";
import { handleApiError } from "../../utils/api";
import { Card, btnPrimary, btnGhost } from "../../components/campaign/ui.jsx";
import { hrGet, hrSend, Spinner } from "./hrApi.js";

const getPosition = () => new Promise((resolve, reject) => {
  if (!navigator.geolocation) return reject(Object.assign(new Error("unsupported"), { code: 0 }));
  navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 });
});

export default function MyAttendance() {
  const { t } = useAdminTranslation();
  const [state, setState] = useState(null);
  const [history, setHistory] = useState([]);
  const [busy, setBusy] = useState(false);
  const [officeId, setOfficeId] = useState("");

  const load = useCallback(async () => {
    try {
      const [s, h] = await Promise.all([hrGet("/me/attendance/today"), hrGet("/me/attendance")]);
      if (s.success) { setState(s.data); setOfficeId((cur) => cur || s.data.defaultOfficeId || ""); }
      if (h.success) setHistory(h.data);
    } catch (e) { toast.error(handleApiError(e, t("hr.loadFailed"))); }
  }, [t]);
  useEffect(() => { load(); }, [load]);

  const markOffice = async () => {
    setBusy(true);
    try {
      const pos = await getPosition();
      const r = await hrSend("/me/attendance/check-in", "POST", { type: "OFFICE", lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy, officeId: officeId || undefined });
      if (r.success) { toast.success(r.alreadyMarked ? t("hr.me.already") : t("hr.me.marked")); load(); }
    } catch (e) {
      if (typeof e?.code === "number" && !e.response) toast.error(e.code === 1 ? t("hr.geo.denied") : e.code === 0 ? t("hr.geo.unsupported") : t("hr.geo.failed"), { duration: 7000 });
      else toast.error(handleApiError(e, t("hr.saveFailed")), { duration: 7000 });
    } finally { setBusy(false); }
  };
  const markRemote = async () => { setBusy(true); try { const r = await hrSend("/me/attendance/check-in", "POST", { type: "REMOTE" }); if (r.success) { toast.success(t("hr.me.markedRemote")); load(); } } catch (e) { toast.error(handleApiError(e, t("hr.saveFailed"))); } finally { setBusy(false); } };
  const checkOut = async () => { setBusy(true); try { await hrSend("/me/attendance/check-out", "POST"); load(); } catch (e) { toast.error(handleApiError(e, t("hr.saveFailed"))); } finally { setBusy(false); } };

  if (!state) return <Spinner />;
  if (!state.hasProfile) return <div className="p-6"><Card title={t("hr.me.title")}><p className="text-sm text-gray-600">{t("hr.me.noProfile")}</p></Card></div>;
  const rec = state.record;
  const blocked = state.onLeave ? t("hr.me.onLeave") : state.isHoliday ? t("hr.me.holiday") : "";
  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 md:p-6">
      <h1 className="flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-white"><Clock className="h-5 w-5" />{t("hr.me.title")}</h1>
      <Card title={`${state.date} · ${t(`hr.workMode.${state.workMode}`)}`}>
        {rec ? (
          <div className="space-y-2 text-sm">
            <p className="flex items-center gap-2 font-medium text-green-700"><CheckCircle2 className="h-5 w-5" />{rec.type === "OFFICE" ? t("hr.me.presentOffice") : t("hr.me.presentRemote")} · {new Date(rec.checkInAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
            {rec.geo?.address && <p className="text-gray-600"><MapPin className="mr-1 inline h-4 w-4" />{rec.geo.address}{rec.geo.distanceMeters != null ? ` (${rec.geo.distanceMeters} m)` : ""}</p>}
            {rec.flags?.includes("OUTSIDE_GEOFENCE") && <p className="flex items-center gap-2 text-amber-700"><AlertTriangle className="h-4 w-4" />{t("hr.me.outside")}</p>}
            {rec.checkOutAt ? <p className="text-gray-500">{t("hr.me.checkedOut")} {new Date(rec.checkOutAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p> : <button type="button" className={btnGhost} disabled={busy} onClick={checkOut}><LogOut className="h-4 w-4" />{t("hr.me.checkOut")}</button>}
          </div>
        ) : blocked ? <p className="text-sm text-gray-600">{blocked}</p> : (
          <div className="space-y-3">
            {state.allowed.includes("OFFICE") && (
              <>
                {state.offices.length > 1 && <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700" value={officeId} onChange={(e) => setOfficeId(e.target.value)}><option value="">{t("hr.me.nearest")}</option>{state.offices.map((o) => <option key={o._id} value={o._id}>{o.name}</option>)}</select>}
                <button type="button" className={`${btnPrimary} w-full justify-center py-3 text-base`} disabled={busy} onClick={markOffice}><MapPin className="h-5 w-5" />{busy ? t("hr.me.locating") : t("hr.me.markOffice")}</button>
                <p className="text-xs text-gray-500">{t("hr.me.locationNotice")}</p>
              </>)}
            {state.allowed.includes("REMOTE") && <button type="button" className={`${state.allowed.includes("OFFICE") ? btnGhost : btnPrimary} w-full justify-center py-3`} disabled={busy} onClick={markRemote}><Home className="h-5 w-5" />{t("hr.me.markRemote")}</button>}
            {state.allowed.includes("OFFICE") && state.offices.length === 0 && <p className="text-sm text-amber-700">{t("hr.me.noOffice")}</p>}
          </div>)}
      </Card>
      <Card title={t("hr.me.history")}>
        {history.length === 0 ? <p className="text-sm text-gray-500">{t("hr.att.none")}</p> : (
          <ul className="divide-y text-sm dark:divide-gray-700">{history.map((h) => <li key={h._id} className="flex items-center justify-between py-1.5"><span>{h.date}</span><span className="inline-flex items-center gap-1 text-gray-600">{h.type === "OFFICE" ? <MapPin className="h-3.5 w-3.5" /> : <Home className="h-3.5 w-3.5" />}{t(`hr.att.types.${h.type}`)}{h.flags?.includes("OUTSIDE_GEOFENCE") && <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />}</span></li>)}</ul>)}
      </Card>
    </div>
  );
}
