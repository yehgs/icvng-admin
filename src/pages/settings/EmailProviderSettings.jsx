import React, { useState, useEffect, useCallback } from "react";
import {
  Mail,
  Send,
  Save,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Power,
} from "lucide-react";
import toast from "react-hot-toast";
import { emailProviderSettingsAPI, getCurrentUser } from "../../utils/api";
import FlagIcon from "../../components/FlagIcon.jsx";
import { useAdminTranslation } from "../../hooks/useAdminTranslation.js";

/**
 * EmailProviderSettings
 *
 * System-wide mail provider configuration. Rendered only for IT/DIRECTOR —
 * the server enforces this independently (requirePermission("settings.manage")
 * + blockCountryScopedAdmins), so this check is a UX affordance, not the
 * security boundary.
 *
 * Design decisions worth knowing:
 *
 * - THE PROVIDER IS GLOBAL, THE SENDER IS PER-COUNTRY. Mixing providers per
 *   country would mean a deliverability problem has two different shapes and
 *   debugging doubles. What varies per market is the from-address, from-name
 *   and reply-to, so a Togo customer still gets a Togo sender.
 *
 * - API KEYS ARE WRITE-ONLY. The server returns a masked hint only. An empty
 *   field means "keep the stored key", so saving the form after an unrelated
 *   edit can never silently wipe the key and take all email down.
 *
 * - TEST BEFORE SWITCHING. The test button sends through a NAMED provider
 *   with fallback disabled, so you can prove Resend works before making it
 *   live. A test that quietly succeeded via SMTP would be worse than no test.
 */
