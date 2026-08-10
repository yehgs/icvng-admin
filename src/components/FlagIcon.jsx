// components/FlagIcon.jsx
//
// Renders actual SVG flag artwork instead of Unicode flag emoji
// (🇬🇧🇫🇷🇮🇹 etc). Windows has never shipped native color flag glyphs —
// Chrome and Edge on Windows fall back to showing the raw two-letter
// regional-indicator code (or nothing) instead of a flag, which is the
// "flag doesn't display on Chrome/Explorer" bug. SVG artwork renders
// identically everywhere regardless of OS emoji-font support.
//
// Usage: <FlagIcon code="TG" className="w-5 h-5" /> or code="fr" for a
// language flag (GB/FR/IT keys work for both language and country use —
// see LANG_TO_COUNTRY below for the language-code aliases).
import React from "react";

// Language codes map to the flag of the country most associated with
// that language for this app's purposes (en → GB, fr → FR, it → IT).
const LANG_TO_COUNTRY = { en: "GB", fr: "FR", it: "IT" };

const FLAGS = {
  GB: (
    <svg viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg">
      <rect width="60" height="30" fill="#00247d" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#cf142b" strokeWidth="2" />
      <path d="M30,0 V30 M0,15 H60" stroke="#fff" strokeWidth="10" />
      <path d="M30,0 V30 M0,15 H60" stroke="#cf142b" strokeWidth="6" />
    </svg>
  ),
  FR: (
    <svg viewBox="0 0 3 2" xmlns="http://www.w3.org/2000/svg">
      <rect width="1" height="2" x="0" fill="#0055A4" />
      <rect width="1" height="2" x="1" fill="#fff" />
      <rect width="1" height="2" x="2" fill="#EF4135" />
    </svg>
  ),
  IT: (
    <svg viewBox="0 0 3 2" xmlns="http://www.w3.org/2000/svg">
      <rect width="1" height="2" x="0" fill="#009246" />
      <rect width="1" height="2" x="1" fill="#fff" />
      <rect width="1" height="2" x="2" fill="#CE2B37" />
    </svg>
  ),
  NG: (
    <svg viewBox="0 0 3 2" xmlns="http://www.w3.org/2000/svg">
      <rect width="1" height="2" x="0" fill="#008751" />
      <rect width="1" height="2" x="1" fill="#fff" />
      <rect width="1" height="2" x="2" fill="#008751" />
    </svg>
  ),
  TG: (
    <svg viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg">
      <rect width="30" height="20" fill="#006a4e" />
      <rect y="4" width="30" height="4" fill="#ffce00" />
      <rect y="12" width="30" height="4" fill="#ffce00" />
      <rect width="10" height="12" fill="#d21034" />
      <polygon points="5,3 5.9,5.6 8.6,5.6 6.4,7.2 7.2,9.8 5,8.2 2.8,9.8 3.6,7.2 1.4,5.6 4.1,5.6" fill="#fff" />
    </svg>
  ),
  BJ: (
    <svg viewBox="0 0 3 2" xmlns="http://www.w3.org/2000/svg">
      <rect width="3" height="2" fill="#fcd116" />
      <rect width="3" height="1" fill="#e8112d" />
      <rect width="1" height="2" fill="#008751" />
    </svg>
  ),
};

const FlagIcon = ({ code, className = "w-5 h-5 rounded-sm" }) => {
  const key = LANG_TO_COUNTRY[code?.toLowerCase()] || code?.toUpperCase();
  const flag = FLAGS[key];
  if (!flag) return <span className={className}>🌐</span>;
  return (
    <span className={`inline-block overflow-hidden ${className}`}>
      {React.cloneElement(flag, { className: "w-full h-full object-cover" })}
    </span>
  );
};

export default FlagIcon;
