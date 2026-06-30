// admin/src/pages/content/BannerManagement.jsx
import React, { useState, useEffect } from 'react';
import { Layout, Plus, Edit2, Trash2, RefreshCw, ExternalLink, Image } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiCall, handleApiError, fileAPI } from "../../utils/api";
import { useAdminTranslation } from "../../hooks/useAdminTranslation.js";

const POSITIONS = [
  { value: 'homepage_side1', label: 'Homepage – Left Side Banner'  },
  { value: 'homepage_side2', label: 'Homepage – Right Side Banner' },
  { value: 'footer',         label: 'Footer Banner'                },
];

const EMPTY_FORM = { title: '', subtitle: '', image: '', link: '', linkText: 'Shop Now', position: 'homepage_side1', isActive: true };

const BannerManagement = () => {
  const { t } = useAdminTranslation();
  const [banners, setBanners]         = useState([]);
  const [loading, setLoading]         = useState(false);
  const [showForm, setShowForm]       = useState(false);
  const [editing, setEditing]         = useState(null);
  const [form, setForm]               = useState(EMPTY_FORM);
  const [submitting, setSubmitting]   = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => { fetchBanners(); }, []);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const res = await apiCall('/banner/get');
      if (res.success) setBanners(res.data || []);
    } catch (err) {
      toast.error(handleApiError(err, 'Failed to load banners'));
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setShowForm(true); };
  const openEdit   = (b)  => { setEditing(b); setForm({ ...b }); setShowForm(true); };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImg(true);
    try {
      const res = await fileAPI.uploadImage(file);
      if (res?.data?.url) { setForm((p) => ({ ...p, image: res.data.url })); toast.success('Image uploaded'); }
    } catch { toast.error('Upload failed'); }
    finally { setUploadingImg(false); }
  };

  const handleSubmit = async () => {
    if (!form.image?.trim()) { toast.error('Banner image is required'); return; }
    if (!form.position)      { toast.error('Position is required'); return; }
    setSubmitting(true);
    try {
      const res = editing
        ? await apiCall('/banner/update', { method: 'PUT',  body: { ...form, _id: editing._id } })
        : await apiCall('/banner/add',    { method: 'POST', body: form });
      if (res.success) { toast.success(editing ? 'Banner updated' : 'Banner created'); setShowForm(false); fetchBanners(); }
      else toast.error(res.message || 'Failed');
    } catch (err) {
      toast.error(handleApiError(err, 'Save failed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await apiCall('/banner/delete', { method: 'DELETE', body: { _id: deleteTarget._id } });
      if (res.success) { toast.success('Banner deleted'); setDeleteTarget(null); fetchBanners(); }
    } catch { toast.error('Delete failed'); }
  };

  const positionLabel = (pos) => POSITIONS.find((p) => p.value === pos)?.label || pos;

  const grouped = POSITIONS.map((pos) => ({
    ...pos,
    items: banners.filter((b) => b.position === pos.value),
  }));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Layout className="w-6 h-6 text-indigo-600" />
            Banner Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage promotional banners shown on the website</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchBanners} className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50">
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm">
            <Plus className="w-4 h-4" />
            Add Banner
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" /></div>
      ) : (
        <div className="space-y-8">
          {grouped.map((group) => (
            <div key={group.value}>
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Layout className="w-4 h-4" />
                {group.label}
                <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-2 py-0.5 rounded-full">{group.items.length}</span>
              </h2>
              {group.items.length === 0 ? (
                <div className="border border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-8 text-center text-gray-400 text-sm">
                  No banners for this position.
                  <button onClick={openCreate} className="block mx-auto mt-2 text-indigo-500 hover:underline text-xs">+ Add one</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {group.items.map((b) => (
                    <div key={b._id} className={`bg-white dark:bg-gray-800 rounded-xl border overflow-hidden ${b.isActive ? 'border-gray-200 dark:border-gray-700' : 'border-dashed border-gray-300 opacity-60'}`}>
                      <div className="relative h-36 bg-gray-100 dark:bg-gray-700">
                        {b.image ? (
                          <img src={b.image} alt={b.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex items-center justify-center h-full"><Image className="w-10 h-10 text-gray-400" /></div>
                        )}
                        <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-medium ${b.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {b.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{b.title || 'Untitled Banner'}</h3>
                        {b.subtitle && <p className="text-xs text-gray-500 mt-0.5">{b.subtitle}</p>}
                        {b.link && (
                          <a href={b.link} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline flex items-center gap-1 mt-1">
                            <ExternalLink className="w-3 h-3" />{b.link}
                          </a>
                        )}
                        <div className="flex gap-2 mt-3">
                          <button onClick={() => openEdit(b)} className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100">
                            <Edit2 className="w-3 h-3" />Edit
                          </button>
                          <button onClick={() => setDeleteTarget(b)} className="flex items-center gap-1 px-3 py-1.5 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100">
                            <Trash2 className="w-3 h-3" />Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{editing ? 'Edit Banner' : 'Add Banner'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="p-5 space-y-4">
              {/* Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Image <span className="text-red-500">*</span></label>
                {form.image && <img src={form.image} alt="preview" className="w-full h-32 object-cover rounded-lg mb-2 border" />}
                <input type="text" placeholder="Paste image URL…"
                  value={form.image} onChange={(e) => setForm((p) => ({ ...p, image: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white mb-2" />
                <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-500 cursor-pointer hover:bg-gray-50">
                  {uploadingImg ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {uploadingImg ? 'Uploading…' : 'Upload image'}
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImg} />
                </label>
              </div>

              {/* Position */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Position <span className="text-red-500">*</span></label>
                <select value={form.position} onChange={(e) => setForm((p) => ({ ...p, position: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white">
                  {POSITIONS.map((pos) => <option key={pos.value} value={pos.value}>{pos.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                <input type="text" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder={t("content.headline")}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("content.subtitle")}</label>
                <input type="text" value={form.subtitle} onChange={(e) => setForm((p) => ({ ...p, subtitle: e.target.value }))}
                  placeholder="Optional sub-heading"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("content.linkUrl")}</label>
                  <input type="url" value={form.link} onChange={(e) => setForm((p) => ({ ...p, link: e.target.value }))}
                    placeholder="https://…"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("content.buttonText")}</label>
                  <input type="text" value={form.linkText} onChange={(e) => setForm((p) => ({ ...p, linkText: e.target.value }))}
                    placeholder={t("content.shopNow")}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white" />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <div onClick={() => setForm((p) => ({ ...p, isActive: !p.isActive }))}
                  className={`relative w-11 h-6 rounded-full transition-colors ${form.isActive ? 'bg-green-500' : 'bg-gray-300'}`}>
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.isActive ? 'translate-x-5' : ''}`} />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t("common.active")}</span>
              </label>
            </div>
            <div className="flex justify-end gap-3 p-5 pt-0">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm">{t("common.cancel")}</button>
              <button onClick={handleSubmit} disabled={submitting}
                className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
                {submitting && <RefreshCw className="w-3 h-3 animate-spin" />}
                {editing ? 'Save Changes' : 'Create Banner'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-sm w-full text-center shadow-xl">
            <Trash2 className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold mb-2 dark:text-white">Delete Banner?</h3>
            <p className="text-sm text-gray-500 mb-5">This will remove the banner from <strong>{positionLabel(deleteTarget.position)}</strong>.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 border rounded-lg text-sm">{t("common.cancel")}</button>
              <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">{t("common.delete")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BannerManagement;
