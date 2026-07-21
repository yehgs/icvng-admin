// admin/src/pages/content/SliderManagement.jsx
import React, { useState, useEffect } from 'react';
import {
  Image, Plus, Edit2, Trash2, Eye, EyeOff, RefreshCw,
  MoveUp, MoveDown, ExternalLink, CheckCircle, XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiCall, handleApiError, fileAPI } from "../../utils/api";
import { useAdminTranslation } from "../../hooks/useAdminTranslation.js";
import { useAdminCountry } from "../../contexts/AdminCountryContext.jsx";
import InlineTranslateFields from "../../components/translations/InlineTranslateFields";

const EMPTY_FORM = { title: '', description: '', imageUrl: '', url: '', isActive: true, order: 0, countryCode: 'NG' };

const SliderManagement = () => {
  const { t } = useAdminTranslation();
  const { isGlobalAdmin, countryScope, allCountries } = useAdminCountry();
  const [sliders, setSliders]         = useState([]);
  const [loading, setLoading]         = useState(false);
  const [showForm, setShowForm]       = useState(false);
  const [editing, setEditing]         = useState(null); // null = create, object = edit
  const [form, setForm]               = useState(EMPTY_FORM);
  const [submitting, setSubmitting]   = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [countryFilter, setCountryFilter] = useState('ALL');

  useEffect(() => { fetchSliders(); }, []);

  const fetchSliders = async () => {
    setLoading(true);
    try {
      const res = await apiCall('/slider/all');
      if (res.success) setSliders(res.data || []);
    } catch (err) {
      toast.error(handleApiError(err, 'Failed to load sliders'));
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, countryCode: countryScope || (countryFilter !== 'ALL' ? countryFilter : 'NG') });
    setShowForm(true);
  };
  const openEdit   = (s)  => { setEditing(s); setForm({ ...EMPTY_FORM, ...s }); setShowForm(true); };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImg(true);
    try {
      const res = await fileAPI.uploadImage(file);
      if (res?.data?.url) {
        setForm((prev) => ({ ...prev, imageUrl: res.data.url }));
        toast.success('Image uploaded');
      }
    } catch (err) {
      toast.error('Image upload failed');
    } finally {
      setUploadingImg(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.title?.trim()) { toast.error('Title is required'); return; }
    if (!form.imageUrl?.trim()) { toast.error('Image is required'); return; }
    setSubmitting(true);
    try {
      const res = editing
        ? await apiCall('/slider/update', { method: 'PUT',  body: { ...form, _id: editing._id } })
        : await apiCall('/slider/add',    { method: 'POST', body: form });
      if (res.success) {
        toast.success(editing ? 'Slider updated' : 'Slider created');
        setShowForm(false);
        fetchSliders();
      } else {
        toast.error(res.message || 'Failed');
      }
    } catch (err) {
      toast.error(handleApiError(err, 'Failed to save slider'));
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (s) => {
    try {
      const res = await apiCall('/slider/update', { method: 'PUT', body: { _id: s._id, isActive: !s.isActive } });
      if (res.success) { toast.success(`Slider ${!s.isActive ? 'activated' : 'deactivated'}`); fetchSliders(); }
    } catch (err) { toast.error('Failed to toggle'); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await apiCall('/slider/delete', { method: 'DELETE', body: { _id: deleteTarget._id } });
      if (res.success) { toast.success('Slider deleted'); setDeleteTarget(null); fetchSliders(); }
    } catch (err) { toast.error('Failed to delete'); }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Image className="w-6 h-6 text-purple-600" />
            Slider Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage homepage hero sliders shown on the website
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isGlobalAdmin ? (
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800"
            >
              <option value="ALL">All markets</option>
              {allCountries.map((c) => (
                <option key={c.code} value={c.code}>{c.flagEmoji ? `${c.flagEmoji} ` : ''}{c.name}</option>
              ))}
            </select>
          ) : (
            <span className="text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 rounded-lg px-3 py-2">
              {countryScope} only
            </span>
          )}
          <button onClick={fetchSliders} className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm">
            <Plus className="w-4 h-4" />
            Add Slider
          </button>
        </div>
      </div>

      {/* Sliders list */}
      {loading ? (
        <div className="flex justify-center py-12"><RefreshCw className="w-6 h-6 text-purple-500 animate-spin" /></div>
      ) : sliders.filter((s) => countryFilter === 'ALL' || s.countryCode === countryFilter).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <Image className="w-14 h-14 mb-4 opacity-30" />
          <p>No sliders yet. Add one to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {sliders
            .filter((s) => countryFilter === 'ALL' || s.countryCode === countryFilter)
            .slice()
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .map((s) => (
              <div key={s._id} className={`bg-white dark:bg-gray-800 rounded-xl border overflow-hidden flex items-stretch gap-0 ${s.isActive ? 'border-gray-200 dark:border-gray-700' : 'border-dashed border-gray-300 dark:border-gray-600 opacity-60'}`}>
                {/* Preview image */}
                <div className="w-40 flex-shrink-0 bg-gray-100 dark:bg-gray-700 relative">
                  {s.imageUrl ? (
                    <img src={s.imageUrl} alt={s.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute top-2 left-2">
                    <span className="bg-black/60 text-white text-xs px-2 py-0.5 rounded font-mono">#{s.order ?? 0}</span>
                  </div>
                  <div className="absolute bottom-2 left-2">
                    <span className="bg-white/90 text-gray-700 text-xs px-2 py-0.5 rounded font-semibold">{s.countryCode || 'NG'}</span>
                  </div>
                </div>
                {/* Content */}
                <div className="flex-1 p-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">{s.title}</h3>
                      {s.isActive
                        ? <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">{t("common.active")}</span>
                        : <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs font-medium">{t("common.inactive")}</span>}
                    </div>
                    {s.description && <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{s.description}</p>}
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {s.url && (
                      <a href={s.url} target="_blank" rel="noreferrer" title={s.url}
                        className="p-2 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    <button onClick={() => toggleActive(s)} title={s.isActive ? 'Deactivate' : 'Activate'}
                      className={`p-2 rounded-lg transition ${s.isActive ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                      {s.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button onClick={() => openEdit(s)} title="Edit"
                      className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteTarget(s)} title="Delete"
                      className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Create / Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {editing ? 'Edit Slider' : 'Add New Slider'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="p-5 space-y-4">
              {/* Image preview and upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Slider Image <span className="text-red-500">*</span></label>
                {form.imageUrl && (
                  <img src={form.imageUrl} alt="preview" className="w-full h-36 object-cover rounded-lg mb-3 border" />
                )}
                <input type="text" placeholder="Paste image URL or upload below…"
                  value={form.imageUrl}
                  onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white mb-2"
                />
                <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-500 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                  {uploadingImg ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {uploadingImg ? 'Uploading…' : 'Upload image'}
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImg} />
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title <span className="text-red-500">*</span></label>
                <input type="text" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Summer Coffee Collection"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("common.description")}</label>
                <textarea rows={2} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Optional tagline shown on the slide"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white resize-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("content.linkUrl")}</label>
                <input type="url" value={form.url} onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))}
                  placeholder="https://…  (where the slide links to)"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white" />
              </div>

              {/* Market — which domain this slide shows on. If a market
                  never adds its own, HQ's (Nigeria's) slide is shown there instead. */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Market</label>
                {isGlobalAdmin ? (
                  <select value={form.countryCode} onChange={(e) => setForm((p) => ({ ...p, countryCode: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white">
                    {allCountries.map((c) => (
                      <option key={c.code} value={c.code}>{c.flagEmoji ? `${c.flagEmoji} ` : ''}{c.name} ({c.code})</option>
                    ))}
                  </select>
                ) : (
                  <div className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                    {countryScope} (your assigned market)
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  Shown only on this market's domain. If left unset for a market, HQ's (Nigeria's) slide shows there instead.
                </p>
              </div>

              {editing && (
                <InlineTranslateFields
                  entityType="slider"
                  entity={editing}
                  fields={["title", "description"]}
                  fieldLabels={{ title: "Title", description: t("common.description") }}
                />
              )}

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Display Order</label>
                  <input type="number" min="0" value={form.order} onChange={(e) => setForm((p) => ({ ...p, order: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white" />
                </div>
                <div className="flex items-end pb-0.5">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <div
                      onClick={() => setForm((p) => ({ ...p, isActive: !p.isActive }))}
                      className={`relative w-11 h-6 rounded-full transition-colors ${form.isActive ? 'bg-green-500' : 'bg-gray-300'}`}
                    >
                      <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.isActive ? 'translate-x-5' : ''}`} />
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t("common.active")}</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 pt-0">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={submitting}
                className="px-5 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2">
                {submitting && <RefreshCw className="w-3 h-3 animate-spin" />}
                {editing ? 'Save Changes' : 'Create Slider'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-sm w-full text-center">
            <Trash2 className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Delete Slider?</h3>
            <p className="text-sm text-gray-500 mb-5">
              <strong>{deleteTarget.title}</strong> will be permanently removed from the homepage.
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">{t("common.cancel")}</button>
              <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">{t("common.delete")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SliderManagement;
