//admin
// src/pages/catalogue/ProductCatalogue.jsx
//
// Printable / downloadable product catalogue (PDF).
//  • Access: SALES, SALES_MANAGER, MANAGER, IT, DIRECTOR (+ foreign Managers) — enforced server-side.
//  • Foreign (country-scoped) managers: country/language are LOCKED to their
//    own market (e.g. Togo → French + CFA); HQ admins may pick a country.
//  • Two document types:
//      - Catalogue: internal product list, every field ON by default.
//      - Brochure:  customer-facing, designed PDF (logo, company details, named sales contact),
//        minimal default fields, inline preview, print + download.
//  • Every filter + a per-field toggle list.
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FileDown, Printer, Eye, RefreshCw, Lock, ChevronDown, FileText, BookOpen } from "lucide-react";
import toast from "react-hot-toast";
import { useAdminTranslation } from "../../hooks/useAdminTranslation.js";

const API_BASE = import.meta.env.VITE_APP_API_URL || "http://localhost:8080/api";
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
});

async function getJson(path) {
  const res = await fetch(`${API_BASE}${path}`, { headers: authHeaders() });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(body.message || res.statusText), { status: res.status });
  return body;
}

async function postForBlob(path, payload) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw Object.assign(new Error(body.message || res.statusText), { status: res.status });
  }
  return res.blob();
}

const INPUT =
  "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent";

function MultiSelect({ label, options, value, onChange, allLabel }) {
  const [open, setOpen] = useState(false);
  const toggle = (id) => onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  return (
    <div className="relative">
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">{label}</label>
      <button type="button" onClick={() => setOpen((o) => !o)} className={`${INPUT} flex items-center justify-between text-left`}>
        <span className="truncate">{value.length ? `${value.length} ✓` : allLabel}</span>
        <ChevronDown className="w-4 h-4 shrink-0" />
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full max-h-60 overflow-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-1">
          {options.map((o) => (
            <label key={o.id} className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer dark:text-gray-200">
              <input type="checkbox" checked={value.includes(o.id)} onChange={() => toggle(o.id)} />
              <span className="truncate">{o.name}</span>
            </label>
          ))}
          <button type="button" onClick={() => { onChange([]); setOpen(false); }} className="w-full text-xs text-blue-600 py-1">
            {allLabel}
          </button>
        </div>
      )}
    </div>
  );
}

const EMPTY_FILTERS = {
  search: "", categories: [], subCategories: [], brands: [], productTypes: [],
  roastLevels: [], publish: "PUBLISHED", priceMin: "", priceMax: "", availability: "", featured: false,
};

