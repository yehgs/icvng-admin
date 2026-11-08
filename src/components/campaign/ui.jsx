// admin/src/components/campaign/ui.jsx — tiny shared form atoms for the campaign screens.
import React from "react";

export const inputCls =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:disabled:bg-gray-800";
export const btnPrimary =
  "inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50";
export const btnGhost =
  "inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700";
export const btnDanger =
  "inline-flex items-center gap-2 rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/20";

export function Field({ label, hint, error, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">{label}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-red-600" role="alert">{error}</span>}
    </label>
  );
}

export function Toggle({ checked, onChange, label, disabled }) {
  return (
    <label className={`inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 ${disabled ? "opacity-60" : "cursor-pointer"}`}>
      <input type="checkbox" className="h-4 w-4 rounded border-gray-300" checked={!!checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

export function Card({ title, children, actions }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      {(title || actions) && (
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

/** Confirmation dialog for high-impact actions. */
export function ConfirmDialog({ open, title, body, confirmLabel, cancelLabel, danger, busy, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl dark:bg-gray-800">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{body}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className={btnGhost} onClick={onCancel} disabled={busy}>{cancelLabel}</button>
          <button type="button" className={danger ? btnDanger : btnPrimary} onClick={onConfirm} disabled={busy}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
