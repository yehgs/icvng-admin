/**
 * admin/src/hooks/useAdminTranslation.js
 *
 * Convenience hook — pulls t() from AdminCountryContext.
 *
 * Usage:
 *   const { t } = useAdminTranslation();
 *   t('common.save')  →  "Enregistrer"  (when lang = "fr")
 */
import { useAdminCountry } from "../contexts/AdminCountryContext.jsx";

export function useAdminTranslation() {
  const { t, language, setLanguage, supportedLanguages, languageNames } = useAdminCountry();
  return { t, language, setLanguage, supportedLanguages, languageNames };
}

export default useAdminTranslation;
