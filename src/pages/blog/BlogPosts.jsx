// admin/src/pages/blog/BlogPosts.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  FileText,
  Globe,
  X,
  Save,
  Download,
  Calendar,
  User,
  Star,
  ArrowLeft,
  Upload,
  Image as ImageIcon,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  Code,
  Minus,
  Link as LinkIcon,
  Undo,
  Redo,
  Highlighter,
  Heading1,
  Heading2,
  Heading3,
  Type,
  RemoveFormatting,
  CheckCircle,
  Clock,
  Folder,
  Tag as TagIcon,
} from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TiptapImage from "@tiptap/extension-image";
import TiptapLink from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import { blogAPI, fileAPI, handleApiError } from "../../utils/api";
import toast from "react-hot-toast";
import ImageUploader from "../../components/common/ImageUploader";

// ─── Toolbar helpers ──────────────────────────────────────────────────────────
const ToolbarBtn = ({ onClick, active, disabled, title, children }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`p-1.5 rounded transition-colors text-sm ${
      active
        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
        : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
    } ${disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}`}
  >
    {children}
  </button>
);

const Sep = () => (
  <div className="w-px h-5 bg-gray-200 dark:bg-gray-600 mx-0.5 self-center" />
);

// ─── Tiptap Editor component ──────────────────────────────────────────────────
const RichEditor = ({ value, onChange }) => {
  const imgInputRef = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TiptapImage.configure({
        HTMLAttributes: { class: "max-w-full rounded-lg my-4" },
      }),
      TiptapLink.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-blue-600 underline" },
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight.configure({ multicolor: true }),
      Placeholder.configure({
        placeholder: "Write your blog post content here…",
      }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class:
          "prose prose-sm dark:prose-invert max-w-none min-h-[360px] p-4 focus:outline-none text-gray-800 dark:text-gray-200",
      },
    },
  });

  // Sync value when editing an existing post
  useEffect(() => {
    if (!editor) return;
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value || "");
    }
  }, [value]); // eslint-disable-line

  const setLink = useCallback(() => {
    const prev = editor?.getAttributes("link").href;
    const url = window.prompt("Enter URL", prev || "https://");
    if (url === null) return;
    if (url === "") {
      editor?.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor
        ?.chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: url })
        .run();
    }
  }, [editor]);

  const handleImgUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    try {
      const res = await fileAPI.uploadImage(file);
      if (res.success) {
        const url = res.data?.secure_url || res.data?.url;
        editor.chain().focus().setImage({ src: url, alt: file.name }).run();
        toast.success("Image inserted");
      }
    } catch {
      toast.error("Image upload failed");
    } finally {
      e.target.value = "";
    }
  };

  const handleImgUrl = () => {
    const url = window.prompt("Paste image URL");
    if (url && editor) editor.chain().focus().setImage({ src: url }).run();
  };

  if (!editor) return null;

  const wordCount = editor.getText().trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
        <ToolbarBtn
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo"
        >
          <Undo size={14} />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo"
        >
          <Redo size={14} />
        </ToolbarBtn>
        <Sep />

        <ToolbarBtn
          onClick={() => editor.chain().focus().setParagraph().run()}
          active={editor.isActive("paragraph")}
          title="Paragraph"
        >
          <Type size={14} />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          active={editor.isActive("heading", { level: 1 })}
          title="Heading 1"
        >
          <Heading1 size={14} />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          active={editor.isActive("heading", { level: 2 })}
          title="Heading 2"
        >
          <Heading2 size={14} />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          active={editor.isActive("heading", { level: 3 })}
          title="Heading 3"
        >
          <Heading3 size={14} />
        </ToolbarBtn>
        <Sep />

        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          title="Bold"
        >
          <Bold size={14} />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          title="Italic"
        >
          <Italic size={14} />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive("underline")}
          title="Underline"
        >
          <UnderlineIcon size={14} />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive("strike")}
          title="Strikethrough"
        >
          <Strikethrough size={14} />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() =>
            editor.chain().focus().toggleHighlight({ color: "#fef08a" }).run()
          }
          active={editor.isActive("highlight")}
          title="Highlight"
        >
          <Highlighter size={14} />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() =>
            editor.chain().focus().unsetAllMarks().clearNodes().run()
          }
          title="Clear Formatting"
        >
          <RemoveFormatting size={14} />
        </ToolbarBtn>
        <Sep />

        <ToolbarBtn
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          active={editor.isActive({ textAlign: "left" })}
          title="Align Left"
        >
          <AlignLeft size={14} />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          active={editor.isActive({ textAlign: "center" })}
          title="Center"
        >
          <AlignCenter size={14} />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          active={editor.isActive({ textAlign: "right" })}
          title="Align Right"
        >
          <AlignRight size={14} />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          active={editor.isActive({ textAlign: "justify" })}
          title="Justify"
        >
          <AlignJustify size={14} />
        </ToolbarBtn>
        <Sep />

        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          title="Bullet List"
        >
          <List size={14} />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          title="Numbered List"
        >
          <ListOrdered size={14} />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
          title="Blockquote"
        >
          <Quote size={14} />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleCode().run()}
          active={editor.isActive("code")}
          title="Inline Code"
        >
          <Code size={14} />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          active={editor.isActive("codeBlock")}
          title="Code Block"
        >
          <span className="font-mono text-xs font-bold">{"</>"}</span>
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Divider"
        >
          <Minus size={14} />
        </ToolbarBtn>
        <Sep />

        <ToolbarBtn
          onClick={setLink}
          active={editor.isActive("link")}
          title="Insert Link"
        >
          <LinkIcon size={14} />
        </ToolbarBtn>
        <input
          ref={imgInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImgUpload}
        />
        <ToolbarBtn
          onClick={() => imgInputRef.current?.click()}
          title="Upload Image"
        >
          <ImageIcon size={14} />
        </ToolbarBtn>
        <ToolbarBtn onClick={handleImgUrl} title="Image by URL">
          <span className="text-xs font-bold">URL</span>
        </ToolbarBtn>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />

      {/* Footer */}
      <div className="px-4 py-1.5 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 flex justify-between">
        <span className="text-xs text-gray-400">{wordCount} words</span>
        <span className="text-xs text-gray-300 dark:text-gray-600">
          Tip: paste or drag images directly into the editor
        </span>
      </div>
    </div>
  );
};

