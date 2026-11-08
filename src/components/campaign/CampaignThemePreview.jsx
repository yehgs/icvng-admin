// admin/src/components/campaign/CampaignThemePreview.jsx
//
// A live, read-only preview of how a theme will look on the storefront. It uses
// the SAME core helpers the storefront and mobile app use (theme tokens, effect
// spec) so what admins approve is what shoppers get. Pure presentation: it has
// no pricing logic, takes no network calls, and cannot affect the live site.
import React, { useEffect, useMemo, useState } from "react";
import { getThemeTokens, getEffectSpec, getCountdownParts } from "@yehgs/icvng-core/campaigns";
import { useAdminTranslation } from "../../hooks/useAdminTranslation.js";

const FRAME = { desktop: "w-full", mobile: "w-[300px] mx-auto", app: "w-[260px] mx-auto" };

function Flakes({ spec, color }) {
  // Decorative only: aria-hidden, pointer-events-none, transform/opacity animation, bounded count.
  const flakes = useMemo(
    () =>
      Array.from({ length: spec.count }, (_, i) => ({
        left: (i * 97) % 100,
        size: spec.minSize + ((i * 7) % (spec.maxSize - spec.minSize + 1)),
        delay: ((i * 13) % 100) / 10,
        duration: (spec.minDurationMs + ((i * 331) % (spec.maxDurationMs - spec.minDurationMs))) / 1000,
        drift: ((i * 17) % 40) - 20,
      })),
    [spec],
  );
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <style>{`@keyframes campaign-fall{0%{transform:translate3d(0,-10%,0);opacity:0}10%{opacity:.9}100%{transform:translate3d(var(--drift),110%,0);opacity:0}}
@media (prefers-reduced-motion: reduce){.campaign-flake{animation:none!important;opacity:.0!important}}`}</style>
      {flakes.map((f, i) => (
        <span
          key={i}
          className="campaign-flake absolute rounded-full"
          style={{
            left: `${f.left}%`, top: 0, width: f.size, height: f.size, background: color, opacity: 0,
            "--drift": `${f.drift}px`,
            animation: `campaign-fall ${f.duration}s linear ${f.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

export default function CampaignThemePreview({ theme, name, tagline, endsAt, showCountdown, frame = "desktop", sampleDiscount = 20 }) {
  const { t } = useAdminTranslation();
  const tokens = getThemeTokens(theme);
  const [tick, setTick] = useState(Date.now());
  useEffect(() => {
    if (!showCountdown || !endsAt) return undefined;
    const id = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, [showCountdown, endsAt]);

  if (!tokens) return null;
  const c = tokens.colors;
  const area = frame === "desktop" ? 1200 * 700 : frame === "mobile" ? 390 * 700 : 360 * 700;
  const spec = getEffectSpec({ theme, areaPx: area });
  const cd = showCountdown && endsAt ? getCountdownParts(endsAt, 0, tick) : null;
  const font = tokens.fontFamily === "SERIF" ? "Georgia, 'Times New Roman', serif" : tokens.fontFamily === "SANS" ? "system-ui, -apple-system, 'Segoe UI', sans-serif" : "inherit";
  const original = 50000;
  const final = original * (1 - sampleDiscount / 100);

  return (
    <div className={FRAME[frame] || FRAME.desktop}>
      <div className="relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700" style={{ background: c.background || "#fff", color: c.text || "#000", fontFamily: font }}>
        {spec.enabled && <Flakes spec={spec} color={c.accent || c.primary || "#fff"} />}
        <div className="relative p-4" style={{ background: c.secondary || "transparent" }}>
          <div className="flex items-center justify-between text-xs" style={{ color: c.muted }}>
            <span>{t("campaigns.preview.storeName")}</span>
            <span>{t("campaigns.preview.cart")}</span>
          </div>
        </div>
        {tokens.bannerImage ? (
          <img src={frame === "desktop" ? tokens.bannerImage : tokens.mobileBannerImage || tokens.bannerImage} alt="" className="block w-full h-32 object-cover" />
        ) : (
          <div className="relative px-5 py-8" style={{ background: c.primary, color: c.badgeText && c.primary ? undefined : undefined }}>
            <p className="text-xs uppercase tracking-widest opacity-80" style={{ color: c.accent }}>{t("campaigns.preview.eyebrow")}</p>
            <h3 className="mt-1 text-2xl font-bold" style={{ color: c.text === c.primary ? c.background : "#fff" }}>{name || t("campaigns.preview.sampleName")}</h3>
            {tagline && <p className="mt-1 text-sm" style={{ color: "#fff", opacity: 0.9 }}>{tagline}</p>}
          </div>
        )}
        {cd && (
          <div className="relative flex justify-center gap-3 py-2 text-sm font-semibold" style={{ background: c.surface, color: c.text }} role="timer" aria-label={t("campaigns.preview.countdown")}>
            {cd.expired ? t("campaigns.preview.ended") : `${cd.days}d ${String(cd.hours).padStart(2, "0")}h ${String(cd.minutes).padStart(2, "0")}m ${String(cd.seconds).padStart(2, "0")}s`}
          </div>
        )}
        <div className="relative p-4">
          <div className="rounded-lg p-3" style={{ background: c.surface }}>
            <div className="relative h-20 rounded-md" style={{ background: c.background, border: `1px dashed ${c.muted || "#999"}` }}>
              <span className="absolute left-2 top-2 rounded px-2 py-0.5 text-xs font-bold" style={{ background: c.badgeBackground, color: c.badgeText }}>
                {t("campaigns.preview.percentOff", { value: sampleDiscount })}
              </span>
            </div>
            <p className="mt-2 text-sm font-semibold">{t("campaigns.preview.sampleProduct")}</p>
            <p className="text-xs" style={{ color: c.muted }}>
              <span className="line-through">{original.toLocaleString()}</span>
              <span className="ml-2 text-sm font-bold" style={{ color: c.text }}>{final.toLocaleString()}</span>
            </p>
            <button type="button" tabIndex={-1} className="mt-2 w-full rounded-md py-1.5 text-sm font-semibold" style={{ background: c.primary, color: "#fff" }}>
              {t("campaigns.preview.addToCart")}
            </button>
          </div>
        </div>
      </div>
      <p className="mt-1 text-center text-xs text-gray-500">{t("campaigns.preview.note")}</p>
    </div>
  );
}
