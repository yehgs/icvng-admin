import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit,
  Eye,
  Trash2,
  Building2,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  FileText,
  Users,
  X,
  Save,
  Download,
  Filter,
  Building,
  User,
  DollarSign,
  Calendar,
} from 'lucide-react';
import { supplierAPI, handleApiError } from '../../utils/api';
import toast from 'react-hot-toast';

const SupplierManagement = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [viewingSupplier, setViewingSupplier] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      zipCode: '',
    },
    contactPerson: {
      name: '',
      phone: '',
      email: '',
    },
    bankDetails: {
      bankName: '',
      accountNumber: '',
      routingNumber: '',
      swiftCode: '',
    },
    taxInfo: {
      taxId: '',
      vatNumber: '',
    },
    paymentTerms: 'NET_30',
    status: 'ACTIVE',
    notes: '',
  });

  const paymentTermsOptions = [
    { value: 'NET_30', label: 'Net 30 Days' },
    { value: 'NET_60', label: 'Net 60 Days' },
    { value: 'COD', label: 'Cash on Delivery' },
    { value: 'ADVANCE', label: 'Advance Payment' },
    { value: 'CUSTOM', label: 'Custom Terms' },
  ];

  const statusOptions = [
    { value: 'ACTIVE', label: 'Active', color: 'badge-success' },
    { value: 'INACTIVE', label: 'Inactive', color: 'badge-warning' },
    { value: 'BLACKLISTED', label: 'Blacklisted', color: 'badge-danger' },
  ];

  useEffect(() => {
    fetchSuppliers();
  }, [currentPage, searchTerm]);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: 10,
        ...(searchTerm && { search: searchTerm }),
      };

      const response = await supplierAPI.getSuppliers(params);

      if (response.success) {
        setSuppliers(response.data);
        setTotalPages(response.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      toast.error(handleApiError(error, 'Failed to fetch suppliers'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let response;

      if (editingSupplier) {
        response = await supplierAPI.updateSupplier(
          editingSupplier._id,
          formData
        );
      } else {
        response = await supplierAPI.createSupplier(formData);
      }

      if (response.success) {
        setShowModal(false);
        resetForm();
        fetchSuppliers();
        toast.success(
          editingSupplier
            ? 'Supplier updated successfully!'
            : 'Supplier added successfully!'
        );
      }
    } catch (error) {
      console.error('Error saving supplier:', error);
      toast.error(handleApiError(error, 'Failed to save supplier'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (supplierId) => {
    if (!confirm('Are you sure you want to delete this supplier?')) return;

    try {
      const response = await supplierAPI.deleteSupplier(supplierId);

      if (response.success) {
        fetchSuppliers();
        toast.success('Supplier deleted successfully!');
      }
    } catch (error) {
      console.error('Error deleting supplier:', error);
      toast.error(handleApiError(error, 'Failed to delete supplier'));
    }
  };

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: {
        street: supplier.address?.street || '',
        city: supplier.address?.city || '',
        state: supplier.address?.state || '',
        country: supplier.address?.country || '',
        zipCode: supplier.address?.zipCode || '',
      },
      contactPerson: {
        name: supplier.contactPerson?.name || '',
        phone: supplier.contactPerson?.phone || '',
        email: supplier.contactPerson?.email || '',
      },
      bankDetails: {
        bankName: supplier.bankDetails?.bankName || '',
        accountNumber: supplier.bankDetails?.accountNumber || '',
        routingNumber: supplier.bankDetails?.routingNumber || '',
        swiftCode: supplier.bankDetails?.swiftCode || '',
      },
      taxInfo: {
        taxId: supplier.taxInfo?.taxId || '',
        vatNumber: supplier.taxInfo?.vatNumber || '',
      },
      paymentTerms: supplier.paymentTerms || 'NET_30',
      status: supplier.status || 'ACTIVE',
      notes: supplier.notes || '',
    });
    setShowModal(true);
  };

  const handleView = async (supplierId) => {
    try {
      const response = await supplierAPI.getSupplier(supplierId);

      if (response.success) {
        setViewingSupplier(response.data);
      }
    } catch (error) {
      console.error('Error fetching supplier details:', error);
      toast.error(handleApiError(error, 'Failed to fetch supplier details'));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: {
        street: '',
        city: '',
        state: '',
        country: '',
        zipCode: '',
      },
      contactPerson: {
        name: '',
        phone: '',
        email: '',
      },
      bankDetails: {
        bankName: '',
        accountNumber: '',
        routingNumber: '',
        swiftCode: '',
      },
      taxInfo: {
        taxId: '',
        vatNumber: '',
      },
      paymentTerms: 'NET_30',
      status: 'ACTIVE',
      notes: '',
    });
    setEditingSupplier(null);
  };

  const updateFormData = (section, field, value) => {
    if (section) {
      setFormData((prev) => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = statusOptions.find((opt) => opt.value === status);
    return statusConfig ? statusConfig.color : 'badge-neutral';
  };

  const exportToExcel = () => {
    const csvContent = [
      [
        'Name',
        'Email',
        'Phone',
        'City',
        'Country',
        'Contact Person',
        'Payment Terms',
        'Status',
        'Created Date',
      ],
      ...suppliers.map((supplier) => [
        supplier.name,
        supplier.email,
        supplier.phone,
        supplier.address?.city || '',
        supplier.address?.country || '',
        supplier.contactPerson?.name || '',
        supplier.paymentTerms,
        supplier.status,
        new Date(supplier.createdAt).toLocaleDateString(),
      ]),
    ];

    const csvString = csvContent.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'suppliers.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Supplier Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your suppliers and vendor relationships
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportToExcel}
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
            Add Supplier
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search suppliers..."
                className="form-input pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Supplier Details Modal */}
      {viewingSupplier && (
        <div className="modal-overlay flex items-center justify-center p-4">
          <div className="modal-container max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mr-4">
                  <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {viewingSupplier.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {viewingSupplier.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingSupplier(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status and Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Status
                      </p>
                      <span
                        className={`badge ${getStatusBadge(
                          viewingSupplier.status
                        )} mt-1`}
                      >
                        {viewingSupplier.status}
                      </span>
                    </div>
                    <Building className="w-8 h-8 text-blue-600" />
                  </div>
                </div>

                <div className="card p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Payment Terms
                      </p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {paymentTermsOptions.find(
                          (opt) => opt.value === viewingSupplier.paymentTerms
                        )?.label || viewingSupplier.paymentTerms}
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-green-600" />
                  </div>
                </div>

                <div className="card p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Member Since
                      </p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {new Date(
                          viewingSupplier.createdAt
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <Calendar className="w-8 h-8 text-purple-600" />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card p-6">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                    <Phone className="w-5 h-5 mr-2 text-blue-600" />
                    Contact Information
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 mr-3 text-gray-400" />
                      <span className="text-gray-900 dark:text-white">
                        {viewingSupplier.email}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 mr-3 text-gray-400" />
                      <span className="text-gray-900 dark:text-white">
                        {viewingSupplier.phone}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="card p-6">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                    <User className="w-5 h-5 mr-2 text-green-600" />
                    Contact Person
                  </h4>
                  {viewingSupplier.contactPerson?.name ? (
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-3 text-gray-400" />
                        <span className="text-gray-900 dark:text-white">
                          {viewingSupplier.contactPerson.name}
                        </span>
                      </div>
                      {viewingSupplier.contactPerson.phone && (
                        <div className="flex items-center">
                          <Phone className="w-4 h-4 mr-3 text-gray-400" />
                          <span className="text-gray-900 dark:text-white">
                            {viewingSupplier.contactPerson.phone}
                          </span>
                        </div>
                      )}
                      {viewingSupplier.contactPerson.email && (
                        <div className="flex items-center">
                          <Mail className="w-4 h-4 mr-3 text-gray-400" />
                          <span className="text-gray-900 dark:text-white">
                            {viewingSupplier.contactPerson.email}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">
                      No contact person specified
                    </p>
                  )}
                </div>
              </div>

              {/* Address */}
              <div className="card p-6">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-red-600" />
                  Address
                </h4>
                {viewingSupplier.address ? (
                  <div className="text-gray-900 dark:text-white">
                    {viewingSupplier.address.street && (
                      <div>{viewingSupplier.address.street}</div>
                    )}
                    <div>
                      {[
                        viewingSupplier.address.city,
                        viewingSupplier.address.state,
                        viewingSupplier.address.zipCode,
                      ]
                        .filter(Boolean)
                        .join(', ')}
                    </div>
                    {viewingSupplier.address.country && (
                      <div>{viewingSupplier.address.country}</div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">
                    No address specified
                  </p>
                )}
              </div>

              {/* Financial Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card p-6">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-purple-600" />
                    Tax Information
                  </h4>
                  <div className="space-y-3">
                    {viewingSupplier.taxInfo?.taxId && (
                      <div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Tax ID:
                        </span>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {viewingSupplier.taxInfo.taxId}
                        </div>
                      </div>
                    )}
                    {viewingSupplier.taxInfo?.vatNumber && (
                      <div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          VAT Number:
                        </span>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {viewingSupplier.taxInfo.vatNumber}
                        </div>
                      </div>
                    )}
                    {!viewingSupplier.taxInfo?.taxId &&
                      !viewingSupplier.taxInfo?.vatNumber && (
                        <p className="text-gray-500 dark:text-gray-400">
                          No tax information provided
                        </p>
                      )}
                  </div>
                </div>

                <div className="card p-6">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                    <CreditCard className="w-5 h-5 mr-2 text-green-600" />
                    Banking Details
                  </h4>
                  <div className="space-y-3">
                    {viewingSupplier.bankDetails?.bankName && (
                      <div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Bank:
                        </span>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {viewingSupplier.bankDetails.bankName}
                        </div>
                      </div>
                    )}
                    {viewingSupplier.bankDetails?.accountNumber && (
                      <div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Account:
                        </span>
                        <div className="font-medium text-gray-900 dark:text-white">
                          ****
                          {viewingSupplier.bankDetails.accountNumber.slice(-4)}
                        </div>
                      </div>
                    )}
                    {viewingSupplier.bankDetails?.swiftCode && (
                      <div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          SWIFT:
                        </span>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {viewingSupplier.bankDetails.swiftCode}
                        </div>
                      </div>
                    )}
                    {!viewingSupplier.bankDetails?.bankName && (
                      <p className="text-gray-500 dark:text-gray-400">
                        No banking details provided
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes */}
              {viewingSupplier.notes && (
                <div className="card p-6">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-gray-600" />
                    Notes
                  </h4>
                  <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                    {viewingSupplier.notes}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    setViewingSupplier(null);
                    handleEdit(viewingSupplier);
                  }}
                  className="btn-primary flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit Supplier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Suppliers Table */}
      <div className="table-container">
        <table className="w-full">
          <thead>
            <tr className="table-header">
              <th className="px-6 py-3 text-left">Supplier</th>
              <th className="px-6 py-3 text-left">Contact Info</th>
              <th className="px-6 py-3 text-left">Location</th>
              <th className="px-6 py-3 text-left">Contact Person</th>
              <th className="px-6 py-3 text-left">Payment Terms</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center">
                  <div className="spinner w-8 h-8 mx-auto"></div>
                </td>
              </tr>
            ) : suppliers.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                  No suppliers found
                </td>
              </tr>
            ) : (
              suppliers.map((supplier) => (
                <tr key={supplier._id} className="table-row">
                  <td className="table-cell">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mr-3">
                        <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {supplier.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {supplier._id.slice(-8)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="space-y-1">
                      <div className="flex items-center text-sm">
                        <Mail className="w-4 h-4 mr-2 text-gray-400" />
                        <span>{supplier.email}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Phone className="w-4 h-4 mr-2 text-gray-400" />
                        <span>{supplier.phone}</span>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center text-sm">
                      <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                      <div>
                        <div>{supplier.address?.city}</div>
                        <div className="text-gray-500">
                          {supplier.address?.country}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    {supplier.contactPerson?.name ? (
                      <div>
                        <div className="font-medium">
                          {supplier.contactPerson.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {supplier.contactPerson.phone}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400">Not specified</span>
                    )}
                  </td>
                  <td className="table-cell">
                    <span className="badge-info">
                      {paymentTermsOptions.find(
                        (opt) => opt.value === supplier.paymentTerms
                      )?.label || supplier.paymentTerms}
                    </span>
                  </td>
                  <td className="table-cell">
                    <span
                      className={`badge ${getStatusBadge(supplier.status)}`}
                    >
                      {supplier.status}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="flex gap-2">
                      {/* ✅ CRITICAL: These buttons pass supplier._id correctly */}
                      <button
                        onClick={() => handleView(supplier._id)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(supplier)}
                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(supplier._id)}
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

      {/* Supplier Form Modal */}
      {showModal && (
        <div className="modal-overlay flex items-center justify-center p-4">
          <div className="modal-container max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
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
              <div>
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                  Basic Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={formData.name}
                      onChange={(e) =>
                        updateFormData(null, 'name', e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Status
                    </label>
                    <select
                      className="form-select"
                      value={formData.status}
                      onChange={(e) =>
                        updateFormData(null, 'status', e.target.value)
                      }
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      className="form-input"
                      value={formData.email}
                      onChange={(e) =>
                        updateFormData(null, 'email', e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      required
                      className="form-input"
                      value={formData.phone}
                      onChange={(e) =>
                        updateFormData(null, 'phone', e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                  Address Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Street Address
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.address.street}
                      onChange={(e) =>
                        updateFormData('address', 'street', e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.address.city}
                      onChange={(e) =>
                        updateFormData('address', 'city', e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      State/Province
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.address.state}
                      onChange={(e) =>
                        updateFormData('address', 'state', e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Country
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.address.country}
                      onChange={(e) =>
                        updateFormData('address', 'country', e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      ZIP/Postal Code
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.address.zipCode}
                      onChange={(e) =>
                        updateFormData('address', 'zipCode', e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Contact Person */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                  Primary Contact Person
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Contact Name
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.contactPerson.name}
                      onChange={(e) =>
                        updateFormData('contactPerson', 'name', e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Contact Phone
                    </label>
                    <input
                      type="tel"
                      className="form-input"
                      value={formData.contactPerson.phone}
                      onChange={(e) =>
                        updateFormData('contactPerson', 'phone', e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      className="form-input"
                      value={formData.contactPerson.email}
                      onChange={(e) =>
                        updateFormData('contactPerson', 'email', e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Payment Terms & Tax Info */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                  Financial Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Payment Terms
                    </label>
                    <select
                      className="form-select"
                      value={formData.paymentTerms}
                      onChange={(e) =>
                        updateFormData(null, 'paymentTerms', e.target.value)
                      }
                    >
                      {paymentTermsOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tax ID
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.taxInfo.taxId}
                      onChange={(e) =>
                        updateFormData('taxInfo', 'taxId', e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      VAT Number
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.taxInfo.vatNumber}
                      onChange={(e) =>
                        updateFormData('taxInfo', 'vatNumber', e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                  Banking Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.bankDetails.bankName}
                      onChange={(e) =>
                        updateFormData(
                          'bankDetails',
                          'bankName',
                          e.target.value
                        )
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Account Number
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.bankDetails.accountNumber}
                      onChange={(e) =>
                        updateFormData(
                          'bankDetails',
                          'accountNumber',
                          e.target.value
                        )
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Routing Number
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.bankDetails.routingNumber}
                      onChange={(e) =>
                        updateFormData(
                          'bankDetails',
                          'routingNumber',
                          e.target.value
                        )
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      SWIFT Code
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.bankDetails.swiftCode}
                      onChange={(e) =>
                        updateFormData(
                          'bankDetails',
                          'swiftCode',
                          e.target.value
                        )
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes
                </label>
                <textarea
                  rows="3"
                  className="form-textarea"
                  value={formData.notes}
                  onChange={(e) =>
                    updateFormData(null, 'notes', e.target.value)
                  }
                  placeholder="Additional notes about this supplier..."
                ></textarea>
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
                  disabled={loading}
                >
                  {loading ? (
                    <div className="spinner w-4 h-4"></div>
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {editingSupplier ? 'Update Supplier' : 'Create Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierManagement;
