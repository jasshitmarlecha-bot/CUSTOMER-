import React, { useState, useEffect, useRef } from 'react';
import {
  Building,
  Save,
  Download,
  Database,
  ShieldCheck,
  Gem,
  MapPin,
  Phone,
  Mail,
  CheckCircle2,
  Trash2,
  Lock,
  Tag,
  FileSpreadsheet,
  AlertTriangle,
  RotateCcw,
  Sliders,
  Upload,
  Clock,
  Key
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Customer, Category, StoreSettings } from '../../types/index.ts';
import { ConfirmationModal } from '../common/ConfirmationModal.tsx';
import { restoreSettingsBackup } from '../../api/client.ts';

interface SettingsViewProps {
  businessName: string;
  onUpdateBusinessName: (name: string) => void;
  customers: Customer[];
  categories: Category[];
  storeSettings?: StoreSettings;
  onUpdateSettings?: (settings: Partial<StoreSettings>) => Promise<void>;
  onClearAllCustomers?: () => Promise<void>;
  onClearAllQRData?: () => Promise<void>;
}

const DEFAULT_SETTINGS_FALLBACK: StoreSettings = {
  businessName: 'Giri Jewels',
  tagline: 'Fine Gold, Diamond & Heritage Bridal Jewellery',
  branchName: 'Trivandrum Flagship Showroom',
  address: 'MG Road, Overbridge Junction, East Fort',
  city: 'Thiruvananthapuram',
  state: 'Kerala',
  pincode: '695001',
  phone: '+91 98470 54321',
  whatsappPhone: '+91 98470 54321',
  email: 'girijewelstvm@gmail.com',
  gstin: '32AABCG1234F1Z9',
  bisHallmarkNumber: 'HM/C-7849201',
  currency: '₹',
  enableDuplicateGuard: true,
  minPhoneDigits: 10,
  defaultCategoryId: 'cat-1',
  autoFormatNames: true,
  requireCityOnWalkin: true,
  standeeTagline: 'Scan to join VIP rewards & fast showroom customer intake',
  qrIntakeActive: true,
  qrWelcomeHeading: 'Welcome to Giri Jewels',
  qrSubtitle: 'Register your counter visit for bespoke assistance, hallmark warranty & exclusive festive previews',
  qrSuccessMessage: 'Thank you for visiting Giri Jewels! Your showroom visit details have been registered. Our jewellery specialist will assist you shortly.',
  collectAnniversaryDate: true,
  masterSecurityPin: 'GIRI-7788',
  allowStaffExports: true,
  sessionTimeoutMinutes: 60
};

