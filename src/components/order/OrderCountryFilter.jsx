import React from "react";
import { Globe } from "lucide-react";
import FlagIcon from "../FlagIcon.jsx";
import { useAdminCountry } from "../../contexts/AdminCountryContext.jsx";
import { useAdminTranslation } from "../../hooks/useAdminTranslation.js";

/**
 * OrderCountryFilter
 *
 * The cross-country control for the ONLY two subRoles with global order
 * visibility: IT and DIRECTOR. Every other role's order list is already
 * restricted to a single country server-side (see getAllOrdersController),
 * so for them this component renders nothing at all rather than showing a
 * dropdown whose options they'd be 403'd out of.
 *
 * Two jobs:
 *   1. Narrow the global view to one country (?countryCode=TG on the list
 *      endpoint, validated server-side against ALL_COUNTRY_CODES).
 *   2. Show WHERE orders came from, by domain — the point the brief made
 *      about "distinction labels of the domain it can come from". A bare
 *      "NG" code doesn't tell a director that an order arrived on
 *      i-coffee.ng rather than i-coffee.it, so we surface the actual
 *      storefront domain, not just the ISO code.
 *
 * The per-country counts come from `countryBreakdown` on the list response,
 * which the server computes over the whole FILTERED result set — not just
 * the current page — so the numbers stay meaningful under pagination.
 *
 * All copy goes through t() against the `orders.countryFilter.*` and
 * `orders.breakdown.*` keys (registered in admin/src/i18n/locales/en.js and
 * therefore editable live from UiTranslationsManagement.jsx).
 */
const OrderCountryFilter = ({
  value,
  onChange,
  breakdown,
  canSeeAllCountries,
  className = "",
}) => {
  const { t } = useAdminTranslation();
  const { allCountries } = useAdminCountry();

  // Country-scoped admins never see this control.
  if (!canSeeAllCountries) return null;

  const countries = allCountries?.length ? allCountries : [];
  const totalOrders = (breakdown || []).reduce((sum, r) => sum + (r.count || 0), 0);

  const metaFor = (code) =>
    countries.find((c) => c.code === code) || {
      code,
      name: code,
      domain: "",
      flagEmoji: "🌍",
    };

  const selectedMeta = value ? metaFor(value) : null;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* ── Selector ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-xs font-semibold text-amber-700 dark:text-amber-300">
          <Globe className="w-3.5 h-3.5" />
          {t("orders.countryFilter.globalBadge")}
        </span>

        <div className="flex items-center gap-2">
          <label
            htmlFor="order-country-filter"
            className="text-sm font-medium text-gray-600 dark:text-gray-300"
          >
            {t("orders.countryFilter.label")}
          </label>
          <select
            id="order-country-filter"
            value={value || ""}
            onChange={(e) => onChange(e.target.value || "")}
            className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="">{t("orders.countryFilter.all")}</option>
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {/* Domain in the option label so the distinction is explicit:
                    "Nigeria — i-coffee.ng" rather than an ambiguous "NG". */}
                {c.flagEmoji} {c.name}
                {c.domain ? ` — ${c.domain}` : ""}
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs text-gray-500 dark:text-gray-400">
          {value
            ? t("orders.countryFilter.showingOne", {
                country: selectedMeta?.name || value,
              })
            : t("orders.countryFilter.showingAll")}
        </span>
      </div>

      {/* ── Per-country breakdown chips ──────────────────────────── */}
      {Array.isArray(breakdown) && breakdown.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
            {t("orders.breakdown.title")}
          </p>
          <div className="flex flex-wrap gap-2">
            {breakdown.map((row) => {
              const meta = metaFor(row.countryCode);
              const isActive = value === row.countryCode;
              return (
                <button
                  key={row.countryCode}
                  type="button"
                  onClick={() => onChange(isActive ? "" : row.countryCode)}
                  title={meta.domain || meta.name}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                    isActive
                      ? "bg-amber-100 dark:bg-amber-900/40 border-amber-400 text-amber-800 dark:text-amber-200"
                      : "bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-amber-300"
                  }`}
                >
                  <FlagIcon
                    code={row.countryCode || "NG"}
                    className="w-4 h-3 rounded-sm"
                  />
                  {/* Domain is the label that actually answers "which site did
                      this come from" — the code alone is not enough. */}
                  <span>{meta.domain || meta.name}</span>
                  <span className="px-1.5 py-0.5 rounded bg-white/70 dark:bg-gray-800/70 tabular-nums">
                    {row.count}
                  </span>
                </button>
              );
            })}

            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900">
              {t("orders.breakdown.total")}
              <span className="tabular-nums">{totalOrders}</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderCountryFilter;
