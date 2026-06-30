/**
 * admin/src/components/country/CountryScopeBanner.jsx
 *
 * Shown at the top of data-heavy pages to remind the admin which
 * country's data they're viewing. Global admins see a country filter
 * dropdown; Foreign admins see a read-only badge.
 */

import React, { useState } from "react";
import { Globe, ChevronDown } from "lucide-react";
import { useAdminCountry } from "../../contexts/AdminCountryContext.jsx";
import { useAdminTranslation } from "../../hooks/useAdminTranslation.js";

export default function CountryScopeBanner({ onCountryChange }) {
  const { countryScope, isGlobalAdmin, allCountries, activeCountry } = useAdminCountry();
  const { t } = useAdminTranslation();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(countryScope); // null = all

  if (!countryScope && isGlobalAdmin && allCountries.length === 0) return null;

  const handleSelect = (code) => {
    setSelected(code);
    setOpen(false);
    onCountryChange?.(code); // let the page re-fetch with the new filter
  };

  // Foreign admin — locked, read-only
  if (!isGlobalAdmin) {
    const country = allCountries.find(c => c.code === countryScope) || activeCountry;
    return (
      <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-amber-50 border border-amber-200
                      rounded-lg text-sm text-amber-800 w-fit">
        <span role="img" aria-label={country?.name}>{country?.flagEmoji}</span>
        <span className="font-medium">{t("country.scopeInfo", { country: country?.name })}</span>
      </div>
    );
  }

  // Global admin — dropdown to filter by country
  const currentLabel = selected
    ? allCountries.find(c => c.code === selected)?.name || selected
    : t("country.allCountries");
  const currentFlag = selected
    ? allCountries.find(c => c.code === selected)?.flagEmoji || "🌍"
    : "🌍";

  return (
    <div className="relative mb-4 w-fit">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200
                   rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50
                   transition-colors shadow-sm"
      >
        <Globe className="w-4 h-4 text-gray-400" />
        <span role="img">{currentFlag}</span>
        <span>{currentLabel}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <ul className="absolute top-full left-0 mt-1.5 w-52 bg-white border border-gray-100
                       rounded-xl shadow-lg z-50 overflow-hidden">
          {/* All countries option */}
          <li>
            <button
              onClick={() => handleSelect(null)}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left
                         hover:bg-gray-50 ${!selected ? "bg-amber-50 font-semibold text-amber-800" : "text-gray-700"}`}
            >
              <span>🌍</span>
              <span>{t("country.allCountries")}</span>
              {!selected && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-600" />}
            </button>
          </li>
          {allCountries.map(c => (
            <li key={c.code}>
              <button
                onClick={() => handleSelect(c.code)}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left
                           hover:bg-gray-50 ${selected === c.code ? "bg-amber-50 font-semibold text-amber-800" : "text-gray-700"}`}
              >
                <span role="img">{c.flagEmoji}</span>
                <div>
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-gray-400">{c.currency?.code}</div>
                </div>
                {selected === c.code && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-600" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
