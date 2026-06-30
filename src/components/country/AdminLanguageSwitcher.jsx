/**
 * admin/src/components/country/AdminLanguageSwitcher.jsx
 *
 * Language switcher for the admin header.
 * Only shows languages supported by the current country.
 */

import React, { useState, useRef, useEffect } from "react";
import { useAdminCountry } from "../../contexts/AdminCountryContext.jsx";
import { ChevronDown } from "lucide-react";
import { useAdminTranslation } from "../../hooks/useAdminTranslation.js";

const LANG_FLAGS = { en: "🇬🇧", fr: "🇫🇷", it: "🇮🇹" };

export default function AdminLanguageSwitcher({ className = "" }) {
  const { t } = useAdminTranslation();
  const { language, setLanguage, supportedLanguages, languageNames } =
    useAdminCountry();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const select = (lang) => {
    setLanguage(lang);
    setOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-2 py-1.5 text-sm font-medium
                   text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700
                   rounded-lg transition-colors"
        title={t("common.language")}
      >
        <span>{LANG_FLAGS[language] || "🌐"}</span>
        <span className="uppercase text-xs">{language}</span>
        <ChevronDown
          className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <ul
          className="absolute right-0 mt-1.5 w-40 bg-white dark:bg-gray-800 border
                       border-gray-100 dark:border-gray-700 rounded-xl shadow-lg z-[9999] overflow-hidden"
        >
          {supportedLanguages.map((lang) => (
            <li key={lang}>
              <button
                onClick={() => select(lang)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left
                           hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
                           ${lang === language ? "bg-amber-50 dark:bg-amber-900/30 font-semibold text-amber-800 dark:text-amber-300" : "text-gray-700 dark:text-gray-300"}`}
              >
                <span>{LANG_FLAGS[lang] || "🌐"}</span>
                <span>{languageNames[lang]}</span>
                {lang === language && (
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
