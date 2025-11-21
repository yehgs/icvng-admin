// admin/src/pages/BlogPosts.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  FileText,
  Image,
  Globe,
  X,
  Save,
  Download,
  Filter,
  Calendar,
  User,
  Tag as TagIcon,
  Star,
} from 'lucide-react';
import { blogAPI, handleApiError } from '../../utils/api';
import toast from 'react-hot-toast';
import ImageUploader from '../../components/common/ImageUploader';

const BlogPosts = () => {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Rich text editor ref
  const editorRef = useRef(null);
  const [editorLoaded, setEditorLoaded] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    featuredImage: '',
    imageAlt: '',
    category: '',
    tags: [],
    status: 'DRAFT',
    featured: false,
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
    canonicalUrl: '',
    socialTitle: '',
    socialDescription: '',
    socialImage: '',
    relatedProducts: [],
  });

  useEffect(() => {
    fetchPosts();
    fetchCategories();
    fetchTags();
  }, [currentPage, searchTerm, statusFilter, categoryFilter]);

  // Initialize Quill editor
  useEffect(() => {
    if (showModal) {
      const initEditor = async () => {
        try {
          const { default: Quill } = await import('quill');

          // Clean up existing editor
          if (editorRef.current) {
            editorRef.current = null;
          }

          // Wait for DOM to be ready
          setTimeout(() => {
            const editorElement = document.getElementById('editor');
            if (editorElement && !editorRef.current) {
              editorRef.current = new Quill(editorElement, {
                theme: 'snow',
                modules: {
                  toolbar: [
                    [{ header: [1, 2, 3, 4, 5, 6, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    ['blockquote', 'code-block'],
                    [{ list: 'ordered' }, { list: 'bullet' }],
                    [{ script: 'sub' }, { script: 'super' }],
                    [{ indent: '-1' }, { indent: '+1' }],
                    [{ direction: 'rtl' }],
                    [{ color: [] }, { background: [] }],
                    [{ align: [] }],
                    ['link', 'image', 'video'],
                    ['clean'],
                  ],
                },
                placeholder: 'Write your blog post content here...',
              });

              editorRef.current.on('text-change', () => {
                const content = editorRef.current.root.innerHTML;
                setFormData((prev) => ({ ...prev, content }));
              });

              setEditorLoaded(true);

              // Set content if editing
              if (editingPost && formData.content) {
                editorRef.current.root.innerHTML = formData.content;
              }
            }
          }, 100);
        } catch (error) {
          console.error('Error loading Quill:', error);
          toast.error('Failed to load text editor');
        }
      };

      initEditor();
    }

    return () => {
      if (!showModal && editorRef.current) {
        editorRef.current = null;
        setEditorLoaded(false);
      }
    };
  }, [showModal]);

  // Update editor content when editing post changes
  useEffect(() => {
    if (editorRef.current && editingPost && formData.content && editorLoaded) {
      editorRef.current.root.innerHTML = formData.content;
    }
  }, [editingPost, formData.content, editorLoaded]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: 10,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter }),
        ...(categoryFilter && { category: categoryFilter }),
      };

      const response = await blogAPI.getPosts(params);

      if (response.success) {
        setPosts(response.data);
        setTotalPages(response.pagination?.pages || 1);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error(handleApiError(error, 'Failed to fetch posts'));
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await blogAPI.getCategories({ status: 'ACTIVE' });
      if (response.success) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await blogAPI.getTags({ status: 'ACTIVE' });
      if (response.success) {
        setTags(response.data);
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get content from Quill editor
      const content = editorRef.current
        ? editorRef.current.root.innerHTML
        : formData.content;
      const submitData = { ...formData, content };

      let response;

      if (editingPost) {
        response = await blogAPI.updatePost(editingPost._id, submitData);
      } else {
        response = await blogAPI.createPost(submitData);
      }

      if (response.success) {
        setShowModal(false);
        resetForm();
        fetchPosts();
        toast.success(
          editingPost
            ? 'Post updated successfully!'
            : 'Post created successfully!'
        );
      }
    } catch (error) {
      console.error('Error saving post:', error);
      toast.error(handleApiError(error, 'Failed to save post'));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFeatured = async (postId) => {
    try {
      const response = await blogAPI.toggleFeatured(postId);
      if (response.success) {
        toast.success(response.message);
        fetchPosts();
      }
    } catch (error) {
      console.error('Error toggling featured:', error);
      toast.error(handleApiError(error, 'Failed to toggle featured status'));
    }
  };

  const handleDelete = async (postId) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const response = await blogAPI.deletePost(postId);

      if (response.success) {
        fetchPosts();
        toast.success('Post deleted successfully!');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error(handleApiError(error, 'Failed to delete post'));
    }
  };

  const handleEdit = (post) => {
    setEditingPost(post);
    setFormData({
      title: post.title || '',
      excerpt: post.excerpt || '',
      content: post.content || '',
      featuredImage: post.featuredImage || '',
      imageAlt: post.imageAlt || '',
      category: post.category?._id || '',
      tags: post.tags?.map((tag) => tag._id) || [],
      status: post.status || 'DRAFT',
      featured: post.featured || false,
      seoTitle: post.seoTitle || '',
      seoDescription: post.seoDescription || '',
      seoKeywords: post.seoKeywords || '',
      canonicalUrl: post.canonicalUrl || '',
      socialTitle: post.socialTitle || '',
      socialDescription: post.socialDescription || '',
      socialImage: post.socialImage || '',
      relatedProducts: post.relatedProducts?.map((p) => p._id) || [],
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      excerpt: '',
      content: '',
      featuredImage: '',
      imageAlt: '',
      category: '',
      tags: [],
      status: 'DRAFT',
      featured: false,
      seoTitle: '',
      seoDescription: '',
      seoKeywords: '',
      canonicalUrl: '',
      socialTitle: '',
      socialDescription: '',
      socialImage: '',
      relatedProducts: [],
    });
    setEditingPost(null);
    if (editorRef.current) {
      editorRef.current.root.innerHTML = '';
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'PUBLISHED':
        return 'badge-success';
      case 'DRAFT':
        return 'badge-warning';
      case 'ARCHIVED':
        return 'badge-neutral';
      default:
        return 'badge-neutral';
    }
  };

  const exportToCSV = () => {
    const csvContent = [
      [
        'Title',
        'Category',
        'Status',
        'Featured',
        'Views',
        'Author',
        'Published Date',
      ],
      ...posts.map((post) => [
        post.title,
        post.category?.name || '',
        post.status,
        post.featured ? 'Yes' : 'No',
        post.views || 0,
        post.author?.name || '',
        post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : '',
      ]),
    ];

    const csvString = csvContent.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'blog-posts.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleImageUpload = (images) => {
    if (images && images.length > 0) {
      setFormData((prev) => ({
        ...prev,
        featuredImage: images[0],
        socialImage: images[0], // Set as social image too
      }));
    }
  };

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
            onClick={exportToCSV}
            className="btn-outline flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Post
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search posts..."
                className="form-input pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="min-w-40">
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
          <div className="min-w-40">
            <select
              className="form-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Posts Table */}
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
                  <div className="spinner w-8 h-8 mx-auto"></div>
                </td>
              </tr>
            ) : posts.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                  No posts found
                </td>
              </tr>
            ) : (
              posts.map((post) => (
                <tr key={post._id} className="table-row">
                  <td className="table-cell">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-cover bg-center rounded-lg mr-3 flex-shrink-0">
                        {post.featuredImage ? (
                          <img
                            src={post.featuredImage}
                            alt={post.imageAlt || post.title}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {post.title}
                        </div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {post.excerpt}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    {post.category ? (
                      <span className="badge-info">{post.category.name}</span>
                    ) : (
                      <span className="text-gray-400">No category</span>
                    )}
                  </td>
                  <td className="table-cell">
                    <span
                      className={`badge ${getStatusBadgeClass(post.status)}`}
                    >
                      {post.status}
                    </span>
                  </td>
                  <td className="table-cell">
                    {post.featured ? (
                      <Star className="w-5 h-5 text-yellow-500 fill-current" />
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="table-cell">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {post.views || 0}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="text-sm">
                        {post.author?.name || 'Unknown'}
                      </span>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="w-4 h-4 mr-2" />
                      {post.publishedAt
                        ? new Date(post.publishedAt).toLocaleDateString()
                        : new Date(post.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleFeatured(post._id)}
                        className={`p-1 rounded transition-colors ${
                          post.featured
                            ? 'text-yellow-600 hover:bg-yellow-50'
                            : 'text-gray-400 hover:bg-gray-50'
                        }`}
                        title={
                          post.featured
                            ? 'Remove from featured'
                            : 'Mark as featured'
                        }
                      >
                        <Star
                          className={`w-4 h-4 ${
                            post.featured ? 'fill-current' : ''
                          }`}
                        />
                      </button>
                      <button
                        onClick={() => handleEdit(post)}
                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(post._id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
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
        <div className="flex justify-center mt-6">
          <div className="flex gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 rounded ${
                  currentPage === page
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quill CSS */}
      {showModal && (
        <link
          href="https://cdn.quilljs.com/1.3.6/quill.snow.css"
          rel="stylesheet"
        />
      )}

      {/* Post Form Modal */}
      {showModal && (
        <div className="modal-overlay flex items-center justify-center p-4 z-50">
          <div className="modal-container max-w-6xl max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingPost ? 'Edit Post' : 'Create New Post'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Post Title *
                    </label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      placeholder="Enter post title..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Excerpt *
                      <span className="text-xs text-gray-500 ml-1">
                        (300 chars max)
                      </span>
                    </label>
                    <textarea
                      rows="3"
                      required
                      className="form-textarea"
                      value={formData.excerpt}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          excerpt: e.target.value,
                        }))
                      }
                      placeholder="Brief description of the post..."
                      maxLength="300"
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      {formData.excerpt.length}/300 characters
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Content *
                    </label>
                    <div id="editor" style={{ height: '300px' }}></div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Status
                      </label>
                      <select
                        className="form-select"
                        value={formData.status}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            status: e.target.value,
                          }))
                        }
                      >
                        <option value="DRAFT">Draft</option>
                        <option value="PUBLISHED">Published</option>
                        <option value="ARCHIVED">Archived</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Featured
                      </label>
                      <div className="flex items-center pt-2">
                        <input
                          type="checkbox"
                          id="featured"
                          className="mr-2"
                          checked={formData.featured}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              featured: e.target.checked,
                            }))
                          }
                        />
                        <label
                          htmlFor="featured"
                          className="text-sm text-gray-700 dark:text-gray-300 flex items-center"
                        >
                          <Star className="w-4 h-4 mr-1 text-yellow-500" />
                          Featured Post
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category *
                    </label>
                    <select
                      required
                      className="form-select"
                      value={formData.category}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          category: e.target.value,
                        }))
                      }
                    >
                      <option value="">Select category</option>
                      {categories.map((category) => (
                        <option key={category._id} value={category._id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tags
                    </label>
                    <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-2">
                      {tags.map((tag) => (
                        <label key={tag._id} className="flex items-center">
                          <input
                            type="checkbox"
                            className="mr-2"
                            checked={formData.tags.includes(tag._id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData((prev) => ({
                                  ...prev,
                                  tags: [...prev.tags, tag._id],
                                }));
                              } else {
                                setFormData((prev) => ({
                                  ...prev,
                                  tags: prev.tags.filter(
                                    (id) => id !== tag._id
                                  ),
                                }));
                              }
                            }}
                          />
                          <span
                            className="text-sm"
                            style={{ color: tag.color }}
                          >
                            {tag.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Featured Image *
                    </label>
                    <ImageUploader
                      images={
                        formData.featuredImage ? [formData.featuredImage] : []
                      }
                      onImagesChange={handleImageUpload}
                      multiple={false}
                      className="mb-4"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Image Alt Text
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.imageAlt}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          imageAlt: e.target.value,
                        }))
                      }
                      placeholder="Describe the image for accessibility"
                    />
                  </div>
                </div>
              </div>

              {/* SEO Section */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                  <Globe className="w-5 h-5 mr-2" />
                  SEO & Social Settings
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      SEO Title
                      <span className="text-xs text-gray-500 ml-1">
                        (60 chars max)
                      </span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.seoTitle}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          seoTitle: e.target.value,
                        }))
                      }
                      placeholder="SEO optimized title"
                      maxLength="60"
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      {formData.seoTitle.length}/60 characters
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      SEO Keywords
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.seoKeywords}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          seoKeywords: e.target.value,
                        }))
                      }
                      placeholder="coffee, origins, arabica"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      SEO Description
                      <span className="text-xs text-gray-500 ml-1">
                        (160 chars max)
                      </span>
                    </label>
                    <textarea
                      rows="3"
                      className="form-textarea"
                      value={formData.seoDescription}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          seoDescription: e.target.value,
                        }))
                      }
                      placeholder="SEO meta description"
                      maxLength="160"
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      {formData.seoDescription.length}/160 characters
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Canonical URL
                    </label>
                    <input
                      type="url"
                      className="form-input"
                      value={formData.canonicalUrl}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          canonicalUrl: e.target.value,
                        }))
                      }
                      placeholder="https://i-coffee.ng/blog/post-slug"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Social Title
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.socialTitle}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          socialTitle: e.target.value,
                        }))
                      }
                      placeholder="Title for social media sharing"
                      maxLength="100"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Social Description
                    </label>
                    <textarea
                      rows="2"
                      className="form-textarea"
                      value={formData.socialDescription}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          socialDescription: e.target.value,
                        }))
                      }
                      placeholder="Description for social media sharing"
                      maxLength="200"
                    />
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="btn-outline"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex items-center gap-2"
                  disabled={
                    loading || !formData.title.trim() || !formData.featuredImage
                  }
                >
                  {loading ? (
                    <div className="spinner w-4 h-4"></div>
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {editingPost ? 'Update Post' : 'Create Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogPosts;
