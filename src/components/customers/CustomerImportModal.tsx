import React, { useState, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  X,
  HelpCircle,
  ArrowRight
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface CustomerImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (customers: Array<{
    name: string;
    phone: string;
    email?: string;
    category?: string;
    address?: string;
    city?: string;
    place?: string;
    referredBy?: string;
    status?: 'active' | 'lead' | 'inactive';
  }>) => Promise<{ importedCount: number; errors: string[] }>;
}

interface ParsedCustomerRow {
  name: string;
  phone: string;
  email?: string;
  category?: string;
  address?: string;
  city?: string;
  place?: string;
  referredBy?: string;
  status: 'active' | 'lead' | 'inactive';
  isValid: boolean;
  validationError?: string;
}

export const CustomerImportModal: React.FC<CustomerImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedCustomerRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [pasteData, setPasteData] = useState('');
  const [importMode, setImportMode] = useState<'upload' | 'paste'>('upload');
  const [importResult, setImportResult] = useState<{ importedCount: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Generate and download a sample template
  const handleDownloadTemplate = (format: 'xlsx' | 'csv') => {
    const templateData = [
      {
        Name: 'Priya Sharma',
        Phone: '9845012345',
        Email: 'priya.sharma@example.com',
        Category: 'Bridal Gold',
        Place: 'Indiranagar, Bangalore',
        ReferredBy: 'Ramesh Gupta',
        Address: '42 MG Road',
        City: 'Bangalore',
        Status: 'active'
      },
      {
        Name: 'Rajesh Verma',
        Phone: '9876543210',
        Email: 'rajesh.v@example.com',
        Category: 'Silver Articles',
        Place: 'Bandra, Mumbai',
        ReferredBy: 'Instagram Ad',
        Address: '7th Cross',
        City: 'Mumbai',
        Status: 'lead'
      },
      {
        Name: 'Ananya Nair',
        Phone: '9123456789',
        Email: 'ananya@example.com',
        Category: 'Diamond Solitaire',
        Place: 'Panampilly Nagar, Kochi',
        ReferredBy: 'Dr. Suresh Kumar',
        Address: 'Marine Drive',
        City: 'Kochi',
        Status: 'active'
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

    for (const r of rows) {
      const keys = Object.keys(r);
      const findKey = (candidates: string[]) => {
        const found = keys.find(k => candidates.includes(k.trim().toLowerCase()));
        return found ? String(r[found] || '').trim() : '';
      };

      const name = findKey(['name', 'customer name', 'full name', 'client']);
      const phone = findKey(['phone', 'mobile', 'phone number', 'contact', 'telephone', 'mobile number']);
      const email = findKey(['email', 'email address', 'mail']);
      const category = findKey(['category', 'category name', 'type', 'group']);
      const place = findKey(['place', 'location', 'area', 'town', 'native']);
      const referredBy = findKey(['referred by', 'referredby', 'reference', 'referral', 'referred_by', 'ref by']);
      const address = findKey(['address', 'street', 'locality']);
      const city = findKey(['city', 'district']);
      const rawStatus = findKey(['status', 'state']).toLowerCase();

      let status: 'active' | 'lead' | 'inactive' = 'active';
      if (rawStatus === 'lead') status = 'lead';
      else if (rawStatus === 'inactive') status = 'inactive';

      const isValid = Boolean(name && phone && phone.replace(/\D/g, '').length >= 7);
      let validationError: string | undefined;
      if (!name) validationError = 'Missing name';
      else if (!phone) validationError = 'Missing phone number';
      else if (phone.replace(/\D/g, '').length < 7) validationError = 'Phone number is too short';

      parsed.push({
        name,
        phone,
        email: email || undefined,
        category: category || undefined,
        place: place || city || undefined,
        referredBy: referredBy || undefined,
        address: address || undefined,
        city: city || undefined,
        status,
        isValid,
        validationError
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
      const result = await onImportComplete(validRows);
      setImportResult(result);
    } catch (err: any) {
      setErrorNotice(err.message || 'Import failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const validCount = parsedRows.filter(r => r.isValid).length;
  const invalidCount = parsedRows.length - validCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#160d16] border border-[#392233] rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-[#392233] flex items-center justify-between bg-[#1d121c]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-[#cfb7c8]">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Import Outside Customer Data</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#261327] text-[#cfb7c8] border border-[#482c40]">
                  Excel & CSV
                </span>
              </h2>
              <p className="text-xs text-[#cfb7c8]">
                Bulk upload customer records including place and referral attribution.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#cfb7c8] hover:text-white p-1 rounded-lg hover:bg-[#281829] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 bg-[#160d16]">
          {importResult ? (
            /* Success Summary View */
            <div className="p-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white">Import Complete!</h3>
              <p className="text-sm text-[#faeed4]">
                Successfully imported <span className="text-emerald-400 font-bold">{importResult.importedCount}</span> customer records into Giri Jewels database.
              </p>
              {importResult.errors && importResult.errors.length > 0 && (
                <div className="p-3 bg-[#261327] border border-[#392233] rounded-xl text-xs text-[#faeed4] text-left max-h-32 overflow-y-auto space-y-1">
                  <p className="font-semibold text-rose-400">Skipped rows:</p>
                  {importResult.errors.map((e, idx) => (
                    <p key={idx} className="text-[#cfb7c8]">• {e}</p>
                  ))}
                </div>
              )}
              <button
                onClick={onClose}
                className="py-2.5 px-6 bg-gradient-to-r from-[#fae2ab] to-[#f0cc85] hover:brightness-105 text-[#1c1206] font-bold text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                Close & View Directory
              </button>
            </div>
          ) : (
            <>
              {/* PARTICULAR FORMAT SPECIFICATION & GUIDELINES */}
              <div className="bg-black/40 rounded-xl p-4 border border-[#392233] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#cfb7c8]">
                    <HelpCircle className="w-4 h-4" />
                    <span>Required Import Format Specifications</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDownloadTemplate('xlsx')}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-[#faeed4] bg-[#261327] hover:bg-[#281829] border border-[#482c40] rounded-lg transition-colors cursor-pointer"
                    >
                      <Download className="w-3 h-3 text-[#dfb76c]" />
                      <span>Download Sample Excel (.xlsx)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadTemplate('csv')}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-[#faeed4] bg-[#261327] hover:bg-[#281829] border border-[#482c40] rounded-lg transition-colors cursor-pointer"
                    >
                      <Download className="w-3 h-3 text-[#dfb76c]" />
                      <span>Download Sample (.csv)</span>
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-[#cfb7c8]">
                  Your Excel or CSV spreadsheet must have a header row with the following column names:
                </p>

                {/* Format Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead>
                      <tr className="border-b border-[#392233] text-[#cfb7c8]">
                        <th className="py-1 px-2 font-semibold">Column Name</th>
                        <th className="py-1 px-2 font-semibold">Requirement</th>
                        <th className="py-1 px-2 font-semibold">Example Value</th>
                        <th className="py-1 px-2 font-semibold">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-900/30 text-[#faeed4]">
                      <tr>
                        <td className="py-1.5 px-2 font-mono text-[#cfb7c8] font-bold">Name</td>
                        <td className="py-1.5 px-2 text-rose-400 font-semibold">Required</td>
                        <td className="py-1.5 px-2 text-white">Priya Sharma</td>
                        <td className="py-1.5 px-2 text-purple-400/80">Customer's full name</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-2 font-mono text-[#cfb7c8] font-bold">Phone</td>
                        <td className="py-1.5 px-2 text-rose-400 font-semibold">Required</td>
                        <td className="py-1.5 px-2 font-mono text-white">9845012345</td>
                        <td className="py-1.5 px-2 text-purple-400/80">Primary mobile number (10 digits)</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-2 font-mono text-[#cfb7c8] font-bold">Place</td>
                        <td className="py-1.5 px-2 text-[#cfb7c8] font-semibold">Recommended</td>
                        <td className="py-1.5 px-2 text-white">Indiranagar, Bangalore</td>
                        <td className="py-1.5 px-2 text-purple-400/80">Customer's native place or town</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-2 font-mono text-[#cfb7c8] font-bold">ReferredBy</td>
                        <td className="py-1.5 px-2 text-[#cfb7c8] font-semibold">Recommended</td>
                        <td className="py-1.5 px-2 text-white">Ramesh Gupta</td>
                        <td className="py-1.5 px-2 text-purple-400/80">Referred person or lead source</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-2 font-mono text-[#faeed4]">Email</td>
                        <td className="py-1.5 px-2 text-purple-400/70">Optional</td>
                        <td className="py-1.5 px-2 text-white">priya@example.com</td>
                        <td className="py-1.5 px-2 text-purple-400/80">Customer email address</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-2 font-mono text-[#faeed4]">Category</td>
                        <td className="py-1.5 px-2 text-purple-400/70">Optional</td>
                        <td className="py-1.5 px-2 text-white">Bridal Gold</td>
                        <td className="py-1.5 px-2 text-purple-400/80">Auto-matches or creates category</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-2 font-mono text-[#faeed4]">Status</td>
                        <td className="py-1.5 px-2 text-purple-400/70">Optional</td>
                        <td className="py-1.5 px-2 text-white">active</td>
                        <td className="py-1.5 px-2 text-purple-400/80">active, lead, or inactive (defaults to active)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Upload or Paste Selector */}
              <div className="flex items-center gap-2 border-b border-[#392233] pb-2">
                <button
                  type="button"
                  onClick={() => setImportMode('upload')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    importMode === 'upload'
                      ? 'bg-purple-600 text-white font-bold'
                      : 'text-[#cfb7c8] hover:text-white'
                  }`}
                >
                  Upload File (.xlsx / .csv)
                </button>
                <button
                  type="button"
                  onClick={() => setImportMode('paste')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    importMode === 'paste'
                      ? 'bg-purple-600 text-white font-bold'
                      : 'text-[#cfb7c8] hover:text-white'
                  }`}
                >
                  Paste Data Directly
                </button>
              </div>

              {importMode === 'upload' ? (
                /* Dropzone */
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#392233] hover:border-purple-500 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-[#261327] hover:bg-[#261327]"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Upload className="w-8 h-8 text-[#dfb76c] mx-auto mb-2" />
                  <p className="text-xs font-semibold text-white">
                    {file ? file.name : 'Click to select Excel (.xlsx) or CSV file'}
                  </p>
                  <p className="text-[11px] text-[#cfb7c8] mt-1">
                    Drag and drop file here or click to browse
                  </p>
                </div>
              ) : (
                /* Paste Box */
                <div className="space-y-2">
                  <textarea
                    rows={4}
                    value={pasteData}
                    onChange={(e) => setPasteData(e.target.value)}
                    placeholder="Paste rows copied from Excel or CSV here..."
                    className="w-full text-xs font-mono p-3 bg-black/40 border border-[#392233] rounded-xl text-white placeholder:text-purple-400/40 focus:outline-none focus:border-purple-400"
                  />
                  <button
                    type="button"
                    onClick={handleProcessPasted}
                    className="px-3.5 py-1.5 bg-[#261327] hover:bg-[#281829] text-[#faeed4] text-xs font-semibold rounded-lg border border-[#482c40] cursor-pointer"
                  >
                    Parse Pasted Text
                  </button>
                </div>
              )}

              {errorNotice && (
                <div className="p-3 bg-red-950/80 border border-red-800 rounded-xl text-xs text-red-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{errorNotice}</span>
                </div>
              )}

              {/* Data Preview */}
              {parsedRows.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">Parsed Preview ({parsedRows.length} total rows)</span>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-semibold">{validCount} valid</span>
                      {invalidCount > 0 && (
                        <span className="text-rose-400 font-semibold">{invalidCount} invalid</span>
                      )}
                    </div>
                  </div>

                  <div className="border border-[#392233] rounded-xl overflow-x-auto max-h-56 bg-black/40">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-[#1d121c] border-b border-[#392233] text-[#cfb7c8]">
                          <th className="py-2 px-3">Status</th>
                          <th className="py-2 px-3">Name</th>
                          <th className="py-2 px-3">Phone</th>
                          <th className="py-2 px-3">Place</th>
                          <th className="py-2 px-3">Referred By</th>
                          <th className="py-2 px-3">Category</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-purple-900/30">
                        {parsedRows.slice(0, 15).map((row, idx) => (
                          <tr key={idx} className={row.isValid ? 'hover:bg-[#261327]' : 'bg-red-950/20'}>
                            <td className="py-1.5 px-3">
                              {row.isValid ? (
                                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                                  <CheckCircle2 className="w-3 h-3" /> Valid
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] text-rose-400 font-semibold" title={row.validationError}>
                                  <AlertCircle className="w-3 h-3" /> {row.validationError || 'Invalid'}
                                </span>
                              )}
                            </td>
                            <td className="py-1.5 px-3 font-medium text-white">{row.name || '-'}</td>
                            <td className="py-1.5 px-3 text-[#faeed4] font-mono">{row.phone || '-'}</td>
                            <td className="py-1.5 px-3 text-[#faeed4]">{row.place || '-'}</td>
                            <td className="py-1.5 px-3 text-[#cfb7c8]">{row.referredBy || '-'}</td>
                            <td className="py-1.5 px-3 text-[#dfb76c]">{row.category || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {parsedRows.length > 15 && (
                    <p className="text-[11px] text-[#cfb7c8] text-center">
                      Showing first 15 of {parsedRows.length} rows
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        {!importResult && (
          <div className="p-4 border-t border-[#392233] flex items-center justify-between bg-[#1d121c]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#cfb7c8] hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={validCount === 0 || isSubmitting || isProcessing}
              onClick={handleConfirmImport}
              className="flex items-center gap-2 py-2 px-5 bg-gradient-to-r from-[#fae2ab] to-[#f0cc85] hover:brightness-105 text-[#1c1206] font-bold disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              <span>{isSubmitting ? 'Importing...' : `Confirm Import (${validCount} records)`}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