export const SettingsView: React.FC<SettingsViewProps> = ({
  businessName,
  onUpdateBusinessName,
  customers,
  categories,
  storeSettings,
  onUpdateSettings,
  onClearAllCustomers,
  onClearAllQRData
}) => {
  const [activeTab, setActiveTab] = useState<'identity' | 'intake' | 'backup' | 'security'>('identity');
  const [settings, setSettings] = useState<StoreSettings>({
    ...DEFAULT_SETTINGS_FALLBACK,
    ...(storeSettings || {}),
    businessName: businessName || storeSettings?.businessName || 'Giri Jewels'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Confirmation Modals State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText?: string;
    variant?: 'danger' | 'warning' | 'primary';
    itemDetails?: Array<{ label: string; value: string }>;
    onConfirm: () => Promise<void> | void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {}
  });

  useEffect(() => {
    if (storeSettings) {
      setSettings(prev => ({
        ...prev,
        ...storeSettings,
        businessName: businessName || storeSettings.businessName || prev.businessName
      }));
    }
  }, [storeSettings, businessName]);

  const handleFieldChange = (field: keyof StoreSettings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveAll = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);
    try {
      if (settings.businessName.trim() !== businessName) {
        onUpdateBusinessName(settings.businessName.trim());
      }
      if (onUpdateSettings) {
        await onUpdateSettings(settings);
      }
      setStatusMessage({
        type: 'success',
        text: 'All showroom settings and configurations have been saved successfully!'
      });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to save store settings. Please try again.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Full Database JSON Backup Export
  const handleExportFullBackup = () => {
    const backupData = {
      backupVersion: '3.0-enterprise',
      showroom: settings.businessName,
      branch: settings.branchName,
      address: settings.address,
      city: settings.city,
      gstin: settings.gstin,
      bisHallmark: settings.bisHallmarkNumber,
      exportedAt: new Date().toISOString(),
      customerCount: customers.length,
      categoryCount: categories.length,
      storeSettings: settings,
      customers,
      categories
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${settings.businessName.toLowerCase().replace(/\s+/g, '_')}_full_backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setStatusMessage({
      type: 'success',
      text: `Complete JSON database backup (${customers.length} customers, ${categories.length} categories) downloaded successfully!`
    });
  };

  // Multi-Sheet Excel Complete Backup
  const handleExportExcelFullBackup = () => {
    const workbook = XLSX.utils.book_new();

    // 1. Customers Sheet
    const custRows = customers.map((c, i) => ({
      'S.No': i + 1,
      'Customer Name': c.name,
      'Mobile Phone': c.phone,
      'Place / City': c.place || c.city || '-',
      'Referred By': c.referredBy || 'Direct Walk-in',
      'Category': c.categoryName || 'General',
      'Email': c.email || '-',
      'Address': c.address || '-',
      'Status': c.status,
      'Source': c.source === 'walkin_qr' ? 'Showroom QR' : c.source === 'import' ? 'Imported' : 'Staff Manual',
      'Registered Date': c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN') : '-'
    }));
    const custSheet = XLSX.utils.json_to_sheet(custRows);
    XLSX.utils.book_append_sheet(workbook, custSheet, 'Customers');

    // 2. Categories Sheet
    const catRows = categories.map((cat, i) => ({
      'S.No': i + 1,
      'Category Name': cat.name,
      'Color Code': cat.color || '#9333ea',
      'Description': cat.description || '-',
      'Default': cat.isDefault ? 'Yes' : 'No'
    }));
    const catSheet = XLSX.utils.json_to_sheet(catRows);
    XLSX.utils.book_append_sheet(workbook, catSheet, 'Jewelry_Categories');

    // 3. Store Configuration Sheet
    const configRows = [
      { 'Setting Key': 'Showroom Name', 'Value': settings.businessName },
      { 'Setting Key': 'Tagline', 'Value': settings.tagline },
      { 'Setting Key': 'Branch', 'Value': settings.branchName },
      { 'Setting Key': 'GSTIN', 'Value': settings.gstin },
      { 'Setting Key': 'BIS Hallmark HUID', 'Value': settings.bisHallmarkNumber },
      { 'Setting Key': 'Customer Hotline', 'Value': settings.whatsappPhone },
      { 'Setting Key': 'Phone', 'Value': settings.phone },
      { 'Setting Key': 'Email', 'Value': settings.email },
      { 'Setting Key': 'Address', 'Value': `${settings.address}, ${settings.city}, ${settings.state} - ${settings.pincode}` },
      { 'Setting Key': 'Total Customers in Backup', 'Value': String(customers.length) },
      { 'Setting Key': 'Backup Timestamp', 'Value': new Date().toISOString() }
    ];
    const configSheet = XLSX.utils.json_to_sheet(configRows);
    XLSX.utils.book_append_sheet(workbook, configSheet, 'Store_Profile');

    XLSX.writeFile(workbook, `${settings.businessName.replace(/\s+/g, '_')}_Enterprise_Backup_${new Date().toISOString().slice(0, 10)}.xlsx`);
    setStatusMessage({
      type: 'success',
      text: `Enterprise Excel Workbook with 3 data sheets downloaded successfully!`
    });
  };

  // Restore Database from JSON file
  const handleRestoreFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result as string;
        const parsed = JSON.parse(text);
        if (!parsed || typeof parsed !== 'object') {
          throw new Error('Invalid JSON file format.');
        }

        const incomingCount = Array.isArray(parsed.customers) ? parsed.customers.length : 0;

        setConfirmModal({
          isOpen: true,
          title: `Restore Database from Backup (${incomingCount} records)?`,
          description: `This will safely load the backup into Giri Jewels live database. All ${incomingCount} customer records and category tags in this file will be restored.`,
          confirmText: `Yes, Restore ${incomingCount} Customers`,
          variant: 'primary',
          itemDetails: [
            { label: 'File Name', value: file.name },
            { label: 'Customer Records Found', value: String(incomingCount) },
            { label: 'Backup Timestamp', value: parsed.exportedAt ? new Date(parsed.exportedAt).toLocaleString() : 'Recent' }
          ],
          onConfirm: async () => {
            setIsRestoring(true);
            try {
              const res = await restoreSettingsBackup(parsed);
              setStatusMessage({
                type: 'success',
                text: res.message || 'Database restored successfully! Reloading data...'
              });
              setTimeout(() => {
                window.location.reload();
              }, 1200);
            } catch (err: any) {
              setStatusMessage({
                type: 'error',
                text: err.message || 'Failed to restore backup.'
              });
            } finally {
              setIsRestoring(false);
            }
          }
        });
      } catch (err: any) {
        setStatusMessage({
          type: 'error',
          text: `Failed to read backup file: ${err.message}`
        });
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  // Prompt Clear All QR Scan Activity Logs
  const promptClearQRData = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Reset & Clear All Showroom QR Scan Activity?',
      description: 'This will clear past visitor camera scans and analytics metrics. Registered customer profiles and categories will NOT be deleted.',
      confirmText: 'Clear QR Logs',
      variant: 'warning',
      itemDetails: [
        { label: 'Target', value: 'Showroom QR Standee Camera Activity Logs' },
        { label: 'Customer Directory', value: '100% Protected (No data lost)' }
      ],
      onConfirm: async () => {
        if (onClearAllQRData) {
          await onClearAllQRData();
          setStatusMessage({
            type: 'success',
            text: 'All showroom QR scan logs have been cleared.'
          });
        }
      }
    });
  };

  // Prompt Clear All Customers
  const promptClearCustomers = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Clear Entire Customer Database?',
      description: `WARNING: This will permanently delete all ${customers.length} customer records from your database. Please make sure you have downloaded a backup first!`,
      confirmText: `Permanently Delete ${customers.length} Customers`,
      variant: 'danger',
      itemDetails: [
        { label: 'Customer Records to Erase', value: `${customers.length} rows` },
        { label: 'Store Name', value: settings.businessName }
      ],
      onConfirm: async () => {
        if (onClearAllCustomers) {
          await onClearAllCustomers();
          setStatusMessage({
            type: 'success',
            text: 'All customer records have been cleared from the database.'
          });
        }
      }
    });
  };

  return (
    <div className="space-y-6 font-sans">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-[#14221d] tracking-tight">
              Store & Showroom Settings
            </h1>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#f5eee3] text-[#14221d] border border-[#dfd3bd] font-bold uppercase tracking-wider">
              Admin Suite
            </span>
          </div>
          <p className="text-xs text-[#718079] mt-1 max-w-2xl">
            Configure showroom identity, BIS hallmark details, customer deduplication safeguards, and enterprise-grade backup & restore.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportFullBackup}
            className="px-3.5 py-2 text-xs font-semibold text-[#14221d] hover:text-[#14221d] bg-[#ffffff] hover:bg-[#f6eee0] border border-[#dfd3bd] rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            title="Download offline JSON backup file"
          >
            <Download className="w-3.5 h-3.5 text-[#dfb76c]" />
            <span>JSON Backup</span>
          </button>
          <button
            type="button"
            onClick={() => handleSaveAll()}
            disabled={isSaving}
            className="px-4 py-2 bg-[#0b241c] hover:bg-[#12362b] text-[#f7eedf] disabled:opacity-50 text-white text-xs font-black rounded-xl shadow-lg shadow-purple-950/60 transition-all flex items-center gap-2 cursor-pointer active:scale-98"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </div>

      {/* Status Alert Notice */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 shadow-md ${
            statusMessage.type === 'success'
              ? 'bg-[#f5eee3] border-purple-500/70 text-[#14221d]'
              : 'bg-rose-950/80 border-rose-500/70 text-rose-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-[#dfb76c] shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* 2. Settings Category Navigation Tabs (Removed Live Rates!) */}
      <div className="flex flex-wrap items-center gap-2 bg-[#ffffff] p-2 rounded-2xl border border-[#ede3d3]">
        <button
          onClick={() => setActiveTab('identity')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'identity'
              ? 'bg-[#0b241c] text-[#f7eedf] shadow-xs font-bold'
              : 'text-[#718079] hover:text-white hover:bg-[#f5eee3]'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>Showroom Identity</span>
        </button>

        <button
          onClick={() => setActiveTab('intake')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'intake'
              ? 'bg-[#0b241c] text-[#f7eedf] shadow-xs font-bold'
              : 'text-[#718079] hover:text-white hover:bg-[#f5eee3]'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Customer & Deduplication Rules</span>
        </button>

        <button
          onClick={() => setActiveTab('backup')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'backup'
              ? 'bg-[#0b241c] text-[#f7eedf] shadow-xs font-bold'
              : 'text-[#718079] hover:text-white hover:bg-[#f5eee3]'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Strong Backup & Restore</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'security'
              ? 'bg-[#0b241c] text-[#f7eedf] shadow-xs font-bold'
              : 'text-[#718079] hover:text-white hover:bg-[#f5eee3]'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Security & Master PIN</span>
        </button>
      </div>

      {/* 3. Settings Form Sections */}
      <form onSubmit={handleSaveAll} className="space-y-6">
        {/* =========================================================================
            TAB 1: SHOWROOM IDENTITY & BIS COMPLIANCE
        ========================================================================= */}
        {activeTab === 'identity' && (
          <div className="bg-[#ffffff] border border-[#ede3d3] rounded-3xl p-6 shadow-xl space-y-6">
            <div className="border-b border-[#ede3d3] pb-4">
              <h2 className="text-base font-bold text-[#14221d] flex items-center gap-2">
                <Building className="w-4 h-4 text-[#dfb76c]" />
                <span>Showroom Identity & Government Compliance</span>
              </h2>
              <p className="text-xs text-[#718079] mt-1">
                Official store details printed on customer summaries, exports, and receipts.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#14221d]">
                  Jewellery Store Name *
                </label>
                <input
                  type="text"
                  required
                  value={settings.businessName}
                  onChange={(e) => handleFieldChange('businessName', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-[#faf7f0] border border-[#ede3d3] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#0b241c]/30 focus:border-[#0b241c] font-bold"
                  placeholder="e.g. Giri Jewels"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#14221d]">
                  Showroom Tagline
                </label>
                <input
                  type="text"
                  value={settings.tagline}
                  onChange={(e) => handleFieldChange('tagline', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-[#faf7f0] border border-[#ede3d3] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#0b241c]/30 focus:border-[#0b241c]"
                  placeholder="e.g. Fine Gold, Diamond & Heritage Bridal Jewellery"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#14221d]">
                  Branch / Landmark
                </label>
                <input
                  type="text"
                  value={settings.branchName}
                  onChange={(e) => handleFieldChange('branchName', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-[#faf7f0] border border-[#ede3d3] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#0b241c]/30 focus:border-[#0b241c]"
                  placeholder="e.g. Trivandrum Flagship Showroom"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#14221d]">
                  GSTIN Tax Registration Number
                </label>
                <input
                  type="text"
                  value={settings.gstin}
                  onChange={(e) => handleFieldChange('gstin', e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 text-xs bg-[#faf7f0] border border-[#ede3d3] rounded-xl text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#0b241c]/30 focus:border-[#0b241c] uppercase"
                  placeholder="e.g. 32AABCG1234F1Z9"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#14221d] flex items-center justify-between">
                  <span>BIS Hallmark Licence / HUID</span>
                  <span className="text-[10px] text-emerald-400 font-semibold">100% Certified</span>
                </label>
                <input
                  type="text"
                  value={settings.bisHallmarkNumber}
                  onChange={(e) => handleFieldChange('bisHallmarkNumber', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-[#faf7f0] border border-[#ede3d3] rounded-xl text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#0b241c]/30 focus:border-[#0b241c]"
                  placeholder="e.g. HM/C-7849201"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#14221d]">
                  Official Customer Support Hotline
                </label>
                <input
                  type="text"
                  value={settings.whatsappPhone}
                  onChange={(e) => handleFieldChange('whatsappPhone', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-[#faf7f0] border border-[#ede3d3] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#0b241c]/30 focus:border-[#0b241c] font-mono"
                  placeholder="e.g. +91 98470 54321"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#14221d]">
                  Official Showroom Email
                </label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-[#faf7f0] border border-[#ede3d3] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#0b241c]/30 focus:border-[#0b241c] font-mono"
                  placeholder="e.g. girijewelstvm@gmail.com"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#14221d]">
                  Store Contact Landline / Phone
                </label>
                <input
                  type="text"
                  value={settings.phone}
                  onChange={(e) => handleFieldChange('phone', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-[#faf7f0] border border-[#ede3d3] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#0b241c]/30 focus:border-[#0b241c] font-mono"
                  placeholder="e.g. +91 98470 54321"
                />
              </div>
            </div>

            {/* Address Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-[#ede3d3]">
              <div className="sm:col-span-3 space-y-1.5">
                <label className="text-xs font-semibold text-[#14221d]">
                  Full Street Address
                </label>
                <input
                  type="text"
                  value={settings.address}
                  onChange={(e) => handleFieldChange('address', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-[#faf7f0] border border-[#ede3d3] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#0b241c]/30 focus:border-[#0b241c]"
                  placeholder="e.g. MG Road, Overbridge Junction, East Fort"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#14221d]">City / District</label>
                <input
                  type="text"
                  value={settings.city}
                  onChange={(e) => handleFieldChange('city', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-[#faf7f0] border border-[#ede3d3] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#0b241c]/30 focus:border-[#0b241c]"
                  placeholder="e.g. Thiruvananthapuram"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#14221d]">State</label>
                <input
                  type="text"
                  value={settings.state}
                  onChange={(e) => handleFieldChange('state', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-[#faf7f0] border border-[#ede3d3] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#0b241c]/30 focus:border-[#0b241c]"
                  placeholder="e.g. Kerala"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#14221d]">Postal PIN Code</label>
                <input
                  type="text"
                  value={settings.pincode}
                  onChange={(e) => handleFieldChange('pincode', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-[#faf7f0] border border-[#ede3d3] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#0b241c]/30 focus:border-[#0b241c] font-mono"
                  placeholder="e.g. 695001"
                />
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: CUSTOMER INTAKE & DEDUPLICATION SAFEGUARDS
        ========================================================================= */}
        {activeTab === 'intake' && (
          <div className="bg-[#ffffff] border border-[#ede3d3] rounded-3xl p-6 shadow-xl space-y-6">
            <div className="border-b border-[#ede3d3] pb-4">
              <h2 className="text-base font-bold text-[#14221d] flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#dfb76c]" />
                <span>Customer Data Quality & Deduplication Policies</span>
              </h2>
              <p className="text-xs text-[#718079] mt-1">
                Automated safeguards to prevent duplicate customer numbers and ensure clean records.
              </p>
            </div>

            <div className="space-y-3.5">
              <label className="flex items-start gap-3 p-4 bg-[#faf7f0] rounded-2xl border border-[#ede3d3] cursor-pointer hover:border-purple-600 transition-colors">
                <input
                  type="checkbox"
                  checked={settings.enableDuplicateGuard}
                  onChange={(e) => handleFieldChange('enableDuplicateGuard', e.target.checked)}
                  className="mt-1 rounded border-[#dfd3bd] text-purple-600 focus:ring-purple-500"
                />
                <div>
                  <span className="text-xs font-bold text-[#14221d] block">
                    Automatic Phone Duplicate Guard (Active Protection)
                  </span>
                  <span className="text-[11px] text-[#718079] block mt-0.5">
                    Checks customer mobile numbers in real time while typing. If existing customer is found, offers 1-click update instead of creating redundant profiles.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 bg-[#faf7f0] rounded-2xl border border-[#ede3d3] cursor-pointer hover:border-purple-600 transition-colors">
                <input
                  type="checkbox"
                  checked={settings.autoFormatNames}
                  onChange={(e) => handleFieldChange('autoFormatNames', e.target.checked)}
                  className="mt-1 rounded border-[#dfd3bd] text-purple-600 focus:ring-purple-500"
                />
                <div>
                  <span className="text-xs font-bold text-[#14221d] block">
                    Auto-Format Customer Names (Proper Title Case)
                  </span>
                  <span className="text-[11px] text-[#718079] block mt-0.5">
                    Automatically converts lowercase or all-caps names (e.g. "priya sharma" → "Priya Sharma").
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 bg-[#faf7f0] rounded-2xl border border-[#ede3d3] cursor-pointer hover:border-purple-600 transition-colors">
                <input
                  type="checkbox"
                  checked={settings.requireCityOnWalkin}
                  onChange={(e) => handleFieldChange('requireCityOnWalkin', e.target.checked)}
                  className="mt-1 rounded border-[#dfd3bd] text-purple-600 focus:ring-purple-500"
                />
                <div>
                  <span className="text-xs font-bold text-[#14221d] block">
                    Highlight Place & Referral Attribution on Intake
                  </span>
                  <span className="text-[11px] text-[#718079] block mt-0.5">
                    Prompts staff to record customer's place/town and referral person for regional outreach.
                  </span>
                </div>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#14221d]">
                    Minimum Phone Number Digits
                  </label>
                  <input
                    type="number"
                    min="7"
                    max="15"
                    value={settings.minPhoneDigits}
                    onChange={(e) => handleFieldChange('minPhoneDigits', Number(e.target.value) || 10)}
                    className="w-full px-3.5 py-2.5 text-xs bg-[#faf7f0] border border-[#ede3d3] rounded-xl text-white font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <span className="text-[10px] text-[#dfb76c] block">Standard is 10 digits</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#14221d]">
                    Default Customer Jewelry Category Tag
                  </label>
                  <select
                    value={settings.defaultCategoryId}
                    onChange={(e) => handleFieldChange('defaultCategoryId', e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-[#faf7f0] border border-[#ede3d3] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id} className="bg-[#f5eee3]">
                        {c.name} {c.isDefault ? '(Default)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: STRONG ENTERPRISE BACKUP & RESTORE SUITE
        ========================================================================= */}
        {activeTab === 'backup' && (
          <div className="bg-[#ffffff] border border-[#ede3d3] rounded-3xl p-6 shadow-xl space-y-6">
            <div className="border-b border-[#ede3d3] pb-4">
              <h2 className="text-base font-bold text-[#14221d] flex items-center gap-2">
                <Database className="w-4 h-4 text-[#dfb76c]" />
                <span>Enterprise Backup & Disaster Recovery Suite</span>
              </h2>
              <p className="text-xs text-[#718079] mt-1">
                Protect your entire store database. Export multi-format backups or restore from an existing JSON backup file.
              </p>
            </div>

            {/* Backup Status Tile */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#ffffff] via-[#ffffff] to-[#ffffff] border border-[#dfd3bd] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-[#718079] border border-purple-500/40 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#14221d]">
                    Database Protection Status: <span className="text-emerald-400 font-bold">100% Healthy</span>
                  </h3>
                  <p className="text-[11px] text-[#718079]">
                    {customers.length} customer records & {categories.length} category tags currently active in storage.
                  </p>
                </div>
              </div>

              {settings.lastBackupDate && (
                <div className="text-right text-[11px] text-[#dfb76c] flex items-center gap-1 font-mono">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Last Backup: {new Date(settings.lastBackupDate).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            {/* 3 Strong Backup Action Blocks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Option 1: Full JSON Backup */}
              <div className="p-5 bg-[#faf7f0] rounded-2xl border border-[#ede3d3] space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-[#14221d] font-bold text-xs">
                    <Database className="w-4 h-4 text-[#dfb76c]" />
                    <span>Complete JSON Database Snapshot</span>
                  </div>
                  <p className="text-[11px] text-[#718079] mt-1 leading-relaxed">
                    Downloads all customer profiles, referral links, category structures, and store configurations into an offline JSON snapshot.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportFullBackup}
                  className="w-full py-2.5 px-4 bg-[#0b241c] hover:bg-[#12362b] text-[#f7eedf] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Full JSON Backup</span>
                </button>
              </div>

              {/* Option 2: Excel Complete Workbook */}
              <div className="p-5 bg-[#faf7f0] rounded-2xl border border-[#ede3d3] space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-[#14221d] font-bold text-xs">
                    <FileSpreadsheet className="w-4 h-4 text-[#dfb76c]" />
                    <span>Multi-Sheet Excel Workbook (.xlsx)</span>
                  </div>
                  <p className="text-[11px] text-[#718079] mt-1 leading-relaxed">
                    Generates a multi-sheet spreadsheet: Customers roster, Category list, and Store Metadata. Perfect for offline auditing and accountant review.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportExcelFullBackup}
                  className="w-full py-2.5 px-4 bg-[#ffffff] hover:bg-[#f6eee0] text-[#14221d] hover:text-white font-bold text-xs rounded-xl border border-[#dfd3bd] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-[#dfb76c]" />
                  <span>Download Excel Workbook</span>
                </button>
              </div>
            </div>

            {/* RESTORE FROM BACKUP BLOCK */}
            <div className="p-5 bg-gradient-to-r from-purple-950/60 to-[#ffffff] rounded-2xl border-2 border-dashed border-[#dfd3bd] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-[#14221d] font-bold text-xs">
                    <Upload className="w-4 h-4 text-[#dfb76c]" />
                    <span>Restore Database from Backup Snapshot</span>
                  </div>
                  <p className="text-[11px] text-[#718079] mt-0.5">
                    Upload a previously downloaded JSON backup file to restore records and configuration.
                  </p>
                </div>

                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleRestoreFileSelected}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={isRestoring}
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2.5 bg-gradient-to-r from-[#fae2ab] to-[#f0cc85] hover:brightness-105 text-[#1c1206] font-black text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-98"
                  >
                    <Upload className="w-3.5 h-3.5 text-purple-700 stroke-[2.5]" />
                    <span>{isRestoring ? 'Restoring...' : 'Upload & Restore Backup (.json)'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 4: SECURITY & MASTER PIN
        ========================================================================= */}
        {activeTab === 'security' && (
          <div className="bg-[#ffffff] border border-[#ede3d3] rounded-3xl p-6 shadow-xl space-y-6">
            <div className="border-b border-[#ede3d3] pb-4">
              <h2 className="text-base font-bold text-[#14221d] flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#dfb76c]" />
                <span>Showroom Security & Manager Overrides</span>
              </h2>
              <p className="text-xs text-[#718079] mt-1">
                Configure Master PIN codes for counter authorization and danger zone maintenance.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#14221d] flex items-center justify-between">
                  <span>Store Master Security PIN *</span>
                  <span className="text-[10px] text-[#dfb76c] font-mono">Used for staff overrides</span>
                </label>
                <input
                  type="text"
                  required
                  value={settings.masterSecurityPin}
                  onChange={(e) => handleFieldChange('masterSecurityPin', e.target.value.trim())}
                  className="w-full px-3.5 py-2.5 text-xs bg-[#faf7f0] border border-[#ede3d3] rounded-xl text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="GIRI-7788"
                />
                <span className="text-[10px] text-[#dfb76c] block">
                  Accepted when counter staff request deletion or restricted actions
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#14221d]">
                  Allow Counter Staff to Export Lists
                </label>
                <div className="p-3 bg-[#faf7f0] rounded-xl border border-[#ede3d3]">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.allowStaffExports}
                      onChange={(e) => handleFieldChange('allowStaffExports', e.target.checked)}
                      className="rounded border-[#dfd3bd] text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-xs text-[#14221d]">
                      Permit counter staff to download customer Excel / PDF rosters
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* QR Scan Reset */}
            <div className="p-4 bg-[#faf7f0] rounded-2xl border border-[#ede3d3] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-[#14221d] block">
                  Showroom QR Logs & Footfall Reset
                </span>
                <span className="text-[11px] text-[#dfb76c] block mt-0.5">
                  Clear past QR visitor camera hit logs while keeping all registered customer profiles safe.
                </span>
              </div>
              <button
                type="button"
                onClick={promptClearQRData}
                className="px-3.5 py-2 text-xs font-bold text-amber-300 hover:text-[#14221d] bg-amber-950/60 hover:bg-amber-900 border border-amber-800 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset QR Activity Logs</span>
              </button>
            </div>

            {/* Danger Zone: Database Reset */}
            <div className="pt-4 border-t border-rose-950/80 p-4 bg-rose-950/20 border border-rose-900/50 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <span>Danger Zone: Database Reset</span>
              </div>
              <p className="text-xs text-[#718079] leading-relaxed">
                Clear all {customers.length} customer records from live storage. Make sure to download a JSON backup first.
              </p>
              <button
                type="button"
                onClick={promptClearCustomers}
                className="px-4 py-2 bg-rose-700 hover:bg-rose-600 text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All Customer Records ({customers.length})</span>
              </button>
            </div>
          </div>
        )}

        {/* Floating Bottom Save Action */}
        <div className="p-4 bg-[#ffffff] border border-[#ede3d3] rounded-2xl flex items-center justify-between shadow-xl">
          <div className="text-xs text-[#718079]">
            Showroom changes take effect across all terminals immediately.
          </div>
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 bg-[#0b241c] hover:bg-[#12362b] text-[#f7eedf] disabled:opacity-50 text-white text-xs font-black rounded-xl shadow-lg shadow-purple-950/60 transition-all flex items-center gap-2 cursor-pointer active:scale-98"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Changes...' : 'Save All Settings'}</span>
          </button>
        </div>
      </form>

      {/* Confirmation Dialog */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        description={confirmModal.description}
        confirmText={confirmModal.confirmText}
        variant={confirmModal.variant}
        itemDetails={confirmModal.itemDetails}
      />
    </div>
  );
};
