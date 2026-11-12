// admin/src/pages/hr/hrApi.js — thin helpers for the HR screens.
import React, { createContext, useContext } from "react";
import { apiCall } from "../../utils/api";

const API_BASE_URL = import.meta.env.VITE_APP_API_URL || "http://localhost:8080/api";

/** HR context: which country the current screen operates on (IT/Director pick; everyone else is fixed). */
export const HrContext = createContext({ meta: null, country: "", isGlobal: false });
export const useHr = () => useContext(HrContext);

export const qs = (params = {}) => {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== "") q.set(k, String(v)); });
  const s = q.toString();
  return s ? `?${s}` : "";
};
export const hr = (path, opts) => apiCall(`/hr${path}`, opts);
export const hrGet = (path, params) => hr(`${path}${qs(params)}`);
export const hrSend = (path, method, body) => hr(path, { method, body: body || {} });

/** Authenticated binary download/preview (PDF). `mode`: "open" in a new tab or "save" as a file. */
export async function hrFile(path, { mode = "open", filename = "document.pdf" } = {}) {
  const res = await fetch(`${API_BASE_URL}/hr${path}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}`, "x-storefront-host": window.location.hostname },
  });
  if (!res.ok) {
    let msg = res.statusText;
    try { msg = (await res.json()).message || msg; } catch { /* not json */ }
    throw new Error(msg);
  }
  const url = URL.createObjectURL(await res.blob());
  if (mode === "open") window.open(url, "_blank", "noopener");
  else { const a = document.createElement("a"); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); }
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

export const money = (minorOrMajor, decimals = 2, currency = "", minor = false) => {
  const v = minor ? (Number(minorOrMajor) || 0) / 10 ** decimals : Number(minorOrMajor) || 0;
  return `${currency ? currency + " " : ""}${v.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
};
export const day = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "");
export const Spinner = () => React.createElement("div", { className: "p-8 text-center text-gray-500" }, "…");