const EmailProviderSettings = () => {
  const { t } = useAdminTranslation();
  const currentUser = getCurrentUser();
  const canManage = ["IT", "DIRECTOR"].includes(currentUser?.subRole);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(null);
  const [data, setData] = useState(null);
  const [testEmail, setTestEmail] = useState(currentUser?.email || "");
  const [testCountry, setTestCountry] = useState("NG");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await emailProviderSettingsAPI.get();
      if (res.success) setData(res.data);
    } catch (err) {
      toast.error(err?.message || t("emailSettings.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (canManage) load();
    else setLoading(false);
  }, [canManage, load]);

  if (!canManage) {
    return (
      <div className="p-8 text-center">
        <ShieldCheck className="w-10 h-10 mx-auto text-gray-400 mb-3" />
        <p className="text-gray-600 dark:text-gray-300">
          {t("emailSettings.restricted")}
        </p>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="p-8 flex items-center justify-center text-gray-500">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        {t("common.loading")}
      </div>
    );
  }

  const patchCountry = (code, field, value) => {
    setData((d) => ({
      ...d,
      countries: d.countries.map((c) =>
        c.countryCode === code ? { ...c, [field]: value } : c,
      ),
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await emailProviderSettingsAPI.update({
        activeProvider: data.activeProvider,
        sendingEnabled: data.sendingEnabled,
        resend: {
          // Only sent when non-empty — see the write-only note above.
          ...(data.resend.newApiKey ? { apiKey: data.resend.newApiKey } : {}),
          defaultFromEmail: data.resend.defaultFromEmail,
          defaultFromName: data.resend.defaultFromName,
        },
        smtp: data.smtp,
        countries: data.countries.map((c) => ({
          countryCode: c.countryCode,
          fromEmail: c.fromEmail,
          fromName: c.fromName,
          replyTo: c.replyTo,
          isActive: c.isActive,
        })),
      });
      if (res.success) {
        toast.success(t("emailSettings.saved"));
        await load();
      }
    } catch (err) {
      toast.error(err?.message || t("emailSettings.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async (provider) => {
    if (!testEmail) {
      toast.error(t("emailSettings.testEmailRequired"));
      return;
    }
    try {
      setTesting(provider);
      // The test endpoint reads SAVED settings from the database, not this
      // form. Typing a from-address and hitting Test without saving first
      // therefore tests the OLD configuration — which looks like the fix
      // didn't work. Save first so the button always tests what is on screen.
      await handleSave();
      const res = await emailProviderSettingsAPI.test({
        sendTo: testEmail,
        countryCode: testCountry,
        provider,
      });
      if (res.success) {
        toast.success(
          t("emailSettings.testSent", {
            provider: res.data.provider,
            ms: res.data.durationMs,
          }),
        );
        await load();
      }
    } catch (err) {
      // Show the provider's own message — "unverified domain" is actionable,
      // "test failed" is not.
      toast.error(err?.message || t("emailSettings.testFailed"), {
        duration: 8000,
      });
    } finally {
      setTesting(null);
    }
  };

  const health = data.health || {};

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Mail className="w-6 h-6 text-amber-600" />
            {t("emailSettings.title")}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t("emailSettings.subtitle")}
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 text-white font-medium hover:bg-amber-700 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {t("common.save")}
        </button>
      </div>

      {/* Health strip — last successful send / last error */}
      <div
        className={`p-4 rounded-lg border flex items-start gap-3 ${
          health.lastError
            ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
            : "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
        }`}
      >
        {health.lastError ? (
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        ) : (
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
        )}
        <div className="text-sm">
          {health.lastError ? (
            <>
              <p className="font-medium text-red-800 dark:text-red-300">
                {t("emailSettings.lastError")}
              </p>
              <p className="text-red-700 dark:text-red-400 mt-1 font-mono text-xs break-all">
                {health.lastError}
              </p>
              {/* This message only clears after a SUCCESSFUL send, so without
                  a timestamp an hour-old failure reads as current — which is
                  exactly how a stale banner sent us chasing a fixed bug. */}
              {health.lastErrorAt && (
                <p className="text-red-600/70 dark:text-red-400/70 mt-1.5 text-xs">
                  {t("emailSettings.errorAt", {
                    when: new Date(health.lastErrorAt).toLocaleString(),
                  })}
                </p>
              )}
            </>
          ) : (
            <p className="text-green-800 dark:text-green-300">
              {health.lastVerifiedAt
                ? t("emailSettings.lastVerified", {
                    provider: health.lastVerifiedProvider,
                    when: new Date(health.lastVerifiedAt).toLocaleString(),
                  })
                : t("emailSettings.neverVerified")}
            </p>
          )}
        </div>
      </div>

      {/* Provider selector */}
      <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
        <h2 className="font-semibold text-gray-900 dark:text-white">
          {t("emailSettings.activeProvider")}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t("emailSettings.providerHint")}
        </p>

        <div className="grid sm:grid-cols-2 gap-3">
          {data.availableProviders.map((p) => {
            const active = data.activeProvider === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setData((d) => ({ ...d, activeProvider: p }))}
                className={`text-left p-4 rounded-lg border-2 transition ${
                  active
                    ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20"
                    : "border-gray-200 dark:border-gray-600 hover:border-amber-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {p === "RESEND" ? "Resend" : "SMTP"}
                  </span>
                  {p === "RESEND" && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      {t("emailSettings.recommended")}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {p === "RESEND"
                    ? t("emailSettings.resendBlurb")
                    : t("emailSettings.smtpBlurb")}
                </p>
              </button>
            );
          })}
        </div>

        {/* Global sending kill switch */}
        <label className="flex items-start gap-3 pt-3 border-t border-gray-100 dark:border-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={data.sendingEnabled}
            onChange={(e) =>
              setData((d) => ({ ...d, sendingEnabled: e.target.checked }))
            }
            className="mt-1"
          />
          <span className="text-sm">
            <span className="font-medium text-gray-900 dark:text-white flex items-center gap-1.5">
              <Power className="w-3.5 h-3.5" />
              {t("emailSettings.sendingEnabled")}
            </span>
            <span className="text-gray-500 dark:text-gray-400">
              {t("emailSettings.sendingEnabledHint")}
            </span>
          </span>
        </label>
      </section>

      {/* Resend configuration */}
      <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
        <h2 className="font-semibold text-gray-900 dark:text-white">
          {t("emailSettings.resendConfig")}
        </h2>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t("emailSettings.apiKey")}
            </label>
            <input
              type="password"
              placeholder={
                data.resend.hasApiKey
                  ? `${data.resend.apiKeyHint} — ${t("emailSettings.leaveBlankToKeep")}`
                  : "re_..."
              }
              onChange={(e) =>
                setData((d) => ({
                  ...d,
                  resend: { ...d.resend, newApiKey: e.target.value },
                }))
              }
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
            <p className="text-xs text-gray-500 mt-1">
              {data.resend.apiKeySource === "environment"
                ? t("emailSettings.keyFromEnv")
                : data.resend.apiKeySource === "database"
                  ? t("emailSettings.keyFromDb")
                  : t("emailSettings.keyMissing")}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t("emailSettings.defaultFromEmail")}
            </label>
            <input
              type="email"
              value={data.resend.defaultFromEmail}
              onChange={(e) =>
                setData((d) => ({
                  ...d,
                  resend: { ...d.resend, defaultFromEmail: e.target.value },
                }))
              }
              placeholder="orders@i-coffee.ng"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
            <p className="text-xs text-gray-500 mt-1">
              {t("emailSettings.verifiedDomainHint")}
            </p>
          </div>
        </div>
      </section>

      {/* Per-country sender identities */}
      <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-white">
            {t("emailSettings.countrySenders")}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t("emailSettings.countrySendersHint")}
          </p>
        </div>

        <div className="space-y-3">
          {data.countries.map((c) => (
            <div
              key={c.countryCode}
              className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 space-y-3"
            >
              <div className="flex items-center gap-2">
                <FlagIcon code={c.countryCode} className="w-5 h-4 rounded-sm" />
                <span className="font-medium text-gray-900 dark:text-white">
                  {c.name}
                </span>
                <span className="text-xs text-gray-500">{c.domain}</span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 uppercase">
                  {c.language}
                </span>
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                <input
                  type="email"
                  value={c.fromEmail}
                  onChange={(e) =>
                    patchCountry(c.countryCode, "fromEmail", e.target.value)
                  }
                  placeholder={`orders@${c.domain}`}
                  className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
                <input
                  type="text"
                  value={c.fromName}
                  onChange={(e) =>
                    patchCountry(c.countryCode, "fromName", e.target.value)
                  }
                  placeholder={`I-Coffee ${c.name}`}
                  className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
                <input
                  type="email"
                  value={c.replyTo}
                  onChange={(e) =>
                    patchCountry(c.countryCode, "replyTo", e.target.value)
                  }
                  placeholder={t("emailSettings.replyToPlaceholder")}
                  className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Test send */}
      <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-white">
            {t("emailSettings.testSend")}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t("emailSettings.testSendHint")}
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[220px]">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t("emailSettings.recipient")}
            </label>
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t("emailSettings.asCountry")}
            </label>
            <select
              value={testCountry}
              onChange={(e) => setTestCountry(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            >
              {data.countries.map((c) => (
                <option key={c.countryCode} value={c.countryCode}>
                  {c.flagEmoji} {c.name}
                </option>
              ))}
            </select>
          </div>
          {data.availableProviders.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => handleTest(p)}
              disabled={testing !== null}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-200 hover:border-amber-400 disabled:opacity-50"
            >
              {testing === p ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {t("emailSettings.testVia", { provider: p })}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

export default EmailProviderSettings;
