// components/PurchaseOrder/ReceiptUploader.jsx
import React, { useState, useRef } from 'react';
import {
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  Trash2,
  Eye,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { fileAPI } from '../../utils/api';
import DeleteConfirmModal from '../common/DeleteConfirmModal';
import toast from 'react-hot-toast';

const ReceiptUploader = ({
  receipts = [],
  onReceiptsChange,
  className = '',
}) => {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState([]);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    fileIndex: null,
    fileName: '',
    loading: false,
  });
  const fileInputRef = useRef(null);

  // Convert receipts to array if it's an object (fix for the bug)
  const receiptsArray = React.useMemo(() => {
    if (Array.isArray(receipts)) {
      return receipts;
    } else if (receipts && typeof receipts === 'object') {
      // Convert object to array
      return Object.values(receipts);
    }
    return [];
  }, [receipts]);

  // Debug receipts prop
  console.log('ReceiptUploader - receipts prop:', receipts);
  console.log('ReceiptUploader - receipts type:', typeof receipts);
  console.log('ReceiptUploader - receipts is array:', Array.isArray(receipts));
  console.log('ReceiptUploader - receiptsArray:', receiptsArray);
  console.log('ReceiptUploader - receiptsArray length:', receiptsArray.length);

  const handleFileSelect = (files) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    uploadFiles(fileArray);
  };

  const uploadFiles = async (files) => {
    setUploading(true);
    const uploadedFiles = [];

    // Initialize progress tracking
    const progressArray = files.map((file, index) => ({
      id: index,
      name: file.name,
      status: 'uploading',
      progress: 0,
    }));
    setUploadProgress(progressArray);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Update progress for current file
        setUploadProgress((prev) =>
          prev.map((item, idx) =>
            idx === i ? { ...item, status: 'uploading', progress: 0 } : item
          )
        );

        // Validate file type (images and PDFs only)
        const isImage = file.type.startsWith('image/');
        const isPDF = file.type === 'application/pdf';

        if (!isImage && !isPDF) {
          toast.error(
            `${file.name} is not a valid file type. Only images and PDFs are allowed.`
          );

          // Update progress to error
          setUploadProgress((prev) =>
            prev.map((item, idx) =>
              idx === i ? { ...item, status: 'error', progress: 0 } : item
            )
          );
          continue;
        }

        // Validate file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} is too large. Maximum size is 5MB`);

          // Update progress to error
          setUploadProgress((prev) =>
            prev.map((item, idx) =>
              idx === i ? { ...item, status: 'error', progress: 0 } : item
            )
          );
          continue;
        }

        try {
          // Update progress to 50% while uploading
          setUploadProgress((prev) =>
            prev.map((item, idx) =>
              idx === i ? { ...item, progress: 50 } : item
            )
          );

          const response = await fileAPI.uploadFile(file);

          console.log('Upload response for file:', file.name, response);

          if (response.success) {
            const uploadedFile = {
              url: response.data.secure_url,
              name: file.name,
              type: isPDF ? 'pdf' : 'image',
              size: file.size,
              uploadedAt: new Date().toISOString(),
              public_id: response.data.public_id || response.data.publicId,
            };

            console.log('Created uploaded file object:', uploadedFile);
            uploadedFiles.push(uploadedFile);

            // Update progress to complete
            setUploadProgress((prev) =>
              prev.map((item, idx) =>
                idx === i
                  ? { ...item, status: 'complete', progress: 100 }
                  : item
              )
            );
          } else {
            throw new Error(response.message || 'Upload failed');
          }
        } catch (error) {
          console.error('Upload error:', error);

          // Update progress to error
          setUploadProgress((prev) =>
            prev.map((item, idx) =>
              idx === i ? { ...item, status: 'error', progress: 0 } : item
            )
          );

          // Handle specific error types
          if (error.message && error.message.includes('413')) {
            toast.error(
              `${file.name} is too large for the server. Try a smaller file.`
            );
          } else if (error.message && error.message.includes('400')) {
            toast.error(`Invalid file format for ${file.name}`);
          } else {
            toast.error(
              `Failed to upload ${file.name}: ${
                error.message || 'Unknown error'
              }`
            );
          }
        }
      }

      // Update receipts if any files were uploaded successfully
      if (uploadedFiles.length > 0) {
        console.log('Adding uploaded files to receipts:', uploadedFiles);
        const newReceipts = [...receiptsArray, ...uploadedFiles];
        console.log('New receipts array:', newReceipts);
        onReceiptsChange(newReceipts);
        toast.success(`${uploadedFiles.length} file(s) uploaded successfully!`);
      } else {
        console.log('No files were uploaded successfully');
      }
    } catch (error) {
      console.error('Upload process error:', error);
      toast.error('Upload failed');
    } finally {
      setUploading(false);
      // Clear progress after a short delay
      setTimeout(() => {
        setUploadProgress([]);
      }, 3000);
    }
  };

  const openDeleteModal = (index) => {
    setDeleteModal({
      isOpen: true,
      fileIndex: index,
      fileName: receiptsArray[index]?.name || 'Unknown file',
      loading: false,
    });
  };

  const closeDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      fileIndex: null,
      fileName: '',
      loading: false,
    });
  };

  const confirmDelete = async () => {
    const { fileIndex } = deleteModal;
    const fileToDelete = receiptsArray[fileIndex];

    if (!fileToDelete) return;

    setDeleteModal((prev) => ({ ...prev, loading: true }));

    try {
      // Delete from Cloudinary if public_id exists
      if (fileToDelete.public_id) {
        await fileAPI.deleteFile(fileToDelete.public_id);
      }

      // Remove from local state
      const newReceipts = receiptsArray.filter((_, i) => i !== fileIndex);
      onReceiptsChange(newReceipts);

      toast.success(`${fileToDelete.name} deleted successfully`);
      closeDeleteModal();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(`Failed to delete ${fileToDelete.name}: ${error.message}`);
      setDeleteModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type) => {
    return type === 'pdf' ? (
      <FileText className="h-8 w-8" />
    ) : (
      <ImageIcon className="h-8 w-8" />
    );
  };

  const getProgressIcon = (status) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        );
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
          ${
            dragActive
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }
          ${uploading ? 'opacity-50 pointer-events-none' : ''}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />

        <div className="space-y-2">
          <div className="mx-auto h-12 w-12 text-gray-400">
            {uploading ? (
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            ) : (
              <Upload className="h-12 w-12" />
            )}
          </div>
          <div>
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              {uploading ? 'Uploading...' : 'Upload Receipt Files'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Drag and drop or click to select files
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Supports: Images (JPG, PNG, GIF) and PDF files
            </p>
          </div>
        </div>
      </div>

      {/* Upload Progress */}
      {uploadProgress.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Upload Progress
          </h4>
          <div className="space-y-2">
            {uploadProgress.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
              >
                <div className="flex items-center space-x-3 flex-1">
                  <div className="text-gray-500 dark:text-gray-400">
                    {getProgressIcon(item.status)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {item.name}
                    </p>
                    <div className="flex items-center space-x-2 text-xs">
                      <span
                        className={`
                        ${
                          item.status === 'complete'
                            ? 'text-green-600'
                            : item.status === 'error'
                            ? 'text-red-600'
                            : 'text-blue-600'
                        }
                      `}
                      >
                        {item.status === 'complete'
                          ? 'Uploaded'
                          : item.status === 'error'
                          ? 'Failed'
                          : 'Uploading...'}
                      </span>
                      {item.status === 'uploading' && (
                        <>
                          <span>•</span>
                          <span className="text-gray-500">
                            {item.progress}%
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                {item.status === 'uploading' && (
                  <div className="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${item.progress}%` }}
                    ></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Successfully Uploaded Files */}
      {receiptsArray.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Uploaded Files ({receiptsArray.length})
          </h4>
          <div className="space-y-2">
            {receiptsArray.map((receipt, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="text-green-600 dark:text-green-400">
                    {getFileIcon(receipt.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {receipt.name}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      <span className="text-green-600">Uploaded</span>
                      <span>•</span>
                      <span>{receipt.type.toUpperCase()}</span>
                      <span>•</span>
                      <span>{formatFileSize(receipt.size)}</span>
                      <span>•</span>
                      <span>
                        {new Date(receipt.uploadedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(receipt.url, '_blank');
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-full transition-colors"
                    title="View file"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openDeleteModal(index);
                    }}
                    className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-full transition-colors"
                    title="Delete file"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Guidelines */}
      <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
        <p>• Supported formats: JPG, PNG, GIF, PDF</p>
        <p>• Maximum file size: 5MB per file</p>
        <p>• Upload receipts, invoices, or delivery confirmations</p>
        <p>• Files are stored securely in the cloud</p>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        loading={deleteModal.loading}
        title="Delete Receipt File"
        message={`Are you sure you want to delete "${deleteModal.fileName}"? This file will be permanently removed from cloud storage and cannot be recovered.`}
        confirmText="Delete File"
        cancelText="Keep File"
      />
    </div>
  );
};

export default ReceiptUploader;
