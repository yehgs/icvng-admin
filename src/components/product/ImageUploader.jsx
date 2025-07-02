import React, { useState, useRef } from 'react';
import { Upload, X, Image, Plus, Eye, Trash2 } from 'lucide-react';
import { fileAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const ImageUploader = ({
  images = [],
  onImagesChange,
  multiple = false,
  maxImages = 5,
  className = '',
}) => {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (files) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const maxAllowed = multiple ? maxImages - images.length : 1;
    const filesToProcess = fileArray.slice(0, maxAllowed);

    if (fileArray.length > maxAllowed) {
      toast.error(`Only ${maxAllowed} more images can be uploaded`);
    }

    uploadImages(filesToProcess);
  };

  const uploadImages = async (files) => {
    setUploading(true);
    const uploadedImages = [];

    try {
      for (const file of files) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} is not a valid image file`);
          continue;
        }

        // Validate file size (2MB limit)
        if (file.size > 1 * 1024 * 1024) {
          toast.error(`${file.name} is too large. Maximum size is 1MB`);
          continue;
        }

        try {
          const response = await fileAPI.uploadImage(file);
          if (response.success) {
            uploadedImages.push(response.data.secure_url);
          }
        } catch (error) {
          console.error('Upload error:', error);
          toast.error(`Failed to upload ${file.name}`);
        }
      }

      if (uploadedImages.length > 0) {
        const newImages = multiple
          ? [...images, ...uploadedImages]
          : uploadedImages;
        onImagesChange(newImages);
        toast.success(
          `${uploadedImages.length} image(s) uploaded successfully!`
        );
      }
    } catch (error) {
      console.error('Upload process error:', error);
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
    toast.success('Image removed');
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

  const canAddMore = multiple ? images.length < maxImages : images.length === 0;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      {canAddMore && (
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
            multiple={multiple}
            accept="image/*"
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
                {uploading ? 'Uploading...' : 'Upload Images'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Drag and drop or click to select{' '}
                {multiple ? 'images' : 'an image'}
              </p>
              {multiple && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {images.length}/{maxImages} images uploaded
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Uploaded Images ({images.length})
          </h4>
          <div
            className={`grid gap-4 ${
              multiple
                ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
                : 'grid-cols-1 max-w-xs'
            }`}
          >
            {images.map((imageUrl, index) => (
              <div
                key={index}
                className="relative group bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden aspect-square"
              >
                <img
                  src={imageUrl}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-full object-cover"
                />

                {/* Overlay with actions */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(imageUrl, '_blank');
                      }}
                      className="p-2 bg-white text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
                      title="View full size"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage(index);
                      }}
                      className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                      title="Remove image"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Primary image indicator */}
                {multiple && index === 0 && (
                  <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                    Primary
                  </div>
                )}
              </div>
            ))}

            {/* Add more button for multiple images */}
            {multiple && canAddMore && (
              <button
                onClick={openFileDialog}
                className="aspect-square border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                disabled={uploading}
              >
                <Plus className="h-8 w-8 text-gray-400" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Upload Guidelines */}
      <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
        <p>• Supported formats: JPG, PNG, GIF, WebP</p>
        <p>• Maximum file size: 1MB per image</p>
        {multiple && <p>• Maximum {maxImages} images allowed</p>}
        <p>• Recommended resolution: 1200x1200px or higher</p>
      </div>
    </div>
  );
};

export default ImageUploader;
