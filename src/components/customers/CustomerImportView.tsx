import React, { useState, useRef } from 'react';
import {
  Upload,
  Download,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  CopyCheck,
  AlertTriangle,
  FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Customer } from '../../types/index.ts';

interface CustomerImportViewProps {
  existingCustomers?: Customer[];
  onImportComplete: (
    customers: Array<{
      name: string;
      phone: string;
      email?: string;
      category?: string;
      address?: string;
      city?: string;
      place?: string;
      referredBy?: string;
      status?: 'active' | 'lead' | 'inactive';
    }>,
    strategy?: 'skip' | 'update' | 'all'
  ) => Promise<{ importedCount: number; updatedCount?: number; skippedCount?: number; errors: string[] }>;
  onNavigateToDirectory: () => void;
  totalCustomersCount: number;
}

interface ParsedCustomerRow {
  name: string;
  phone: string;
  place?: string;
  referredBy?: string;
  email?: string;
  category?: string;
  address?: string;
  status: 'active' | 'lead' | 'inactive';
  isValid: boolean;
  validationError?: string;
  duplicateType: 'none' | 'database' | 'file';
  duplicateMatchName?: string;
}

export const CustomerImportView: React.FC<CustomerImportViewProps> = ({
  existingCustomers = [],
  onImportComplete,
  onNavigateToDirectory,
  totalCustomersCount
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedCustomerRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [pasteData, setPasteData] = useState('');
  const [importMode, setImportMode] = useState<'upload' | 'paste'>('upload');
  const [deduplicateStrategy, setDeduplicateStrategy] = useState<'skip' | 'update' | 'all'>('skip');
  const [importResult, setImportResult] = useState<{
    importedCount: number;
    updatedCount?: number;
    skippedCount?: number;
    errors: string[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate and download sample template
  const handleDownloadTemplate = (format: 'xlsx' | 'csv') => {
    const templateData = [
      {
        'Customer Name': 'Priya Sharma',
        'Mobile Phone': '9845012345',
        'Place / Location': 'Trivandrum',
        'Referred By': 'Dr. Rajesh Nair',
        'Category': 'VIP Customer',
        'Email Address': 'priya.sharma@example.com',
        'Status': 'active'
      },
      {
        'Customer Name': 'Rajesh Verma',
        'Mobile Phone': '9876543210',
        'Place / Location': 'Kollam',
        'Referred By': 'Walk-in Board',
        'Category': 'Retail Walk-in',
        'Email Address': 'rajesh.v@example.com',
        'Status': 'lead'
      },
      {
        'Customer Name': 'Ananya Nair',
        'Mobile Phone': '9123456789',
        'Place / Location': 'Kochi',
        'Referred By': 'Priya Sharma',
        'Category': 'Wholesale / B2B',
        'Email Address': 'ananya@example.com',
        'Status': 'active'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Giri_Customers');

    if (format === 'csv') {
      XLSX.writeFile(workbook, 'Giri_Jewellers_Customer_Template.csv', { bookType: 'csv' });
    } else {
      XLSX.writeFile(workbook, 'Giri_Jewellers_Customer_Template.xlsx', { bookType: 'xlsx' });
    }
  };

  const processRawData = (rows: any[]) => {
    setErrorNotice(null);
    const existingPhones = new Map<string, string>();
    existingCustomers.forEach(c => {
      if (c.phone) {
        const clean = c.phone.replace(/\D/g, '').slice(-10);
        if (clean) existingPhones.set(clean, c.name);
      }
    });

    const fileSeenPhones = new Set<string>();

    const processed: ParsedCustomerRow[] = rows.map((row) => {
      // Find name field
      const nameKey = Object.keys(row).find(k =>
        /name|customer|client|full\s*name/i.test(k.trim())
      );
      const rawName = nameKey ? String(row[nameKey] || '').trim() : '';

      // Find phone field
      const phoneKey = Object.keys(row).find(k =>
        /phone|mobile|contact|cell|number|tel/i.test(k.trim())
      );
      const rawPhone = phoneKey ? String(row[phoneKey] || '').trim() : '';

      // Place / city
      const placeKey = Object.keys(row).find(k =>
        /place|location|city|town|native|area|address/i.test(k.trim())
      );
      const rawPlace = placeKey ? String(row[placeKey] || '').trim() : '';

      // Referred By
      const refKey = Object.keys(row).find(k =>
        /refer|referred\s*by|source|agent|staff/i.test(k.trim())
      );
      const rawReferredBy = refKey ? String(row[refKey] || '').trim() : '';

      // Category / Tag
      const catKey = Object.keys(row).find(k =>
        /cat|category|tag|interest|type/i.test(k.trim())
      );
      const rawCategory = catKey ? String(row[catKey] || '').trim() : '';

      // Email
      const emailKey = Object.keys(row).find(k =>
        /email|mail/i.test(k.trim())
      );
      const rawEmail = emailKey ? String(row[emailKey] || '').trim() : '';

      const cleanDigits = rawPhone.replace(/\D/g, '').slice(-10);
      let isValid = true;
      let validationError = '';

      if (!rawName) {
        isValid = false;
        validationError = 'Missing name';
      } else if (!rawPhone || cleanDigits.length < 7) {
        isValid = false;
        validationError = 'Invalid phone';
      }

      let duplicateType: 'none' | 'database' | 'file' = 'none';
      let duplicateMatchName = '';

      if (cleanDigits) {
        if (existingPhones.has(cleanDigits)) {
          duplicateType = 'database';
          duplicateMatchName = existingPhones.get(cleanDigits) || 'Existing Customer';
        } else if (fileSeenPhones.has(cleanDigits)) {
          duplicateType = 'file';
        }
        fileSeenPhones.add(cleanDigits);
      }

      return {
        name: rawName || 'Unknown Customer',
        phone: rawPhone,
        place: rawPlace,
        referredBy: rawReferredBy,
        email: rawEmail,
        category: rawCategory,
        status: 'active',
        isValid,
        validationError,
        duplicateType,
        duplicateMatchName
      };
    });

    setParsedRows(processed);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setIsProcessing(true);
    setErrorNotice(null);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);

        if (!json || json.length === 0) {
          setErrorNotice('The file appears empty or cannot be parsed.');
          setParsedRows([]);
        } else {
          processRawData(json);
        }
      } catch (err: any) {
        setErrorNotice(`Error parsing file: ${err.message}`);
      } finally {
        setIsProcessing(false);
      }
    };
    reader.onerror = () => {
      setErrorNotice('Failed to read file from disk.');
      setIsProcessing(false);
    };
    reader.readAsBinaryString(uploadedFile);
  };

  const handleProcessPasted = () => {
    if (!pasteData.trim()) return;
    setImportResult(null);
    try {
      const workbook = XLSX.read(pasteData, { type: 'string' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const json = XLSX.utils.sheet_to_json(worksheet);

      if (!json || json.length === 0) {
        setErrorNotice('Could not recognize any valid rows in the pasted text.');
        setParsedRows([]);
      } else {
        processRawData(json);
      }
    } catch (err: any) {
      setErrorNotice(`Failed to process pasted content: ${err.message}`);
    }
  };

  const handleConfirmImport = async () => {
    const validRows = parsedRows.filter(r => r.isValid);
    if (validRows.length === 0) {
      setErrorNotice('No valid records to import. Please check required columns (Name and Phone).');
      return;
    }

    setIsSubmitting(true);
    setErrorNotice(null);
    try {
      const result = await onImportComplete(
        validRows.map(r => ({
          name: r.name,
          phone: r.phone,
          place: r.place,
          city: r.place,
          referredBy: r.referredBy,
          email: r.email,
          category: r.category,
          address: r.address,
          status: r.status
        })),
        deduplicateStrategy
      );
      setImportResult(result);
    } catch (err: any) {
      setErrorNotice(err.message || 'Import failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const validCount = parsedRows.filter(r => r.isValid).length;
  const invalidCount = parsedRows.length - validCount;
  const dbDuplicatesCount = parsedRows.filter(r => r.duplicateType === 'database').length;

  return (
    <div className="space-y-6 font-sans">
      {/* Title & Status Banner */}
      <div className="bg-[#ffffff] border border-[#ede0d6] rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#3d0c22] text-[#dfb76c] flex items-center justify-center shadow-xs">
              <Upload className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#3d0c22] tracking-tight">Import Customer Data</h1>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#fae8dc] text-[#785b1f] border border-[#dfb76c]/40 font-mono">
              Excel & CSV
            </span>
          </div>
          <p className="text-xs text-[#876876]">
            Bulk upload customer records with automatic deduplication, place recognition, and referral tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleDownloadTemplate('xlsx')}
            className="px-3.5 py-2 bg-[#ffffff] hover:bg-[#fcf8f6] text-[#3d0c22] border border-[#edd4c8] text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-[#b08738]" />
            <span>Sample Excel (.xlsx)</span>
          </button>
          <button
            onClick={() => handleDownloadTemplate('csv')}
            className="px-3.5 py-2 bg-[#ffffff] hover:bg-[#fcf8f6] text-[#3d0c22] border border-[#edd4c8] text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-[#b08738]" />
            <span>Sample CSV</span>
          </button>
        </div>
      </div>

      {/* Successful Import Result Banner */}
      {importResult && (
        <div className="p-5 bg-emerald-50 border border-emerald-300 rounded-2xl shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center border border-emerald-300">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-emerald-900">Import Complete!</h3>
                <p className="text-xs text-emerald-800">
                  {importResult.importedCount} new customers added • {importResult.updatedCount || 0} existing updated • {importResult.skippedCount || 0} duplicates skipped.
                </p>
              </div>
            </div>
            <button
              onClick={onNavigateToDirectory}
              className="px-4 py-2 bg-[#3d0c22] hover:bg-[#12362b] text-[#ffffff] text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer border border-[#dfb76c]/40"
            >
              <span>View Customer Directory</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#dfb76c]" />
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Specifications & Deduplication Strategy */}
        <div className="lg:col-span-5 bg-[#ffffff] border border-[#ede0d6] rounded-3xl p-6 shadow-xs space-y-4">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-[#3d0c22] flex items-center gap-2">
              <CopyCheck className="w-4 h-4 text-[#b08738]" />
              <span>Deduplication Strategy</span>
            </h2>
            <p className="text-xs text-[#876876]">
              Choose how the system handles rows matching existing customer phone numbers.
            </p>
          </div>

          {/* Strategy Picker Options */}
          <div className="space-y-2">
            <label
              onClick={() => setDeduplicateStrategy('skip')}
              className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-colors ${
                deduplicateStrategy === 'skip'
                  ? 'bg-[#fcf8f6] border-[#3d0c22] text-[#3d0c22]'
                  : 'bg-[#ffffff] border-[#ede0d6] text-[#876876] hover:bg-[#fcf8f6]'
              }`}
            >
              <input
                type="radio"
                name="strategy"
                checked={deduplicateStrategy === 'skip'}
                onChange={() => setDeduplicateStrategy('skip')}
                className="mt-1 accent-[#3d0c22]"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-[#3d0c22] block">Skip Duplicates (Recommended)</span>
                <span className="text-[11px] text-[#876876] block">
                  Only imports fresh customer contacts. Existing numbers are preserved without duplication.
                </span>
              </div>
            </label>

            <label
              onClick={() => setDeduplicateStrategy('update')}
              className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-colors ${
                deduplicateStrategy === 'update'
                  ? 'bg-[#fcf8f6] border-[#3d0c22] text-[#3d0c22]'
                  : 'bg-[#ffffff] border-[#ede0d6] text-[#876876] hover:bg-[#fcf8f6]'
              }`}
            >
              <input
                type="radio"
                name="strategy"
                checked={deduplicateStrategy === 'update'}
                onChange={() => setDeduplicateStrategy('update')}
                className="mt-1 accent-[#3d0c22]"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-[#3d0c22] block">Update / Enrich Existing</span>
                <span className="text-[11px] text-[#876876] block">
                  If phone matches an existing customer, enriches their place, referral, and notes.
                </span>
              </div>
            </label>
          </div>

          {/* Expected Columns Table */}
          <div className="pt-2 border-t border-[#ede0d6] space-y-2">
            <span className="text-xs font-bold text-[#3d0c22] block">Recognized Columns</span>
            <div className="border border-[#ede0d6] rounded-xl overflow-hidden bg-[#fcf8f6]">
              <table className="w-full text-left text-xs">
                <tbody className="divide-y divide-[#ede0d6] text-[#523443]">
                  <tr>
                    <td className="py-2 px-3 font-mono text-[#3d0c22] font-bold">Name</td>
                    <td className="py-2 px-3 text-rose-600 font-semibold">Required</td>
                    <td className="py-2 px-3">Priya Sharma</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono text-[#3d0c22] font-bold">Phone</td>
                    <td className="py-2 px-3 text-rose-600 font-semibold">Required</td>
                    <td className="py-2 px-3">9845012345</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono text-[#3d0c22] font-bold">Place</td>
                    <td className="py-2 px-3 text-[#b08738]">Optional</td>
                    <td className="py-2 px-3">Trivandrum</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono text-[#3d0c22] font-bold">Referred By</td>
                    <td className="py-2 px-3 text-[#b08738]">Optional</td>
                    <td className="py-2 px-3">Dr. Rajesh</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono text-[#3d0c22] font-bold">Category</td>
                    <td className="py-2 px-3 text-[#b08738]">Optional</td>
                    <td className="py-2 px-3">VIP Customer</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Upload / Paste Area */}
        <div className="lg:col-span-7 bg-[#ffffff] border border-[#ede0d6] rounded-3xl p-6 shadow-xs space-y-4">
          {/* Mode Switcher */}
          <div className="flex items-center gap-2 border-b border-[#ede0d6] pb-3">
            <button
              type="button"
              onClick={() => setImportMode('upload')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
                importMode === 'upload'
                  ? 'bg-[#3d0c22] text-[#ffffff]'
                  : 'text-[#876876] hover:text-[#3d0c22] bg-[#fcf8f6]'
              }`}
            >
              Upload Spreadsheet File (.xlsx / .csv)
            </button>
            <button
              type="button"
              onClick={() => setImportMode('paste')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
                importMode === 'paste'
                  ? 'bg-[#3d0c22] text-[#ffffff]'
                  : 'text-[#876876] hover:text-[#3d0c22] bg-[#fcf8f6]'
              }`}
            >
              Paste Table Rows Directly
            </button>
          </div>

          {importMode === 'upload' ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#edd4c8] hover:border-[#3d0c22] rounded-3xl p-8 text-center cursor-pointer transition-colors bg-[#fcf8f6]/60 hover:bg-[#fcf8f6]"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Upload className="w-10 h-10 text-[#b08738] mx-auto mb-2" />
              <p className="text-sm font-bold text-[#3d0c22]">
                {file ? file.name : 'Click to select Excel (.xlsx) or CSV file'}
              </p>
              <p className="text-xs text-[#876876] mt-1">
                Drag and drop files here to parse customer records
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#523443] font-medium">Paste copied rows directly from spreadsheet:</span>
                <span className="text-[11px] text-[#b08738] font-mono">Tab-separated / Excel grid format</span>
              </div>
              <textarea
                rows={6}
                value={pasteData}
                onChange={(e) => setPasteData(e.target.value)}
                placeholder="Paste rows copied from Excel (Name, Phone, Place, Referred By)..."
                className="w-full text-xs font-mono p-3 bg-[#fcf8f6] border border-[#edd4c8] focus:border-[#3d0c22] rounded-xl text-[#3d0c22] placeholder:text-[#a88d9c] focus:outline-none font-medium"
              />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <p className="text-[11px] text-[#876876]">
                  Click to parse columns, detect duplicates, and preview records before saving.
                </p>
                <button
                  type="button"
                  onClick={handleProcessPasted}
                  disabled={!pasteData.trim() || isProcessing}
                  className="px-4 py-2 bg-[#3d0c22] hover:bg-[#12362b] active:scale-95 text-[#ffffff] border border-[#dfb76c]/40 text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-40 shrink-0"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-[#dfb76c]" />
                  <span>Parse Pasted Rows</span>
                </button>
              </div>
            </div>
          )}

          {errorNotice && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorNotice}</span>
            </div>
          )}

          {/* Parsed Preview Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex flex-wrap items-center justify-between text-xs border-b border-[#ede0d6] pb-2 gap-2">
                <span className="font-bold text-[#3d0c22]">Parsed Preview ({parsedRows.length} total rows)</span>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-emerald-700 font-semibold">{validCount} valid</span>
                  {dbDuplicatesCount > 0 && (
                    <span className="text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-300">
                      {dbDuplicatesCount} in DB
                    </span>
                  )}
                  {invalidCount > 0 && (
                    <span className="text-rose-700 font-semibold">{invalidCount} invalid</span>
                  )}
                </div>
              </div>

              <div className="border border-[#ede0d6] rounded-xl overflow-x-auto max-h-64 bg-white">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-[#fcf8f6] border-b border-[#ede0d6] text-[#876876]">
                      <th className="py-2.5 px-3">Validation</th>
                      <th className="py-2.5 px-3">Name</th>
                      <th className="py-2.5 px-3">Phone</th>
                      <th className="py-2.5 px-3">Place</th>
                      <th className="py-2.5 px-3">Referred By</th>
                      <th className="py-2.5 px-3">Category</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ede0d6]">
                    {parsedRows.slice(0, 15).map((row, idx) => (
                      <tr key={idx} className={row.isValid ? 'hover:bg-[#fcf8f6]' : 'bg-rose-50/50'}>
                        <td className="py-2 px-3">
                          {row.duplicateType === 'database' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-amber-800 font-semibold px-2 py-0.5 rounded bg-amber-50 border border-amber-300" title={row.duplicateMatchName}>
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              <span>In DB</span>
                            </span>
                          ) : row.isValid ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-800 font-semibold">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Fresh
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] text-rose-800 font-semibold">
                              <AlertCircle className="w-3 h-3 text-rose-600" /> Invalid
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 font-semibold text-[#3d0c22]">{row.name || '-'}</td>
                        <td className="py-2 px-3 text-[#523443] font-mono">{row.phone || '-'}</td>
                        <td className="py-2 px-3 text-[#523443]">{row.place || '-'}</td>
                        <td className="py-2 px-3 text-[#523443]">{row.referredBy || '-'}</td>
                        <td className="py-2 px-3 text-[#b08738]">{row.category || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Import Confirmation Action */}
              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setParsedRows([]);
                    setFile(null);
                    setPasteData('');
                  }}
                  className="text-xs text-[#876876] hover:text-[#3d0c22] cursor-pointer"
                >
                  Clear Preview
                </button>
                <button
                  type="button"
                  disabled={validCount === 0 || isSubmitting || isProcessing}
                  onClick={handleConfirmImport}
                  className="flex items-center gap-2 py-2.5 px-6 bg-[#3d0c22] hover:bg-[#12362b] disabled:opacity-40 text-[#ffffff] border border-[#dfb76c]/40 font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer active:scale-98"
                >
                  <span>
                    {isSubmitting
                      ? 'Importing...'
                      : `Confirm Import (${validCount} records)`}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#dfb76c]" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
