// admin/src/components/logistics/LogisticsCsvImportModal.jsx
import React, { useState } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Download,
} from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * Generic CSV import modal shared by Shipping Zones and Shipping Methods.
 * The same CSV file structure produced by "Export CSV" is what this
 * modal expects back on import - i.e. one template, both directions.
 */
const LogisticsCsvImportModal = ({
  isOpen,
  onClose,
  entityLabel, // e.g. "Shipping Zones" / "Shipping Methods"
  onExport, // async () => void  - triggers file download
  onImport, // async (csvData) => response { success, message, data }
  onImportSuccess, // called after a successful import so parent can refetch
  formatGuide, // JSX describing the column format for this entity
}) => {
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [results, setResults] = useState(null);

  if (!isOpen) return null;

  const reset = () => {
    setFile(null);
    setImporting(false);
    setResults(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && (selected.type === 'text/csv' || selected.name.endsWith('.csv'))) {
      setFile(selected);
      setResults(null);
    } else {
      toast.error('Please select a valid CSV file');
      e.target.value = '';
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      setExporting(true);
      await onExport();
      toast.success(`${entityLabel} CSV downloaded`);
    } catch (error) {
      toast.error(error.message || 'Failed to export CSV');
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error('Please select a CSV file first');
      return;
    }

    setImporting(true);
    try {
      const csvData = await file.text();
      const response = await onImport(csvData);

      if (response.success) {
        setResults(response.data);
        toast.success(response.message || 'Import complete');
        if (onImportSuccess) await onImportSuccess();
      } else {
        toast.error(response.message || 'Import failed');
      }
    } catch (error) {
      console.error('CSV import error:', error);
      toast.error(error.message || 'Failed to import CSV');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Upload className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Import {entityLabel}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Upload a CSV file to create or update {entityLabel.toLowerCase()}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {!results ? (
            <div className="space-y-6">
              {/* Get the template */}
              <div className="p-4 bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                      1. Get the template
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Export your current {entityLabel.toLowerCase()} to CSV - this
                      is the exact file format the importer expects. Edit rows,
                      leave "Code" blank on new rows to create them, or keep an
                      existing code/name to update that record.
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadTemplate}
                    disabled={exporting}
                    className="flex-shrink-0 flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm disabled:opacity-50"
                  >
                    {exporting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    Export CSV
                  </button>
                </div>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  2. Select the edited CSV file
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
                {file && (
                  <div className="mt-2 flex items-center text-sm text-green-600 dark:text-green-400">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    {file.name} selected
                  </div>
                )}
              </div>

              {/* Format guide */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  CSV Format
                </h4>
                {formatGuide}
              </div>

              {/* Warning */}
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-start">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-yellow-800 dark:text-yellow-200">
                    Rows are matched by <strong>Code</strong> first, then by{' '}
                    <strong>Name</strong> (case-insensitive). A match updates the
                    existing record; no match creates a new one. Leave Code blank
                    for new rows - it will be auto-generated.
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleClose}
                  disabled={importing}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={importing || !file}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {importing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Import CSV
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Results */
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                    {results.created?.length || 0}
                  </div>
                  <div className="text-xs text-green-700 dark:text-green-400 mt-1">
                    Created
                  </div>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    {results.updated?.length || 0}
                  </div>
                  <div className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                    Updated
                  </div>
                </div>
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-center">
                  <div className="text-2xl font-bold text-red-700 dark:text-red-300">
                    {results.failed?.length || 0}
                  </div>
                  <div className="text-xs text-red-700 dark:text-red-400 mt-1">
                    Failed
                  </div>
                </div>
              </div>

              {results.failed?.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2 text-sm">
                    Failed rows
                  </h4>
                  <div className="max-h-56 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-200 dark:divide-gray-700">
                    {results.failed.map((f, idx) => (
                      <div
                        key={idx}
                        className="px-3 py-2 text-sm bg-red-50/50 dark:bg-red-900/10"
                      >
                        <span className="font-medium text-gray-900 dark:text-white">
                          Row {f.row}
                          {f.zone ? ` (${f.zone})` : ''}
                          {f.method ? ` (${f.method})` : ''}:
                        </span>{' '}
                        <span className="text-red-700 dark:text-red-300">
                          {f.reason}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={reset}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Import Another File
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LogisticsCsvImportModal;