export default function ProductCatalogue() {
  const { t } = useAdminTranslation();
  const [opts, setOpts] = useState(null);
  const [loadErr, setLoadErr] = useState(null);
  const [docType, setDocType] = useState("catalogue"); // "catalogue" | "brochure"
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [fields, setFields] = useState({});
  const [bFields, setBFields] = useState({});
  const [country, setCountry] = useState("");
  const [language, setLanguage] = useState("");
  const [groupBy, setGroupBy] = useState("category");
  const [sortBy, setSortBy] = useState("category");
  const [busy, setBusy] = useState("");
  const [preview, setPreview] = useState(null);
  // brochure-only state
  const [design, setDesign] = useState({ title: "", subtitle: "", preparedFor: "", layout: "grid2", cover: true, backCover: true, color: "" });
  const [contactUserId, setContactUserId] = useState("");
  const [contactNone, setContactNone] = useState(false);
  const [contact, setContact] = useState({ name: "", phone: "", whatsapp: "", email: "" });
  const [company, setCompany] = useState({ name: "", address: "", phone: "", whatsapp: "", email: "", website: "" });
  const [pdfUrl, setPdfUrl] = useState("");
  const [renderedKey, setRenderedKey] = useState("");
  const urlRef = useRef("");

  const loadOptions = useCallback(async (c = "", l = "") => {
    try {
      const qs = new URLSearchParams();
      if (c) qs.set("country", c);
      if (l) qs.set("language", l);
      const { data } = await getJson(`/admin/catalogue/options?${qs}`);
      setOpts(data);
      setCountry(data.context.countryCode);
      setLanguage(data.context.language);
      setFields((prev) => {
        const next = {};
        data.fields.forEach((f) => { next[f.key] = f.key in prev ? prev[f.key] : f.default; });
        return next;
      });
      setBFields((prev) => {
        const next = {};
        data.brochure.fields.forEach((f) => { next[f.key] = f.key in prev ? prev[f.key] : f.default; });
        return next;
      });
      // contact belongs to the print country: reset when the country changes
      setContactUserId((cur) => (data.brochure.contacts.some((x) => x.id === cur) ? cur : data.brochure.defaultContactId || ""));
      setCompany((cur) => (cur.__country === data.context.countryCode ? cur : { ...data.brochure.company, __country: data.context.countryCode }));
      setLoadErr(null);
    } catch (e) {
      setLoadErr(e);
    }
  }, []);

  useEffect(() => { loadOptions(); }, [loadOptions]);
  useEffect(() => () => { if (urlRef.current) URL.revokeObjectURL(urlRef.current); }, []);

  const ctx = opts?.context;
  const locked = !!ctx?.locked;
  const isBrochure = docType === "brochure";
  const setF = (k, v) => setFilters((f) => ({ ...f, [k]: v }));
  const subOptions = useMemo(() => {
    if (!opts) return [];
    const subs = opts.filters.subCategories;
    return filters.categories.length ? subs.filter((s) => filters.categories.includes(s.category)) : subs;
  }, [opts, filters.categories]);

  const cleanCompany = () => { const { __country, ...rest } = company; return rest; };
  const payload = () => (isBrochure
    ? {
        filters, fields: bFields, country, language, groupBy, sort: { by: sortBy, order: "asc" },
        contactUserId: contactNone ? "" : contactUserId,
        contact: contactNone ? { none: true } : contact,
        brochure: { ...design, company: cleanCompany() },
      }
    : { filters, fields, country, language, groupBy, sort: { by: sortBy, order: "asc" } });
  const payloadKey = JSON.stringify(payload());
  const stale = isBrochure && pdfUrl && renderedKey !== payloadKey;

  const doPreview = async () => {
    setBusy("preview");
    try {
      const res = await fetch(`${API_BASE}/admin/catalogue/preview`, { method: "POST", headers: authHeaders(), body: JSON.stringify(payload()) });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message);
      setPreview(body.data);
    } catch (e) { toast.error(e.message); } finally { setBusy(""); }
  };

  const refreshBrochurePreview = async () => {
    setBusy("brochure-preview");
    const key = payloadKey;
    try {
      const blob = await postForBlob("/admin/catalogue/brochure?inline=1", payload());
      const url = URL.createObjectURL(blob);
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = url;
      setPdfUrl(url);
      setRenderedKey(key);
    } catch (e) { toast.error(e.message); } finally { setBusy(""); }
  };

  // First time the brochure tab opens (options loaded) → render the preview automatically.
  useEffect(() => {
    if (isBrochure && opts && !pdfUrl && !busy) refreshBrochurePreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBrochure, opts]);

  const makePdf = async (mode) => {
    setBusy(mode);
    try {
      const blob = await postForBlob(isBrochure ? "/admin/catalogue/brochure" : "/admin/catalogue/pdf", payload());
      const url = URL.createObjectURL(blob);
      if (mode === "print") {
        const w = window.open(url, "_blank");
        if (w) w.addEventListener("load", () => { try { w.focus(); w.print(); } catch { /* viewer handles it */ } });
        else toast.error(t("catalogue.popupBlocked"));
      } else {
        const a = document.createElement("a");
        a.href = url;
        a.download = `${isBrochure ? "brochure" : "catalogue"}-${country}-${language}-${new Date().toISOString().slice(0, 10)}.pdf`;
        document.body.appendChild(a); a.click(); a.remove();
      }
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (e) {
      toast.error(e.message);
    } finally { setBusy(""); }
  };

  if (loadErr) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 p-4 text-sm">
          {loadErr.status === 403 ? t("catalogue.noAccess") : loadErr.message}
        </div>
      </div>
    );
  }
  if (!opts) return <div className="p-6 text-sm text-gray-500">{t("common.loading")}</div>;

  const selectedCountry = opts.countries.find((c) => c.code === country);
  const activeFields = isBrochure ? opts.brochure.fields : opts.fields;
  const fieldState = isBrochure ? bFields : fields;
  const setFieldState = isBrochure ? setBFields : setFields;
  const allOn = Object.values(fieldState).every(Boolean);
  const chosen = opts.brochure.contacts.find((c) => c.id === contactUserId);
  const SECTION = "rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800";
  const LBL = "block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1";
  const Spin = ({ on, Icon }) => (on ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />);

  const countrySection = (
    <section className={SECTION}>
      <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">{t("catalogue.printFor")}</h2>
      {locked ? (
        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
          <Lock className="w-4 h-4" />
          <span>{t("catalogue.lockedNote", { country: ctx.countryName, language: ctx.language.toUpperCase(), currency: ctx.currency.code })}</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={LBL}>{t("catalogue.country")}</label>
            <select className={INPUT} value={country} onChange={(e) => loadOptions(e.target.value, "")}>
              {opts.countries.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
            </select>
          </div>
          <div>
            <label className={LBL}>{t("catalogue.language")}</label>
            <select className={INPUT} value={language} onChange={(e) => loadOptions(country, e.target.value)}>
              {[...new Set([...(selectedCountry?.supportedLanguages || []), "en"])].map((l) => <option key={l} value={l}>{l.toUpperCase()}</option>)}
            </select>
          </div>
          <div>
            <label className={LBL}>{t("catalogue.currency")}</label>
            <div className={`${INPUT} bg-gray-50 dark:bg-gray-900`}>{ctx.currency.code} {ctx.rate !== 1 ? `(1 NGN = ${ctx.rate} ${ctx.currency.code})` : ""}</div>
          </div>
        </div>
      )}
      {ctx.languageFellBack && <p className="mt-2 text-xs text-amber-600">{t("catalogue.langFallback")}</p>}
    </section>
  );

  const filtersSection = (
    <section className={SECTION}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100">{t("catalogue.filters")}</h2>
        <button className="text-xs text-blue-600" onClick={() => setFilters(EMPTY_FILTERS)}>{t("catalogue.resetFilters")}</button>
      </div>
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${isBrochure ? "" : "lg:grid-cols-4"} gap-4`}>
        <div>
          <label className={LBL}>{t("catalogue.search")}</label>
          <input className={INPUT} value={filters.search} onChange={(e) => setF("search", e.target.value)} placeholder={t("catalogue.searchPlaceholder")} />
        </div>
        <MultiSelect label={t("catalogue.fCategory")} allLabel={t("catalogue.all")} options={opts.filters.categories} value={filters.categories} onChange={(v) => setF("categories", v)} />
        <MultiSelect label={t("catalogue.fSubCategory")} allLabel={t("catalogue.all")} options={subOptions} value={filters.subCategories} onChange={(v) => setF("subCategories", v)} />
        <MultiSelect label={t("catalogue.fBrand")} allLabel={t("catalogue.all")} options={opts.filters.brands} value={filters.brands} onChange={(v) => setF("brands", v)} />
        <MultiSelect label={t("catalogue.fType")} allLabel={t("catalogue.all")} options={opts.filters.productTypes.map((x) => ({ id: x, name: t(`catalogue.type_${x}`) }))} value={filters.productTypes} onChange={(v) => setF("productTypes", v)} />
        <MultiSelect label={t("catalogue.fRoast")} allLabel={t("catalogue.all")} options={opts.filters.roastLevels.map((x) => ({ id: x, name: t(`catalogue.roast_${x}`) }))} value={filters.roastLevels} onChange={(v) => setF("roastLevels", v)} />
        <div>
          <label className={LBL}>{t("catalogue.priceRange", { currency: ctx.currency.code })}</label>
          <div className="flex gap-2">
            <input type="number" min="0" className={INPUT} placeholder={t("catalogue.min")} value={filters.priceMin} onChange={(e) => setF("priceMin", e.target.value)} />
            <input type="number" min="0" className={INPUT} placeholder={t("catalogue.max")} value={filters.priceMax} onChange={(e) => setF("priceMax", e.target.value)} />
          </div>
        </div>
        <div>
          <label className={LBL}>{t("catalogue.availability")}</label>
          <select className={INPUT} value={filters.availability} onChange={(e) => setF("availability", e.target.value)}>
            <option value="">{t("catalogue.all")}</option>
            <option value="inStock">{t("catalogue.inStock")}</option>
            <option value="onRequest">{t("catalogue.onRequest")}</option>
          </select>
        </div>
        <div>
          <label className={LBL}>{t("catalogue.publishStatus")}</label>
          <select className={INPUT} value={filters.publish} onChange={(e) => setF("publish", e.target.value)}>
            <option value="PUBLISHED">{t("catalogue.published")}</option>
            <option value="PENDING">{t("catalogue.pending")}</option>
            <option value="DRAFT">{t("catalogue.draft")}</option>
            <option value="ALL">{t("catalogue.all")}</option>
          </select>
        </div>
        <div>
          <label className={LBL}>{t("catalogue.groupBy")}</label>
          <select className={INPUT} value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
            <option value="category">{t("catalogue.fCategory")}</option>
            <option value="brand">{t("catalogue.fBrand")}</option>
            <option value="none">{t("catalogue.noGrouping")}</option>
          </select>
        </div>
        <div>
          <label className={LBL}>{t("catalogue.sortBy")}</label>
          <select className={INPUT} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="category">{t("catalogue.sortCategory")}</option>
            <option value="name">{t("catalogue.sortName")}</option>
            <option value="price">{t("catalogue.sortPrice")}</option>
            <option value="newest">{t("catalogue.sortNewest")}</option>
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm dark:text-gray-200 self-end pb-2">
          <input type="checkbox" checked={filters.featured} onChange={(e) => setF("featured", e.target.checked)} /> {t("catalogue.featuredOnly")}
        </label>
      </div>
    </section>
  );

  const fieldsSection = (
    <section className={SECTION}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">{isBrochure ? t("catalogue.brochureFieldsTitle") : t("catalogue.fieldsTitle")}</h2>
          <p className="text-xs text-gray-500">{isBrochure ? t("catalogue.brochureFieldsHint") : t("catalogue.fieldsHint")}</p>
        </div>
        <div className="flex gap-3 text-xs text-blue-600 shrink-0">
          <button onClick={() => setFieldState(Object.fromEntries(activeFields.map((f) => [f.key, true])))}>{t("catalogue.selectAll")}</button>
          <button onClick={() => setFieldState(Object.fromEntries(activeFields.map((f) => [f.key, false])))}>{t("catalogue.selectNone")}</button>
        </div>
      </div>
      <div className={`grid grid-cols-2 ${isBrochure ? "" : "sm:grid-cols-3 lg:grid-cols-4"} gap-2`}>
        {activeFields.map((f) => (
          <label key={f.key} className="flex items-center gap-2 text-sm dark:text-gray-200 cursor-pointer">
            <input type="checkbox" checked={!!fieldState[f.key]} onChange={(e) => setFieldState((p) => ({ ...p, [f.key]: e.target.checked }))} />
            {t(`catalogue.field_${f.key}`)}
          </label>
        ))}
      </div>
      {!isBrochure && !allOn && <p className="mt-2 text-xs text-gray-500">{t("catalogue.someHidden")}</p>}
      {fieldState.image && <p className="mt-2 text-xs text-gray-500">{t("catalogue.imageLimit", { max: opts.limits.maxProductsWithImages })}</p>}
    </section>
  );

  const setD = (k, v) => setDesign((d) => ({ ...d, [k]: v }));
  const designSection = (
    <section className={SECTION}>
      <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">{t("catalogue.brochureDesign")}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={LBL}>{t("catalogue.bTitle")}</label>
          <input className={INPUT} maxLength={80} value={design.title} onChange={(e) => setD("title", e.target.value)} placeholder={t("catalogue.bTitlePlaceholder")} />
        </div>
        <div>
          <label className={LBL}>{t("catalogue.bSubtitle")}</label>
          <input className={INPUT} maxLength={120} value={design.subtitle} onChange={(e) => setD("subtitle", e.target.value)} placeholder={t("catalogue.bSubtitlePlaceholder")} />
        </div>
        <div>
          <label className={LBL}>{t("catalogue.bPreparedFor")}</label>
          <input className={INPUT} maxLength={80} value={design.preparedFor} onChange={(e) => setD("preparedFor", e.target.value)} />
        </div>
        <div>
          <label className={LBL}>{t("catalogue.bLayout")}</label>
          <select className={INPUT} value={design.layout} onChange={(e) => setD("layout", e.target.value)}>
            {opts.brochure.layouts.map((l) => <option key={l} value={l}>{t(`catalogue.layout_${l}`)}</option>)}
          </select>
        </div>
        <div>
          <label className={LBL}>{t("catalogue.bColor")}</label>
          <div className="flex items-center gap-2">
            <input type="color" className="h-9 w-12 rounded border border-gray-300 dark:border-gray-600" value={design.color || opts.brochure.company.primaryColor || "#4a2c17"} onChange={(e) => setD("color", e.target.value)} />
            {design.color && <button className="text-xs text-blue-600" onClick={() => setD("color", "")}>{t("catalogue.resetFilters")}</button>}
          </div>
        </div>
        <div className="flex items-end gap-5 pb-2">
          <label className="flex items-center gap-2 text-sm dark:text-gray-200"><input type="checkbox" checked={design.cover} onChange={(e) => setD("cover", e.target.checked)} /> {t("catalogue.bCover")}</label>
          <label className="flex items-center gap-2 text-sm dark:text-gray-200"><input type="checkbox" checked={design.backCover} onChange={(e) => setD("backCover", e.target.checked)} /> {t("catalogue.bBackCover")}</label>
        </div>
      </div>
    </section>
  );

  const contactSection = (
    <section className={SECTION}>
      <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">{t("catalogue.contactSection")}</h2>
      <label className={LBL}>{t("catalogue.contactPerson")}</label>
      <select
        className={INPUT}
        value={contactNone ? "__none" : contactUserId}
        onChange={(e) => { if (e.target.value === "__none") { setContactNone(true); } else { setContactNone(false); setContactUserId(e.target.value); } }}
      >
        <option value="__none">{t("catalogue.contactNone")}</option>
        {!opts.brochure.defaultContactId && <option value="">—</option>}
        {opts.brochure.contacts.map((c) => <option key={c.id} value={c.id}>{c.name}{c.phone ? ` · ${c.phone}` : ""}</option>)}
      </select>
      {!contactNone && (
        <>
          <p className="text-xs text-gray-500 mt-3 mb-2">{t("catalogue.contactOverrideHint")}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[["name", "cName"], ["phone", "cPhone"], ["whatsapp", "cWhatsapp"], ["email", "cEmail"]].map(([k, lk]) => (
              <div key={k}>
                <label className={LBL}>{t(`catalogue.${lk}`)}</label>
                <input className={INPUT} value={contact[k]} onChange={(e) => setContact((c) => ({ ...c, [k]: e.target.value }))} placeholder={chosen?.[k] || ""} />
              </div>
            ))}
          </div>
        </>
      )}
      <h3 className="font-semibold text-gray-800 dark:text-gray-100 mt-5 mb-1">{t("catalogue.companySection")}</h3>
      <p className="text-xs text-gray-500 mb-2">{t("catalogue.companyHint")}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[["name", "cmpName"], ["address", "cmpAddress"], ["phone", "cPhone"], ["whatsapp", "cWhatsapp"], ["email", "cEmail"], ["website", "cmpWebsite"]].map(([k, lk]) => (
          <div key={k}>
            <label className={LBL}>{t(`catalogue.${lk}`)}</label>
            <input className={INPUT} value={company[k] || ""} onChange={(e) => setCompany((c) => ({ ...c, [k]: e.target.value }))} />
          </div>
        ))}
      </div>
    </section>
  );

  const previewPanel = (
    <section className={`${SECTION} xl:sticky xl:top-4`}>
      <div className="flex items-center justify-between gap-2 mb-3">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100">{t("catalogue.previewPdf")}</h2>
        <button onClick={refreshBrochurePreview} disabled={!!busy} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm dark:text-gray-200 disabled:opacity-50">
          <Spin on={busy === "brochure-preview"} Icon={RefreshCw} /> {t("catalogue.refreshPreview")}
        </button>
      </div>
      {stale && <p className="mb-2 text-xs text-amber-600">{t("catalogue.previewStale")}</p>}
      <div className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900" style={{ height: "78vh" }}>
        {pdfUrl ? (
          <iframe title="brochure-preview" src={`${pdfUrl}#toolbar=0&navpanes=0&view=FitH`} className="w-full h-full" />
        ) : (
          <div className="h-full flex items-center justify-center text-sm text-gray-500">{busy === "brochure-preview" ? t("catalogue.previewGenerating") : t("catalogue.previewEmpty")}</div>
        )}
        {busy === "brochure-preview" && pdfUrl && (
          <div className="absolute inset-0 bg-white/60 dark:bg-black/40 flex items-center justify-center text-sm text-gray-700 dark:text-gray-200">{t("catalogue.previewGenerating")}</div>
        )}
      </div>
    </section>
  );

  const sampleSection = preview && !isBrochure && (
    <section className={SECTION}>
      <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-1">{t("catalogue.previewTitle", { count: preview.total })}</h2>
      <p className="text-xs text-gray-500 mb-3">{preview.context.countryCode} · {preview.context.language.toUpperCase()} · {preview.context.currency.code}</p>
      <ul className="divide-y divide-gray-100 dark:divide-gray-700">
        {preview.sample.map((p) => (
          <li key={p.id} className="flex items-center gap-3 py-2 text-sm dark:text-gray-200">
            {p.imageUrl ? <img src={p.imageUrl} alt="" className="w-10 h-10 object-contain rounded" /> : <div className="w-10 h-10 rounded bg-gray-100 dark:bg-gray-700" />}
            <div className="flex-1 min-w-0">
              <div className="truncate font-medium">{p.name}</div>
              <div className="text-xs text-gray-500">{p.sku} · {p.category}</div>
            </div>
            <div className="font-semibold">{new Intl.NumberFormat(undefined, { maximumFractionDigits: preview.context.currency.decimals }).format(p.price)} {preview.context.currency.code}</div>
          </li>
        ))}
      </ul>
      {preview.total > preview.sample.length && <p className="text-xs text-gray-500 mt-2">{t("catalogue.andMore", { count: preview.total - preview.sample.length })}</p>}
    </section>
  );

  return (
    <div className={`p-4 md:p-6 space-y-6 mx-auto ${isBrochure ? "max-w-[1500px]" : "max-w-6xl"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("catalogue.title")}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("catalogue.subtitle")}</p>
        </div>
        <div className="flex gap-2">
          {!isBrochure && (
            <button onClick={doPreview} disabled={!!busy} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm dark:text-gray-200 disabled:opacity-50">
              <Spin on={busy === "preview"} Icon={Eye} /> {t("catalogue.preview")}
            </button>
          )}
          <button onClick={() => makePdf("print")} disabled={!!busy} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-600 text-blue-700 dark:text-blue-300 text-sm disabled:opacity-50">
            <Spin on={busy === "print"} Icon={Printer} /> {t("catalogue.print")}
          </button>
          <button onClick={() => makePdf("download")} disabled={!!busy} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50">
            <Spin on={busy === "download"} Icon={FileDown} /> {t("catalogue.download")}
          </button>
        </div>
      </div>

      {/* Document type */}
      <section className={SECTION}>
        <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">{t("catalogue.docTypeTitle")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[["catalogue", FileText, "docCatalogue"], ["brochure", BookOpen, "docBrochure"]].map(([k, Icon, lk]) => (
            <button
              key={k}
              type="button"
              onClick={() => setDocType(k)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-left text-sm transition ${docType === k ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200" : "border-gray-300 dark:border-gray-600 dark:text-gray-200 hover:border-blue-400"}`}
            >
              <Icon className="w-5 h-5 shrink-0" /> <span className="font-medium">{t(`catalogue.${lk}`)}</span>
            </button>
          ))}
        </div>
        {isBrochure && <p className="mt-2 text-xs text-gray-500">{t("catalogue.docBrochureHint")}</p>}
      </section>

      {isBrochure ? (
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">
          <div className="xl:col-span-2 space-y-6">
            {countrySection}
            {designSection}
            {fieldsSection}
            {contactSection}
            {filtersSection}
          </div>
          <div className="xl:col-span-3">{previewPanel}</div>
        </div>
      ) : (
        <>
          {countrySection}
          {filtersSection}
          {fieldsSection}
          {sampleSection}
        </>
      )}
    </div>
  );
}
