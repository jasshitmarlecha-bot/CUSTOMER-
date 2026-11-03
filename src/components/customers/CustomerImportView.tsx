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
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers');

    if (format === 'xlsx') {
      XLSX.writeFile(workbook, 'giri_jewels_import_template.xlsx');
    } else {
      XLSX.writeFile(workbook, 'giri_jewels_import_template.csv', { bookType: 'csv' });
    }
  };

  const processRawData = (rows: any[]) => {
    const parsed: ParsedCustomerRow[] = [];
    const seenPhonesInBatch = new Set<string>();

    for (const r of rows) {
      const keys = Object.keys(r);
      const findKey = (candidates: string[]) => {
        const found = keys.find(k => candidates.includes(k.trim().toLowerCase()));
        return found ? String(r[found] || '').trim() : '';
      };

      const name = findKey(['name', 'customer name', 'full name', 'client']);
      const phone = findKey(['phone', 'mobile', 'phone number', 'contact', 'telephone', 'mobile number']);
      const place = findKey(['place', 'town', 'city', 'location', 'district', 'native place', 'native']);
      const referredBy = findKey(['referred by', 'referredby', 'referrer', 'reference', 'ref by', 'ref']);
      const email = findKey(['email', 'email address', 'mail']);
      const category = findKey(['category', 'category name', 'type', 'group']);
      const address = findKey(['address', 'street', 'locality']);
      const rawStatus = findKey(['status', 'state']).toLowerCase();

      let status: 'active' | 'lead' | 'inactive' = 'active';
      if (rawStatus === 'lead') status = 'lead';
      else if (rawStatus === 'inactive') status = 'inactive';

      const isValid = Boolean(name && phone && phone.replace(/\D/g, '').length >= 7);
      let validationError: string | undefined;
      if (!name) validationError = 'Missing name';
      else if (!phone) validationError = 'Missing phone number';
      else if (phone.replace(/\D/g, '').length < 7) validationError = 'Phone number too short';

      const cleanPhone = phone ? phone.replace(/\D/g, '').slice(-10) : '';
      const cleanEmail = email ? email.trim().toLowerCase() : '';

      // Check duplicates
      let duplicateType: 'none' | 'database' | 'file' = 'none';
      let duplicateMatchName: string | undefined;

      if (cleanPhone && cleanPhone.length >= 7 && seenPhonesInBatch.has(cleanPhone)) {
        duplicateType = 'file';
        duplicateMatchName = 'Repeated row in this file';
      } else if (existingCustomers && existingCustomers.length > 0) {
        const match = existingCustomers.find(c => {
          const cPhone = c.phone ? c.phone.replace(/\D/g, '').slice(-10) : '';
          if (cleanPhone && cleanPhone.length >= 7 && cPhone === cleanPhone) return true;
          if (cleanEmail && cleanEmail.includes('@') && c.email?.trim().toLowerCase() === cleanEmail) return true;
          return false;
        });
        if (match) {
          duplicateType = 'database';
          duplicateMatchName = `Already in DB (${match.name})`;
        }
      }

      if (cleanPhone && cleanPhone.length >= 7) {
        seenPhonesInBatch.add(cleanPhone);
      }

      parsed.push({
        name,
        phone,
        place: place || undefined,
        referredBy: referredBy || undefined,
        email: email || undefined,
        category: category || undefined,
        address: address || undefined,
        status,
        isValid,
        validationError,
        duplicateType,
        duplicateMatchName
      });
    }

    setParsedRows(parsed);
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
  const fileDuplicatesCount = parsedRows.filter(r => r.duplicateType === 'file').length;

  return (
    <div className="space-y-6 font-sans">
      {/* Title & Status Banner */}
      <div className="bg-[#160d16] border border-[#392233] rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-[#cfb7c8]">
              <Upload className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-black text-white tracking-tight">Import Customer Data</h1>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#261327] text-[#faeed4] border border-[#482c40]">
              Excel & CSV
            </span>
          </div>
          <p className="text-xs text-[#cfb7c8]">
            Bulk upload customer records with automatic deduplication, place recognition, and referral tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleDownloadTemplate('xlsx')}
            className="px-3.5 py-2 bg-[#261327] hover:bg-[#281829] text-[#faeed4] border border-[#482c40] text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Sample Excel (.xlsx)</span>
          </button>
          <button
            onClick={() => handleDownloadTemplate('csv')}
            className="px-3.5 py-2 bg-[#1d121c] hover:bg-[#261327] text-[#faeed4] border border-[#482c40] text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Sample CSV</span>
          </button>
        </div>
      </div>

      {/* Successful Import Result Banner */}
      {importResult && (
        <div className="p-5 bg-gradient-to-r from-emerald-950/90 via-[#160d16] to-[#160d16] border border-emerald-500/50 rounded-2xl shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Import Complete!</h3>
                <p className="text-xs text-emerald-300">
                  {importResult.importedCount} new customers added • {importResult.updatedCount || 0} existing updated • {importResult.skippedCount || 0} duplicates skipped.
                </p>
              </div>
            </div>
            <button
              onClick={onNavigateToDirectory}
              className="px-4 py-2 bg-white text-purple-950 text-xs font-black rounded-xl shadow-md hover:bg-purple-50 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>View Customer Directory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Specifications & Deduplication Strategy */}
        <div className="lg:col-span-5 bg-[#160d16] border border-[#392233] rounded-3xl p-6 shadow-xl space-y-4">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <CopyCheck className="w-4 h-4 text-[#dfb76c]" />
              <span>Deduplication Strategy</span>
            </h2>
            <p className="text-xs text-[#cfb7c8]">
              Choose how the system handles rows matching existing customer phone numbers.
            </p>
          </div>

          {/* Strategy Picker Options */}
          <div className="space-y-2">
            <label
              onClick={() => setDeduplicateStrategy('skip')}
              className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-colors ${
                deduplicateStrategy === 'skip'
                  ? 'bg-[#261327] border-purple-500 text-white'
                  : 'bg-[#100911] border-[#392233] text-[#cfb7c8] hover:text-white'
              }`}
            >
              <input
                type="radio"
                name="strategy"
                checked={deduplicateStrategy === 'skip'}
                onChange={() => setDeduplicateStrategy('skip')}
                className="mt-1"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white block">Skip Duplicates (Recommended)</span>
                <span className="text-[11px] text-[#dfb76c] block">
                  Only imports fresh customer contacts. Existing numbers are preserved without duplication.
                </span>
              </div>
            </label>

            <label
              onClick={() => setDeduplicateStrategy('update')}
              className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-colors ${
                deduplicateStrategy === 'update'
                  ? 'bg-[#261327] border-purple-500 text-white'
                  : 'bg-[#100911] border-[#392233] text-[#cfb7c8] hover:text-white'
              }`}
            >
              <input
                type="radio"
                name="strategy"
                checked={deduplicateStrategy === 'update'}
                onChange={() => setDeduplicateStrategy('update')}
                className="mt-1"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white block">Update / Enrich Existing</span>
                <span className="text-[11px] text-[#dfb76c] block">
                  If phone matches an existing customer, enriches their place, referral, and notes.
                </span>
              </div>
            </label>
          </div>

          {/* Expected Columns Table */}
          <div className="pt-2 border-t border-[#392233] space-y-2">
            <span className="text-xs font-bold text-white block">Recognized Columns</span>
            <div className="border border-[#392233] rounded-xl overflow-hidden bg-[#100911]">
              <table className="w-full text-left text-xs">
                <tbody className="divide-y divide-purple-950/80 text-[#faeed4]">
                  <tr>
                    <td className="py-2 px-3 font-mono text-[#cfb7c8] font-bold">Name</td>
                    <td className="py-2 px-3 text-rose-400 font-semibold">Required</td>
                    <td className="py-2 px-3">Priya Sharma</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono text-[#cfb7c8] font-bold">Phone</td>
                    <td className="py-2 px-3 text-rose-400 font-semibold">Required</td>
                    <td className="py-2 px-3">9845012345</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono text-[#cfb7c8] font-bold">Place</td>
                    <td className="py-2 px-3 text-[#dfb76c]">Optional</td>
                    <td className="py-2 px-3">Trivandrum</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono text-[#cfb7c8] font-bold">Referred By</td>
                    <td className="py-2 px-3 text-[#dfb76c]">Optional</td>
                    <td className="py-2 px-3">Dr. Rajesh</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono text-[#faeed4]">Category</td>
                    <td className="py-2 px-3 text-[#dfb76c]">Optional</td>
                    <td className="py-2 px-3">VIP Customer</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Upload / Paste Area */}
        <div className="lg:col-span-7 bg-[#160d16] border border-[#392233] rounded-3xl p-6 shadow-xl space-y-4">
          {/* Mode Switcher */}
          <div className="flex items-center gap-2 border-b border-[#392233] pb-3">
            <button
              type="button"
              onClick={() => setImportMode('upload')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
                importMode === 'upload'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-[#cfb7c8] hover:text-white bg-[#100911]'
              }`}
            >
              Upload Spreadsheet File (.xlsx / .csv)
            </button>
            <button
              type="button"
              onClick={() => setImportMode('paste')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
                importMode === 'paste'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-[#cfb7c8] hover:text-white bg-[#100911]'
              }`}
            >
              Paste Table Rows Directly
            </button>
          </div>

          {importMode === 'upload' ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#392233] hover:border-purple-500 rounded-3xl p-8 text-center cursor-pointer transition-colors bg-[#100911]/80 hover:bg-[#100911]"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Upload className="w-10 h-10 text-[#dfb76c] mx-auto mb-2" />
              <p className="text-sm font-bold text-white">
                {file ? file.name : 'Click to select Excel (.xlsx) or CSV file'}
              </p>
              <p className="text-xs text-[#cfb7c8] mt-1">
                Drag and drop files here to parse customer records
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#cfb7c8] font-medium">Paste copied rows directly from spreadsheet:</span>
                <span className="text-[11px] text-[#dfb76c]">Tab-separated / Excel grid format</span>
              </div>
              <textarea
                rows={6}
                value={pasteData}
                onChange={(e) => setPasteData(e.target.value)}
                placeholder="Paste rows copied from Excel (Name, Phone, Place, Referred By)..."
                className="w-full text-xs font-mono p-3 bg-[#100911] border border-[#392233] focus:border-[#dfb76c] rounded-xl text-white placeholder:text-purple-400/50 focus:outline-none focus:ring-1 focus:ring-[#dfb76c]"
              />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <p className="text-[11px] text-[#cfb7c8]">
                  Click to parse columns, detect duplicates, and preview records before saving.
                </p>
                <button
                  type="button"
                  onClick={handleProcessPasted}
                  disabled={!pasteData.trim() || isProcessing}
                  className="px-4 py-2 bg-gradient-to-r from-[#fae2ab] to-[#f0cc85] hover:brightness-105 active:scale-95 text-[#1c1206] text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-40 shrink-0"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Parse Pasted Rows</span>
                </button>
              </div>
            </div>
          )}

          {errorNotice && (
            <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-xs text-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorNotice}</span>
            </div>
          )}

          {/* Parsed Preview Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex flex-wrap items-center justify-between text-xs border-b border-[#392233] pb-2 gap-2">
                <span className="font-bold text-white">Parsed Preview ({parsedRows.length} total rows)</span>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-emerald-400 font-semibold">{validCount} valid</span>
                  {dbDuplicatesCount > 0 && (
                    <span className="text-amber-300 font-semibold bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800">
                      {dbDuplicatesCount} in DB
                    </span>
                  )}
                  {invalidCount > 0 && (
                    <span className="text-rose-400 font-semibold">{invalidCount} invalid</span>
                  )}
                </div>
              </div>

              <div className="border border-[#392233] rounded-xl overflow-x-auto max-h-64 bg-[#100911]">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-[#100911] border-b border-[#392233] text-[#cfb7c8]">
                      <th className="py-2.5 px-3">Validation</th>
                      <th className="py-2.5 px-3">Name</th>
                      <th className="py-2.5 px-3">Phone</th>
                      <th className="py-2.5 px-3">Place</th>
                      <th className="py-2.5 px-3">Referred By</th>
                      <th className="py-2.5 px-3">Category</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-950/80">
                    {parsedRows.slice(0, 15).map((row, idx) => (
                      <tr key={idx} className={row.isValid ? 'hover:bg-[#261327]' : 'bg-rose-950/20'}>
                        <td className="py-2 px-3">
                          {row.duplicateType === 'database' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-amber-300 font-semibold px-2 py-0.5 rounded bg-amber-950 border border-amber-800" title={row.duplicateMatchName}>
                              <AlertTriangle className="w-3 h-3" />
                              <span>In DB</span>
                            </span>
                          ) : row.isValid ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                              <CheckCircle2 className="w-3 h-3" /> Fresh
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] text-rose-400 font-semibold">
                              <AlertCircle className="w-3 h-3" /> Invalid
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 font-semibold text-white">{row.name || '-'}</td>
                        <td className="py-2 px-3 text-[#faeed4] font-mono">{row.phone || '-'}</td>
                        <td className="py-2 px-3 text-[#cfb7c8]">{row.place || '-'}</td>
                        <td className="py-2 px-3 text-[#cfb7c8]">{row.referredBy || '-'}</td>
                        <td className="py-2 px-3 text-[#dfb76c]">{row.category || '-'}</td>
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
                  className="text-xs text-[#dfb76c] hover:text-white cursor-pointer"
                >
                  Clear Preview
                </button>
                <button
                  type="button"
                  disabled={validCount === 0 || isSubmitting || isProcessing}
                  onClick={handleConfirmImport}
                  className="flex items-center gap-2 py-2.5 px-6 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer active:scale-98"
                >
                  <span>
                    {isSubmitting
                      ? 'Importing...'
                      : `Confirm Import (${validCount} records)`}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
