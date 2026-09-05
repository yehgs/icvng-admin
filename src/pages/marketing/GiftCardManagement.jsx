// admin/src/pages/marketing/GiftCardManagement.jsx
import React, { useState, useEffect } from "react";
import {
  Gift, Plus, RefreshCw, Search, Mail, Ban, CheckCircle2, X, History,
} from "lucide-react";
import toast from "react-hot-toast";
import { apiCall, handleApiError } from "../../utils/api";
import { useAdminTranslation } from "../../hooks/useAdminTranslation.js";
import { useAdminCountry } from "../../contexts/AdminCountryContext.jsx";

const STATUS_STYLE = {
  ACTIVE: "bg-green-100 text-green-700",
  REDEEMED: "bg-gray-100 text-gray-500",
  DISABLED: "bg-red-100 text-red-700",
  EXPIRED: "bg-amber-100 text-amber-700",
};

const ISSUE_FORM_EMPTY = {
  amount: "",
  currency: "NGN",
  recipientName: "",
  recipientEmail: "",
  message: "",
  expiryDate: "",
  adminNote: "",
  countryCode: "NG",
  sendEmail: true,
};

const GiftCardManagement = () => {
  const { t } = useAdminTranslation();
  const { isGlobalAdmin, countryScope, allCountries } = useAdminCountry();

  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [search, setSearch] = useState("");

  const [showIssue, setShowIssue] = useState(false);
  const [issueForm, setIssueForm] = useState(ISSUE_FORM_EMPTY);
  const [issuing, setIssuing] = useState(false);

  const [detail, setDetail] = useState(null); // selected card for the drawer
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustNote, setAdjustNote] = useState("");
  const [savingAdjust, setSavingAdjust] = useState(false);

  useEffect(() => {
    fetchCards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, sourceFilter]);

  const fetchCards = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (sourceFilter) params.set("source", sourceFilter);
      if (search) params.set("search", search);
      const res = await apiCall(`/gift-card/admin/get?${params.toString()}`);
      if (res.success) setCards(res.data || []);
    } catch (err) {
      toast.error(handleApiError(err, t("giftCards.failedToLoad")));
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCards();
  };

  const openIssue = () => {
    setIssueForm({
      ...ISSUE_FORM_EMPTY,
      countryCode: countryScope || "NG",
    });
    setShowIssue(true);
  };

  const submitIssue = async () => {
    if (!issueForm.amount || !issueForm.recipientEmail) {
      toast.error(t("giftCards.amountAndEmailRequired"));
      return;
    }
    setIssuing(true);
    try {
      const res = await apiCall("/gift-card/admin/issue", {
        method: "POST",
        body: { ...issueForm, amount: Number(issueForm.amount) },
      });
      if (res.success) {
        toast.success(t("giftCards.issued", { code: res.data.code }));
        setShowIssue(false);
        fetchCards();
      } else {
        toast.error(res.message || t("content.failed"));
      }
    } catch (err) {
      toast.error(handleApiError(err, t("giftCards.issueFailed")));
    } finally {
      setIssuing(false);
    }
  };

  const openDetail = (card) => {
    setDetail(card);
    setAdjustAmount("");
    setAdjustNote(card.adminNote || "");
  };

  const setStatus = async (card, status) => {
    try {
      const res = await apiCall(`/gift-card/admin/update/${card._id}`, {
        method: "PUT",
        body: { status },
      });
      if (res.success) {
        toast.success(t("giftCards.updated"));
        fetchCards();
        setDetail(res.data);
      }
    } catch (err) {
      toast.error(handleApiError(err, t("content.saveFailed")));
    }
  };

  const submitAdjustment = async () => {
    if (!detail || !adjustAmount || Number(adjustAmount) === 0) return;
    setSavingAdjust(true);
    try {
      const res = await apiCall(`/gift-card/admin/update/${detail._id}`, {
        method: "PUT",
        body: { balanceAdjustment: Number(adjustAmount), adminNote: adjustNote },
      });
      if (res.success) {
        toast.success(t("giftCards.balanceAdjusted"));
        setDetail(res.data);
        setAdjustAmount("");
        fetchCards();
      }
    } catch (err) {
      toast.error(handleApiError(err, t("content.saveFailed")));
    } finally {
      setSavingAdjust(false);
    }
  };

  const resendEmail = async (card) => {
    try {
      const res = await apiCall(`/gift-card/admin/resend-email/${card._id}`, { method: "POST" });
      if (res.success) toast.success(t("giftCards.emailResent"));
    } catch (err) {
      toast.error(handleApiError(err, t("content.failed")));
    }
  };

  const fmt = (n, currency) => `${currency} ${Number(n || 0).toLocaleString()}`;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Gift className="w-6 h-6 text-indigo-600" />
            {t("giftCards.title")}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t("giftCards.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchCards} className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50">
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
          <button onClick={openIssue} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm">
            <Plus className="w-4 h-4" />
            {t("giftCards.issueManually")}
          </button>
        </div>
      </div>

      {!isGlobalAdmin && (
        <div className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2 inline-block">
          {t("dashboard.scopeCountry", { country: countryScope })}
        </div>
      )}

      {/* Filters */}
      <form onSubmit={handleSearchSubmit} className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("giftCards.searchPlaceholder")}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-800 dark:text-white"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:text-white"
        >
          <option value="">{t("giftCards.allStatuses")}</option>
          <option value="ACTIVE">{t("giftCards.statusActive")}</option>
          <option value="REDEEMED">{t("giftCards.statusRedeemed")}</option>
          <option value="DISABLED">{t("giftCards.statusDisabled")}</option>
          <option value="EXPIRED">{t("giftCards.statusExpired")}</option>
        </select>
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:text-white"
        >
          <option value="">{t("giftCards.allSources")}</option>
          <option value="PURCHASED">{t("giftCards.sourcePurchased")}</option>
          <option value="ADMIN_ISSUED">{t("giftCards.sourceAdminIssued")}</option>
        </select>
        <button type="submit" className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50">
          {t("common.search")}
        </button>
      </form>

      {/* Table */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                {["code", "amount", "balance", "recipient", "status", "source", "actions"].map((k) => (
                  <th key={k} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t(`giftCards.col${k[0].toUpperCase()}${k.slice(1)}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-10"><RefreshCw className="w-5 h-5 animate-spin mx-auto text-indigo-500" /></td></tr>
              ) : cards.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400">{t("giftCards.none")}</td></tr>
              ) : (
                cards.map((c) => (
                  <tr key={c._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer" onClick={() => openDetail(c)}>
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-indigo-700 dark:text-indigo-300">{c.code}</td>
                    <td className="px-4 py-3 text-sm">{fmt(c.initialAmount, c.currency)}</td>
                    <td className="px-4 py-3 text-sm font-semibold">{fmt(c.balance, c.currency)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{c.recipientEmail}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLE[c.status]}`}>
                        {t(`giftCards.status${c.status.charAt(0)}${c.status.slice(1).toLowerCase()}`)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {c.source === "PURCHASED" ? t("giftCards.sourcePurchased") : t("giftCards.sourceAdminIssued")}
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => resendEmail(c)} className="p-1.5 text-gray-400 hover:text-indigo-600" title={t("giftCards.resendEmail")}>
                        <Mail className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Issue modal */}
      {showIssue && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-bold dark:text-white">{t("giftCards.issueManually")}</h2>
              <button onClick={() => setShowIssue(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("giftCards.amount")}</label>
                  <input type="number" min={0} value={issueForm.amount} onChange={(e) => setIssueForm((p) => ({ ...p, amount: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("giftCards.currency")}</label>
                  <select value={issueForm.currency} onChange={(e) => setIssueForm((p) => ({ ...p, currency: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white">
                    {["NGN", "USD", "EUR", "GBP"].map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("giftCards.recipientEmail")}</label>
                <input type="email" value={issueForm.recipientEmail} onChange={(e) => setIssueForm((p) => ({ ...p, recipientEmail: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("giftCards.recipientName")} <span className="text-gray-400 font-normal">({t("common.optional")})</span></label>
                <input type="text" value={issueForm.recipientName} onChange={(e) => setIssueForm((p) => ({ ...p, recipientName: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("giftCards.giftMessage")} <span className="text-gray-400 font-normal">({t("common.optional")})</span></label>
                <textarea rows={2} value={issueForm.message} onChange={(e) => setIssueForm((p) => ({ ...p, message: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("giftCards.internalNote")} <span className="text-gray-400 font-normal">({t("common.optional")})</span></label>
                <input type="text" placeholder={t("giftCards.internalNoteHint")} value={issueForm.adminNote} onChange={(e) => setIssueForm((p) => ({ ...p, adminNote: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("giftCards.expiryDate")} <span className="text-gray-400 font-normal">({t("common.optional")})</span></label>
                  <input type="date" value={issueForm.expiryDate} onChange={(e) => setIssueForm((p) => ({ ...p, expiryDate: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("content.marketLabel")}</label>
                  {isGlobalAdmin ? (
                    <select value={issueForm.countryCode} onChange={(e) => setIssueForm((p) => ({ ...p, countryCode: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white">
                      {allCountries.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}
                    </select>
                  ) : (
                    <div className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{countryScope}</div>
                  )}
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input type="checkbox" checked={issueForm.sendEmail} onChange={(e) => setIssueForm((p) => ({ ...p, sendEmail: e.target.checked }))} />
                {t("giftCards.emailToRecipient")}
              </label>
            </div>
            <div className="flex justify-end gap-3 p-5 pt-0">
              <button onClick={() => setShowIssue(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm">{t("common.cancel")}</button>
              <button onClick={submitIssue} disabled={issuing} className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
                {issuing && <RefreshCw className="w-3 h-3 animate-spin" />}
                {t("giftCards.issue")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail drawer */}
      {detail && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDetail(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-lg font-bold dark:text-white font-mono">{detail.code}</h2>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLE[detail.status]}`}>
                  {t(`giftCards.status${detail.status.charAt(0)}${detail.status.slice(1).toLowerCase()}`)}
                </span>
              </div>
              <button onClick={() => setDetail(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-400">{t("giftCards.amount")}:</span> {fmt(detail.initialAmount, detail.currency)}</div>
                <div><span className="text-gray-400">{t("giftCards.balance")}:</span> <strong>{fmt(detail.balance, detail.currency)}</strong></div>
                <div><span className="text-gray-400">{t("giftCards.recipientEmail")}:</span> {detail.recipientEmail}</div>
                <div><span className="text-gray-400">{t("giftCards.expiryDate")}:</span> {detail.expiryDate ? new Date(detail.expiryDate).toLocaleDateString() : t("giftCards.never")}</div>
              </div>

              <div className="flex gap-2">
                {detail.status !== "DISABLED" ? (
                  <button onClick={() => setStatus(detail, "DISABLED")} className="flex items-center gap-1 px-3 py-1.5 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100">
                    <Ban className="w-3 h-3" />{t("giftCards.disable")}
                  </button>
                ) : (
                  <button onClick={() => setStatus(detail, "ACTIVE")} className="flex items-center gap-1 px-3 py-1.5 text-xs bg-green-50 text-green-600 rounded-lg hover:bg-green-100">
                    <CheckCircle2 className="w-3 h-3" />{t("giftCards.reactivate")}
                  </button>
                )}
                <button onClick={() => resendEmail(detail)} className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">
                  <Mail className="w-3 h-3" />{t("giftCards.resendEmail")}
                </button>
              </div>

              {/* Balance adjustment */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t("giftCards.adjustBalance")}</p>
                <p className="text-xs text-gray-400 mb-2">{t("giftCards.adjustBalanceHint")}</p>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder={t("giftCards.adjustPlaceholder")}
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
                  />
                  <button onClick={submitAdjustment} disabled={savingAdjust || !adjustAmount} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm disabled:opacity-50 flex items-center gap-2">
                    {savingAdjust && <RefreshCw className="w-3 h-3 animate-spin" />}
                    {t("common.apply")}
                  </button>
                </div>
                <input
                  type="text"
                  placeholder={t("giftCards.internalNoteHint")}
                  value={adjustNote}
                  onChange={(e) => setAdjustNote(e.target.value)}
                  className="w-full mt-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Redemption history */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                  <History className="w-4 h-4" />{t("giftCards.redemptionHistory")}
                </p>
                {(!detail.redemptions || detail.redemptions.length === 0) ? (
                  <p className="text-xs text-gray-400">{t("giftCards.noRedemptions")}</p>
                ) : (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {detail.redemptions.slice().reverse().map((r, i) => (
                      <div key={i} className="flex justify-between text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700 pb-1">
                        <span>{r.orderGroupId === "ADMIN_ADJUSTMENT" ? t("giftCards.adminAdjustment") : r.orderGroupId}</span>
                        <span className={r.amount < 0 ? "text-green-600" : ""}>
                          {r.amount < 0 ? "+" : "-"}{fmt(Math.abs(r.amount), detail.currency)}
                        </span>
                        <span>{new Date(r.redeemedAt).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GiftCardManagement;
