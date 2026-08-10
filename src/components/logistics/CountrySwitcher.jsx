// components/logistics/CountrySwitcher.jsx
//
// Lets a GLOBAL admin (IT/DIRECTOR — see getCurrentUser().scope) filter
// the Logistics/Tracking module down to ONE country at a time, or leave
// it on "All Countries" to keep seeing everything mixed together (their
// existing default). Hidden entirely for COUNTRY-scoped admins (a
// country-scoped Logistics/Manager admin never sees anyone else's data
// regardless — there's nothing for them to switch between).
//
// "IT and Director are only exposed to HQ logistics pages and data" —
// this is the fix: gives them the same per-country isolation view a
// country-scoped admin has, without permanently losing the all-countries
// view server-side (see applyGlobalCountryFilter in
// controllers/shipping.controller.js).
import React, { useState, useEffect } from "react";
import { Globe, ChevronDown } from "lucide-react";
import { getCurrentUser, countryAPI } from "../../utils/api";
import FlagIcon from "../FlagIcon.jsx";

const CountrySwitcher = ({ value, onChange }) => {
  const user = getCurrentUser();
  const [countries, setCountries] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  // Only relevant for GLOBAL admins — a COUNTRY-scoped admin's data is
  // already locked server-side to their own country regardless of what
  // this component would send.
  const isGlobal = user?.scope !== "COUNTRY";

  useEffect(() => {
    if (!isGlobal) return;
    countryAPI
      .list()
      .then((res) => setCountries(res?.data || res?.countries || []))
      .catch(() => setCountries([]));
  }, [isGlobal]);

  if (!isGlobal) return null;

  const current = countries.find((c) => c.code === value);

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen((p) => !p)}
        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
      >
        <Globe className="w-4 h-4 text-gray-500" />
        {value ? (
          <span className="inline-flex items-center gap-1.5">
            <FlagIcon code={value} className="w-4 h-3 rounded-sm" />
            {current?.name || value}
          </span>
        ) : (
          <span className="text-gray-600">All Countries</span>
        )}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 z-50 w-56 mt-2 bg-white border border-gray-200 rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
          <div className="py-1 max-h-72 overflow-y-auto">
            <button
              className={`flex items-center w-full px-4 py-2.5 text-sm text-left hover:bg-gray-50 ${
                !value ? "bg-green-50 text-green-900 font-medium" : "text-gray-700"
              }`}
              onClick={() => { onChange(""); setIsOpen(false); }}
            >
              All Countries
            </button>
            {countries.map((c) => (
              <button
                key={c.code}
                className={`flex items-center gap-1.5 w-full px-4 py-2.5 text-sm text-left hover:bg-gray-50 ${
                  value === c.code ? "bg-green-50 text-green-900 font-medium" : "text-gray-700"
                }`}
                onClick={() => { onChange(c.code); setIsOpen(false); }}
              >
                <FlagIcon code={c.code} className="w-4 h-3 rounded-sm" />
                {c.name} ({c.code})
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CountrySwitcher;
