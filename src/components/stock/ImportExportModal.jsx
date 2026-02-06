// admin/src/components/stock/ImportExportModal.jsx
import React, { useState } from "react";
import {
  X,
  Download,
  Upload,
  FileSpreadsheet,
  FileText,
  AlertTriangle,
  CheckCircle,
  Info,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

const ImportExportModal = ({
  isOpen,
  onClose,
  onExport,
  onImport,
  type = "import",
}) => {
  const [exportConfig, setExportConfig] = useState({
    format: "csv",
    columns: "all",
    allProducts: false,
    limit: 100,
  });

  const [importConfig, setImportConfig] = useState({
    file: null,
    importing: false,
    results: null,
    notificationEmails: "",
  });

  const columnOptions = [
    { value: "all", label: "All Columns" },
    {
      value: "supplier,weight,unit,packaging,finalStock,online,offline",
      label: "Essential + Supplier",
    },
    {
      value: "stockInHouse,damaged,expired,refurb,finalStock",
      label: "Stock Details Only",
    },
    { value: "finalStock,online,offline", label: "Distribution Only" },
  ];

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === "text/csv") {
      setImportConfig((prev) => ({
        ...prev,
        file: selectedFile,
        results: null,
      }));
    } else {
      toast.error("Please select a valid CSV file");
      e.target.value = "";
    }
  };

  const handleExport = async () => {
    await onExport(exportConfig);
  };

  const handleImport = async () => {
    if (!importConfig.file) {
      toast.error("Please select a file");
      return;
    }

    setImportConfig((prev) => ({ ...prev, importing: true }));

    try {
      const fileContent = await importConfig.file.text();

      // Parse notification emails
      const emails = importConfig.notificationEmails
        .split(",")
        .map((email) => email.trim())
        .filter((email) => email.length > 0);

      const results = await onImport({
        csvData: fileContent,
        notificationEmails: emails,
      });

      setImportConfig((prev) => ({
        ...prev,
        results,
        importing: false,
      }));

      toast.success(results.message || "Import completed");
    } catch (error) {
      console.error("Import error:", error);
      toast.error(error.message || "Import failed");
      setImportConfig((prev) => ({ ...prev, importing: false }));
    }
  };

  const resetImport = () => {
    setImportConfig({
      file: null,
      importing: false,
      results: null,
      notificationEmails: "",
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${type === "import" ? "bg-blue-100 dark:bg-blue-900" : "bg-green-100 dark:bg-green-900"}`}
            >
              {type === "import" ? (
                <Upload className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              ) : (
                <Download className="h-5 w-5 text-green-600 dark:text-green-400" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {type === "import"
                  ? "Import Warehouse Stock"
                  : "Export Warehouse Stock"}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {type === "import"
                  ? "Upload CSV to update stock quantities"
                  : "Download stock data in CSV or PDF format"}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              resetImport();
              onClose();
            }}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {type === "export" ? (
            // EXPORT UI
            <div className="space-y-6">
              {/* Format Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Export Format
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      value="csv"
                      checked={exportConfig.format === "csv"}
                      onChange={(e) =>
                        setExportConfig((prev) => ({
                          ...prev,
                          format: e.target.value,
                        }))
                      }
                      className="mr-2"
                    />
                    <FileSpreadsheet className="w-4 h-4 mr-1" />
                    CSV
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      value="pdf"
                      checked={exportConfig.format === "pdf"}
                      onChange={(e) =>
                        setExportConfig((prev) => ({
                          ...prev,
                          format: e.target.value,
                        }))
                      }
                      className="mr-2"
                    />
                    <FileText className="w-4 h-4 mr-1" />
                    PDF (with color indicators)
                  </label>
                </div>
              </div>

              {/* Column Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Columns
                </label>
                <select
                  value={exportConfig.columns}
                  onChange={(e) =>
                    setExportConfig((prev) => ({
                      ...prev,
                      columns: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  {columnOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Pagination Options */}
              <div>
                <label className="flex items-center cursor-pointer mb-3">
                  <input
                    type="checkbox"
                    checked={exportConfig.allProducts}
                    onChange={(e) =>
                      setExportConfig((prev) => ({
                        ...prev,
                        allProducts: e.target.checked,
                      }))
                    }
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Export All Products
                  </span>
                </label>

                {!exportConfig.allProducts && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Number of Products
                    </label>
                    <select
                      value={exportConfig.limit}
                      onChange={(e) =>
                        setExportConfig((prev) => ({
                          ...prev,
                          limit: parseInt(e.target.value),
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="50">50 Products</option>
                      <option value="100">100 Products</option>
                      <option value="200">200 Products</option>
                      <option value="500">500 Products</option>
                    </select>
                  </div>
                )}
              </div>

              {/* PDF Color Legend Info */}
              {exportConfig.format === "pdf" && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                    <Info className="w-4 h-4 mr-2" />
                    PDF Color Indicators
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-red-500 rounded"></div>
                      <span>Red = Out of Stock (0 items)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-orange-500 rounded"></div>
                      <span>Orange = Low Stock (≤10 items)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-500 rounded"></div>
                      <span>Green = In Stock ({">"}10 items)</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExport}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export {exportConfig.format.toUpperCase()}
                </button>
              </div>
            </div>
          ) : (
            // IMPORT UI
            <div className="space-y-6">
              {!importConfig.results ? (
                <>
                  {/* Instructions */}
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                      <Info className="w-4 h-4 mr-2" />
                      Import Instructions
                    </h4>
                    <div className="text-sm space-y-2 text-gray-700 dark:text-gray-300">
                      <p>
                        <strong>1. Required CSV Columns:</strong>
                      </p>
                      <ul className="list-disc list-inside ml-4 space-y-1">
                        <li>Product Name</li>
                        <li>SKU (used for matching products)</li>
                        <li>Supplier (auto-creates if new)</li>
                        <li>Weight (kg)</li>
                        <li>Unit</li>
                        <li>Packaging</li>
                        <li>Stock on Arrival</li>
                        <li>Stock In House</li>
                        <li>Damaged Qty</li>
                        <li>Expired Qty</li>
                        <li>Refurbished Qty</li>
                        <li>Final Stock</li>
                        <li>Online Stock</li>
                        <li>Offline Stock</li>
                      </ul>

                      <p className="pt-2">
                        <strong>2. Validation Rules:</strong>
                      </p>
                      <ul className="list-disc list-inside ml-4 space-y-1">
                        <li>All quantities must be ≥ 0</li>
                        <li>Final Stock ≤ Stock In House</li>
                        <li>Online + Offline ≤ Final Stock</li>
                        <li>
                          Stock In House = Damaged + Expired + Refurbished +
                          Final Stock
                        </li>
                      </ul>

                      <p className="pt-2">
                        <strong>3. Supplier Notes:</strong>
                      </p>
                      <ul className="list-disc list-inside ml-4 space-y-1">
                        <li>
                          New suppliers will be auto-created with a generated
                          slug
                        </li>
                        <li>
                          Existing suppliers are matched by name
                          (case-insensitive)
                        </li>
                        <li>
                          Leave blank to keep existing supplier or set to "None"
                        </li>
                      </ul>

                      <p className="pt-2">
                        <strong>4. Tips:</strong>
                      </p>
                      <ul className="list-disc list-inside ml-4 space-y-1">
                        <li>
                          Export current data first to get the correct format
                        </li>
                        <li>SKU must exactly match existing products</li>
                        <li>
                          Weight, Unit, and Packaging will be updated if
                          provided
                        </li>
                        <li>
                          An email report will be sent after import completion
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* File Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Select CSV File
                    </label>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileChange}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                    {importConfig.file && (
                      <div className="mt-2 flex items-center text-sm text-green-600 dark:text-green-400">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        {importConfig.file.name} selected
                      </div>
                    )}
                  </div>

                  {/* Notification Emails */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Notification Emails (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={importConfig.notificationEmails}
                      onChange={(e) =>
                        setImportConfig((prev) => ({
                          ...prev,
                          notificationEmails: e.target.value,
                        }))
                      }
                      placeholder="admin@example.com, warehouse@example.com"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Leave blank to use your email address
                    </p>
                  </div>

                  {/* Warning */}
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <div className="flex items-start">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-yellow-800 dark:text-yellow-200">
                        <strong>Important:</strong>
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          <li>Products are matched by SKU (case-sensitive)</li>
                          <li>
                            Supplier, Weight, Unit, and Packaging will be
                            updated
                          </li>
                          <li>New suppliers are automatically created</li>
                          <li>
                            Invalid data will be rejected with error messages
                          </li>
                          <li>
                            Email notifications will be sent to specified
                            addresses
                          </li>
                          <li>
                            This action cannot be undone - review your data
                            carefully
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => {
                        resetImport();
                        onClose();
                      }}
                      disabled={importConfig.importing}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleImport}
                      disabled={importConfig.importing || !importConfig.file}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {importConfig.importing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Import Stock Data
                        </>
                      )}
                    </button>
                  </div>
                </>
              ) : (
                // Import Results
                <div className="space-y-6">
                  <div className="text-center p-6 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                    <div className="text-lg font-semibold text-green-800 dark:text-green-200">
                      Import Completed
                    </div>
                    <div className="text-sm text-green-600 dark:text-green-400 mt-1">
                      Processed {importConfig.results.data.totalProcessed}{" "}
                      products
                    </div>
                    {importConfig.results.data.newSuppliersCreated?.length >
                      0 && (
                      <div className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                        🆕 Created{" "}
                        {importConfig.results.data.newSuppliersCreated.length}{" "}
                        new supplier(s)
                      </div>
                    )}
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                      Email notification sent to administrators
                    </div>
                  </div>

                  {/* Statistics */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {importConfig.results.data.totalProcessed}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Total
                      </div>
                    </div>
                    <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {importConfig.results.data.successful?.length || 0}
                      </div>
                      <div className="text-sm text-green-600 dark:text-green-400">
                        Successful
                      </div>
                    </div>
                    <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">
                        {importConfig.results.data.failed?.length || 0}
                      </div>
                      <div className="text-sm text-red-600 dark:text-red-400">
                        Failed
                      </div>
                    </div>
                  </div>

                  {/* New Suppliers Created */}
                  {importConfig.results.data.newSuppliersCreated?.length >
                    0 && (
                    <div>
                      <h4 className="font-medium text-blue-600 dark:text-blue-400 mb-2 flex items-center">
                        <Info className="w-5 h-5 mr-2" />
                        New Suppliers Created (
                        {importConfig.results.data.newSuppliersCreated.length})
                      </h4>
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                        <div className="space-y-1">
                          {importConfig.results.data.newSuppliersCreated.map(
                            (supplier, index) => (
                              <div
                                key={index}
                                className="text-sm text-gray-700 dark:text-gray-300"
                              >
                                🆕 <strong>{supplier.name}</strong> (slug:{" "}
                                {supplier.slug})
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Successful Updates */}
                  {importConfig.results.data.successful?.length > 0 && (
                    <div>
                      <h4 className="font-medium text-green-600 dark:text-green-400 mb-2 flex items-center">
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Successfully Updated (
                        {importConfig.results.data.successful.length})
                      </h4>
                      <div className="max-h-48 overflow-y-auto bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
                        {importConfig.results.data.successful.map(
                          (item, index) => (
                            <div
                              key={index}
                              className="text-sm text-gray-700 dark:text-gray-300 py-1"
                            >
                              ✓ {item.sku} - {item.productName}
                              {item.supplier && (
                                <span className="text-xs text-gray-500 ml-2">
                                  (Supplier: {item.supplier})
                                </span>
                              )}
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                  {/* Failed Updates */}
                  {importConfig.results.data.failed?.length > 0 && (
                    <div>
                      <h4 className="font-medium text-red-600 dark:text-red-400 mb-2 flex items-center">
                        <AlertTriangle className="w-5 h-5 mr-2" />
                        Failed Updates (
                        {importConfig.results.data.failed.length})
                      </h4>
                      <div className="max-h-48 overflow-y-auto bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-800">
                        {importConfig.results.data.failed.map((item, index) => (
                          <div
                            key={index}
                            className="text-sm text-gray-700 dark:text-gray-300 py-1 border-b border-red-100 dark:border-red-800 last:border-0"
                          >
                            <div className="font-medium">✗ {item.sku}</div>
                            <div className="text-xs text-red-600 dark:text-red-400 ml-4">
                              {item.reason}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Done Button */}
                  <button
                    onClick={() => {
                      resetImport();
                      onClose();
                    }}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportExportModal;