// ─── Status helpers ───────────────────────────────────────────────────────────
const statusBadge = (status) => {
  if (status === "PUBLISHED") return "badge-success";
  if (status === "DRAFT") return "badge-warning";
  return "badge-neutral";
};

const emptyForm = {
  title: "",
  excerpt: "",
  content: "",
  featuredImage: "",
  imageAlt: "",
  category: "",
  tags: [],
  status: "DRAFT",
  featured: false,
  seoTitle: "",
  seoDescription: "",
  seoKeywords: "",
  canonicalUrl: "",
  socialTitle: "",
  socialDescription: "",
  socialImage: "",
  relatedProducts: [],
};

// ─── Main page ────────────────────────────────────────────────────────────────
const BlogPosts = () => {
  // List state
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  // View: 'list' | 'editor'
  const [view, setView] = useState("list");
  const [editingPost, setEditingPost] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("content"); // 'content' | 'seo'

  // ── Data fetching ─────────────────────────────────────────────────────────

  useEffect(() => {
    fetchCategories();
    fetchTags();
  }, []);

  // Replace your fetchPosts function definition with this:
  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await blogAPI.getPosts({
        page: currentPage,
        limit: 10,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter }),
        ...(categoryFilter && { category: categoryFilter }),
        sortBy: "createdAt",
        sortOrder: "desc",
      });
      if (res.success) {
        setPosts(res.data);
        setTotalPages(res.pagination?.pages || 1);
      }
    } catch (err) {
      toast.error(handleApiError(err, "Failed to fetch posts"));
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, statusFilter, categoryFilter]);

  useEffect(() => {
    if (view === "list") fetchPosts();
  }, [view, fetchPosts]);

  const fetchCategories = async () => {
    try {
      const res = await blogAPI.getCategories({ status: "ACTIVE" });
      if (res.success) setCategories(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTags = async () => {
    try {
      const res = await blogAPI.getTags({ status: "ACTIVE" });
      if (res.success) setTags(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // ── Editor actions ────────────────────────────────────────────────────────
  const openCreate = () => {
    setFormData(emptyForm);
    setEditingPost(null);
    setActiveTab("content");
    setView("editor");
  };

  const openEdit = (post) => {
    setFormData({
      title: post.title || "",
      excerpt: post.excerpt || "",
      content: post.content || "",
      featuredImage: post.featuredImage || "",
      imageAlt: post.imageAlt || "",
      category: post.category?._id || "",
      tags: post.tags?.map((t) => t._id) || [],
      status: post.status || "DRAFT",
      featured: post.featured || false,
      seoTitle: post.seoTitle || "",
      seoDescription: post.seoDescription || "",
      seoKeywords: post.seoKeywords || "",
      canonicalUrl: post.canonicalUrl || "",
      socialTitle: post.socialTitle || "",
      socialDescription: post.socialDescription || "",
      socialImage: post.socialImage || "",
      relatedProducts: post.relatedProducts?.map((p) => p._id) || [],
    });
    setEditingPost(post);
    setActiveTab("content");
    setView("editor");
  };

  const field = (key, val) => setFormData((p) => ({ ...p, [key]: val }));

  const toggleTag = (id) =>
    setFormData((p) => ({
      ...p,
      tags: p.tags.includes(id)
        ? p.tags.filter((t) => t !== id)
        : [...p.tags, id],
    }));

  const handleSave = async (publishNow = false) => {
    if (
      !formData.title.trim() ||
      !formData.excerpt.trim() ||
      !formData.content ||
      !formData.featuredImage ||
      !formData.category
    ) {
      toast.error(
        "Please fill in: title, excerpt, content, featured image, and category.",
      );
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...formData,
        ...(publishNow && { status: "PUBLISHED" }),
      };
      let res;
      if (editingPost) {
        res = await blogAPI.updatePost(editingPost._id, payload);
      } else {
        res = await blogAPI.createPost(payload);
      }
      if (res.success) {
        toast.success(editingPost ? "Post updated!" : "Post created!");
        setView("list");
        fetchPosts();
      }
    } catch (err) {
      toast.error(handleApiError(err, "Failed to save post"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (postId) => {
    if (!confirm("Delete this post? This cannot be undone.")) return;
    try {
      const res = await blogAPI.deletePost(postId);
      if (res.success) {
        toast.success("Post deleted");
        fetchPosts();
      }
    } catch (err) {
      toast.error(handleApiError(err, "Failed to delete"));
    }
  };

  const handleToggleFeatured = async (postId) => {
    try {
      const res = await blogAPI.toggleFeatured(postId);
      if (res.success) {
        toast.success(res.message);
        fetchPosts();
      }
    } catch (err) {
      toast.error(handleApiError(err, "Failed to update"));
    }
  };

  const exportCSV = () => {
    const rows = [
      [
        "Title",
        "Category",
        "Status",
        "Featured",
        "Views",
        "Author",
        "Published",
      ],
      ...posts.map((p) => [
        p.title,
        p.category?.name || "",
        p.status,
        p.featured ? "Yes" : "No",
        p.views || 0,
        p.author?.name || "",
        p.publishedAt ? new Date(p.publishedAt).toLocaleDateString() : "",
      ]),
    ];
    const blob = new Blob([rows.map((r) => r.join(",")).join("\n")], {
      type: "text/csv",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "blog-posts.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleFeaturedImageChange = (images) => {
    if (images?.length > 0) {
      field("featuredImage", images[0]);
      field("socialImage", images[0]);
    }
  };

  // ── LIST VIEW ─────────────────────────────────────────────────────────────
  if (view === "list") {
    return (
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Blog Posts
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Create and manage your blog content
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={exportCSV}
              className="btn-outline flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> Export
            </button>
            <button
              onClick={openCreate}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> New Post
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search posts..."
                className="form-input pl-10"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <select
              className="form-select min-w-40"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Status</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
              <option value="ARCHIVED">Archived</option>
            </select>
            <select
              className="form-select min-w-40"
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="table-container">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-6 py-3 text-left">Post</th>
                <th className="px-6 py-3 text-left">Category</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Featured</th>
                <th className="px-6 py-3 text-left">Views</th>
                <th className="px-6 py-3 text-left">Author</th>
                <th className="px-6 py-3 text-left">Date</th>
                <th className="px-6 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center">
                    <div className="spinner w-8 h-8 mx-auto" />
                  </td>
                </tr>
              ) : posts.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                  >
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    No posts found.{" "}
                    <button
                      onClick={openCreate}
                      className="text-blue-600 underline ml-1"
                    >
                      Create your first post.
                    </button>
                  </td>
                </tr>
              ) : (
                posts.map((post) => (
                  <tr key={post._id} className="table-row">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-700">
                          {post.featuredImage ? (
                            <img
                              src={post.featuredImage}
                              alt={post.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <FileText className="w-5 h-5 text-gray-400 m-auto mt-3.5" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white line-clamp-1">
                            {post.title}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 max-w-xs">
                            {post.excerpt}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      {post.category ? (
                        <span className="badge-info">{post.category.name}</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${statusBadge(post.status)}`}>
                        {post.status}
                      </span>
                    </td>
                    <td className="table-cell">
                      {post.featured ? (
                        <Star className="w-5 h-5 text-yellow-500 fill-current" />
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="table-cell">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {post.views || 0}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 gap-1.5">
                        <User className="w-4 h-4" />
                        {post.author?.name || "Unknown"}
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 gap-1.5">
                        <Calendar className="w-4 h-4" />
                        {new Date(
                          post.publishedAt || post.createdAt,
                        ).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleToggleFeatured(post._id)}
                          className={`p-1.5 rounded transition-colors ${post.featured ? "text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20" : "text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
                          title={
                            post.featured ? "Remove featured" : "Mark featured"
                          }
                        >
                          <Star
                            className={`w-4 h-4 ${post.featured ? "fill-current" : ""}`}
                          />
                        </button>
                        {post.status === "PUBLISHED" && (
                          <a
                            href={
                              import.meta.env.VITE_CLIENT_URL +
                              `/blog/${post.slug}`
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                            title="View live"
                          >
                            <Eye className="w-4 h-4" />
                          </a>
                        )}
                        <button
                          onClick={() => openEdit(post)}
                          className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(post._id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6 gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  currentPage === page
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── EDITOR VIEW ──────────────────────────────────────────────────────────
  return (
    <div className="p-6">
      {/* Editor header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setView("list")}
            className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Back to posts"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {editingPost ? "Edit Post" : "New Blog Post"}
            </h1>
            {editingPost && (
              <p className="text-sm text-gray-400 mt-0.5 line-clamp-1">
                {editingPost.title}
              </p>
            )}
          </div>
        </div>

        {/* Save buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={saving}
            className="btn-outline flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {formData.status === "DRAFT" ? "Save Draft" : "Save"}
          </button>
          {formData.status !== "PUBLISHED" ? (
            <button
              type="button"
              onClick={() => handleSave(true)}
              disabled={saving}
              className="btn-primary flex items-center gap-2"
            >
              {saving ? (
                <div className="spinner w-4 h-4" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              Publish Now
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleSave(false)}
              disabled={saving}
              className="btn-primary flex items-center gap-2"
            >
              {saving ? (
                <div className="spinner w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Update Post
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* ── Left: Content ─────────────────────────────────────────── */}
        <div className="xl:col-span-2 space-y-5">
          {/* Title */}
          <div className="card p-5">
            <input
              type="text"
              placeholder="Post title…"
              value={formData.title}
              onChange={(e) => field("title", e.target.value)}
              className="w-full text-2xl font-bold text-gray-900 dark:text-white bg-transparent placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none border-0"
            />
            <p className="text-xs text-gray-400 mt-2">
              {formData.title.length}/200
            </p>
          </div>

          {/* Tabs */}
          <div className="card overflow-hidden">
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              {["content", "seo"].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-3 text-sm font-medium capitalize transition-colors ${
                    activeTab === tab
                      ? "border-b-2 border-blue-600 text-blue-700 dark:text-blue-400"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  }`}
                >
                  {tab === "content" ? "Content & Excerpt" : "SEO Settings"}
                </button>
              ))}
            </div>

            {activeTab === "content" ? (
              <div className="p-5 space-y-5">
                {/* Excerpt */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Excerpt <span className="text-red-500">*</span>
                    <span className="text-xs text-gray-400 ml-1">
                      (shown in listings)
                    </span>
                  </label>
                  <textarea
                    rows={3}
                    value={formData.excerpt}
                    onChange={(e) => field("excerpt", e.target.value)}
                    maxLength={300}
                    placeholder="A concise summary of the post…"
                    className="form-textarea"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {formData.excerpt.length}/300
                  </p>
                </div>

                {/* Rich text editor */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Content <span className="text-red-500">*</span>
                  </label>
                  <RichEditor
                    value={formData.content}
                    onChange={(html) => field("content", html)}
                  />
                </div>
              </div>
            ) : (
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      SEO Title{" "}
                      <span className="text-xs text-gray-400">(60 max)</span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.seoTitle}
                      onChange={(e) => field("seoTitle", e.target.value)}
                      placeholder="Leave blank to use post title"
                      maxLength={60}
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      {formData.seoTitle.length}/60
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      SEO Keywords
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.seoKeywords}
                      onChange={(e) => field("seoKeywords", e.target.value)}
                      placeholder="coffee, origins, arabica"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Meta Description{" "}
                    <span className="text-xs text-gray-400">(160 max)</span>
                  </label>
                  <textarea
                    rows={3}
                    className="form-textarea"
                    value={formData.seoDescription}
                    onChange={(e) => field("seoDescription", e.target.value)}
                    placeholder="Leave blank to use excerpt"
                    maxLength={160}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {formData.seoDescription.length}/160
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Canonical URL
                    </label>
                    <input
                      type="url"
                      className="form-input"
                      value={formData.canonicalUrl}
                      onChange={(e) => field("canonicalUrl", e.target.value)}
                      placeholder="https://icvng.com/blog/slug"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Social Title
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.socialTitle}
                      onChange={(e) => field("socialTitle", e.target.value)}
                      placeholder="Title for social media"
                      maxLength={100}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Social Description
                  </label>
                  <textarea
                    rows={2}
                    className="form-textarea"
                    value={formData.socialDescription}
                    onChange={(e) => field("socialDescription", e.target.value)}
                    placeholder="Description for social media shares"
                    maxLength={200}
                  />
                </div>

                {/* Google preview */}
                {(formData.seoTitle || formData.title) && (
                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-dashed border-gray-200 dark:border-gray-700">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                      Google Search Preview
                    </p>
                    <p className="text-blue-700 dark:text-blue-400 text-base line-clamp-1">
                      {formData.seoTitle || formData.title}
                    </p>
                    <p className="text-green-700 dark:text-green-500 text-xs mt-0.5">
                      icvng.com › blog ›{" "}
                      {(formData.title || "")
                        .toLowerCase()
                        .replace(/\s+/g, "-")
                        .slice(0, 40)}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1 line-clamp-2">
                      {formData.seoDescription || formData.excerpt}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Sidebar ─────────────────────────────────────────── */}
        <div className="space-y-5">
          {/* Publish settings */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" /> Publish Settings
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                  Status
                </label>
                <select
                  className="form-select"
                  value={formData.status}
                  onChange={(e) => field("status", e.target.value)}
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Featured Post
                  </p>
                  <p className="text-xs text-gray-400">Show on homepage</p>
                </div>
                <button
                  type="button"
                  onClick={() => field("featured", !formData.featured)}
                  className={`transition-colors ${formData.featured ? "text-yellow-500" : "text-gray-300 dark:text-gray-600 hover:text-yellow-400"}`}
                >
                  <Star
                    className="w-6 h-6"
                    fill={formData.featured ? "currentColor" : "none"}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Featured image */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-blue-600" />
              Featured Image <span className="text-red-500">*</span>
            </h3>
            <ImageUploader
              images={formData.featuredImage ? [formData.featuredImage] : []}
              onImagesChange={handleFeaturedImageChange}
              multiple={false}
            />
            {formData.featuredImage && (
              <input
                type="text"
                value={formData.imageAlt}
                onChange={(e) => field("imageAlt", e.target.value)}
                placeholder="Alt text for accessibility…"
                className="form-input mt-2 text-sm"
              />
            )}
          </div>

          {/* Category */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <Folder className="w-4 h-4 text-blue-600" />
              Category <span className="text-red-500">*</span>
            </h3>
            <select
              className="form-select"
              value={formData.category}
              onChange={(e) => field("category", e.target.value)}
            >
              <option value="">Select category…</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <TagIcon className="w-4 h-4 text-blue-600" /> Tags
            </h3>
            {tags.length === 0 ? (
              <p className="text-xs text-gray-400">No tags available.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => {
                  const selected = formData.tags.includes(tag._id);
                  return (
                    <button
                      key={tag._id}
                      type="button"
                      onClick={() => toggleTag(tag._id)}
                      className={`px-2.5 py-1 text-xs rounded-full border transition-all ${
                        selected
                          ? "text-white border-transparent shadow-sm scale-105"
                          : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-gray-400"
                      }`}
                      style={
                        selected
                          ? { backgroundColor: tag.color || "#6b7280" }
                          : {}
                      }
                    >
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogPosts;
