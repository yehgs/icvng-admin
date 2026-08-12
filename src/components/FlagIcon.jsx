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
// Arabic, Hindi, and Mandarin aren't tied to a single country the way the
// others are — SA/IN/CN are just the conventional flag used to represent
// each language in a UI switcher (a common web convention, not a claim
// about "the" Arabic/Hindi/Chinese-speaking country).
const LANG_TO_COUNTRY = {
  en: "GB",
  fr: "FR",
  it: "IT",
  es: "ES",
  pt: "PT",
  nl: "NL",
  ar: "SA",
  hi: "IN",
  zh: "CN",
};

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
  ES: (
    <svg viewBox="0 0 3 2" xmlns="http://www.w3.org/2000/svg">
      <rect width="3" height="2" fill="#AA151B" />
      <rect width="3" height="1" y="0.5" fill="#F1BF00" />
    </svg>
  ),
  PT: (
    <svg viewBox="0 0 3 2" xmlns="http://www.w3.org/2000/svg">
      <rect width="3" height="2" fill="#FF0000" />
      <rect width="1.2" height="2" fill="#046A38" />
    </svg>
  ),
  NL: (
    <svg viewBox="0 0 3 2" xmlns="http://www.w3.org/2000/svg">
      <rect width="3" height="2" fill="#21468B" />
      <rect width="3" height="1.333" fill="#FFFFFF" />
      <rect width="3" height="0.667" fill="#AE1C28" />
    </svg>
  ),
  // Simplified — the real Saudi flag carries the Shahada in Arabic
  // calligraphy plus a sword, which isn't something to approximate with
  // basic SVG shapes. Plain green (the flag's field color) stands in as a
  // simple, respectful language-picker icon rather than an inaccurate
  // rendering of religious text. Swap in real artwork here if you have a
  // licensed asset you'd rather use.
  SA: (
    <svg viewBox="0 0 3 2" xmlns="http://www.w3.org/2000/svg">
      <rect width="3" height="2" fill="#006C35" />
    </svg>
  ),
  IN: (
    <svg viewBox="0 0 3 2" xmlns="http://www.w3.org/2000/svg">
      <rect width="3" height="2" fill="#fff" />
      <rect width="3" height="0.667" fill="#FF9933" />
      <rect width="3" height="0.667" y="1.333" fill="#138808" />
      <circle cx="1.5" cy="1" r="0.28" fill="none" stroke="#000080" strokeWidth="0.03" />
      <circle cx="1.5" cy="1" r="0.03" fill="#000080" />
    </svg>
  ),
  CN: (
    <svg viewBox="0 0 3 2" xmlns="http://www.w3.org/2000/svg">
      <rect width="3" height="2" fill="#DE2910" />
      <polygon points="0.5,0.35 0.61,0.68 0.95,0.68 0.67,0.88 0.78,1.21 0.5,1 0.22,1.21 0.33,0.88 0.05,0.68 0.39,0.68" fill="#FFDE00" />
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
