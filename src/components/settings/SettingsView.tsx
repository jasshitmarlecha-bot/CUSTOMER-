import React, { useState, useEffect, useRef } from 'react';
import {
  Building,
  Save,
  Download,
  Database,
  Shield,
  MapPin,
  Phone,
  Mail,
  CheckCircle2,
  Trash2,
  Lock,
  Tag,
  AlertTriangle,
  RotateCcw,
  Sliders,
  Upload,
  RefreshCw
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
  businessName: 'GIRI JEWELLERS',
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
  qrWelcomeHeading: 'Welcome to GIRI JEWELLERS',
  qrSubtitle: 'Register your counter visit for bespoke assistance, hallmark warranty & exclusive festive previews',
  qrSuccessMessage: 'Thank you for visiting GIRI JEWELLERS! Your showroom visit details have been registered. Our jewellery specialist will assist you shortly.',
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
    businessName: businessName || storeSettings?.businessName || 'GIRI JEWELLERS'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

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
      if (onUpdateSettings) {
        await onUpdateSettings(settings);
      }
      if (settings.businessName && settings.businessName.trim() !== businessName) {
        onUpdateBusinessName(settings.businessName.trim());
      }
      setStatusMessage({
        type: 'success',
        text: 'Showroom settings and configurations saved successfully.'
      });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Failed to save settings. Please try again.'
      });
    } finally {
      setIsSaving(false);
    }
  };

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
    link.download = `${settings.businessName.toLowerCase().replace(/\s+/g, '_')}_backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setStatusMessage({
      type: 'success',
      text: `Database backup (${customers.length} records) downloaded successfully.`
    });
  };

  const handleExportExcelFullBackup = () => {
    const workbook = XLSX.utils.book_new();

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

    const catRows = categories.map((cat, i) => ({
      'S.No': i + 1,
      'Category ID': cat.id,
      'Category Name': cat.name,
      'Color Code': cat.color,
      'Description': cat.description || '-'
    }));
    const catSheet = XLSX.utils.json_to_sheet(catRows);
    XLSX.utils.book_append_sheet(workbook, catSheet, 'Categories');

    const settingRows = [
      { Parameter: 'Business Name', Value: settings.businessName },
      { Parameter: 'Tagline', Value: settings.tagline },
      { Parameter: 'Showroom Branch', Value: settings.branchName },
      { Parameter: 'Full Address', Value: settings.address },
      { Parameter: 'City & State', Value: `${settings.city}, ${settings.state} - ${settings.pincode}` },
      { Parameter: 'Official Contact Phone', Value: settings.phone },
      { Parameter: 'WhatsApp Support', Value: settings.whatsappPhone },
      { Parameter: 'Showroom Email', Value: settings.email },
      { Parameter: 'GSTIN Number', Value: settings.gstin },
      { Parameter: 'BIS Hallmark Number', Value: settings.bisHallmarkNumber }
    ];
    const settingSheet = XLSX.utils.json_to_sheet(settingRows);
    XLSX.utils.book_append_sheet(workbook, settingSheet, 'Settings');

    XLSX.writeFile(workbook, `${settings.businessName.toLowerCase().replace(/\s+/g, '_')}_complete_export_${new Date().toISOString().slice(0, 10)}.xlsx`);
    setStatusMessage({
      type: 'success',
      text: `Excel export completed successfully.`
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setIsRestoring(true);
        setStatusMessage(null);
        const content = event.target?.result as string;
        const backupData = JSON.parse(content);

        const result = await restoreSettingsBackup(backupData);
        setStatusMessage({
          type: 'success',
          text: result.message || 'Database restored successfully!'
        });
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } catch (err: any) {
        setStatusMessage({
          type: 'error',
          text: err.message || 'Failed to restore backup file. Please verify JSON file integrity.'
        });
      } finally {
        setIsRestoring(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const promptClearCustomers = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Reset Customer Directory',
      description: `Are you sure you want to remove all ${customers.length} customer records? This action cannot be undone.`,
      confirmText: 'Clear All Records',
      variant: 'danger',
      itemDetails: [
        { label: 'Total Records to Remove', value: `${customers.length} customers` },
        { label: 'Action Severity', value: 'Permanent deletion from local storage' }
      ],
      onConfirm: async () => {
        if (onClearAllCustomers) {
          await onClearAllCustomers();
          setStatusMessage({
            type: 'success',
            text: 'All customer records have been cleared from live storage.'
          });
        }
      }
    });
  };

  const promptClearQRData = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Reset QR Footfall Activity Logs',
      description: 'Clear past camera scan session records. Customer profiles will remain completely intact.',
      confirmText: 'Reset Activity Logs',
      variant: 'warning',
      onConfirm: async () => {
        if (onClearAllQRData) {
          await onClearAllQRData();
          setStatusMessage({
            type: 'success',
            text: 'QR scan session activity logs have been reset.'
          });
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Store & Showroom Settings
          </h1>
          <p className="text-xs text-[#8a919e] mt-1 max-w-2xl">
            Configure showroom identity, contact details, customer deduplication safeguards, and backup options.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportFullBackup}
            className="px-3 py-2 text-xs font-medium text-[#c0c6d2] hover:text-white bg-[#181b22] hover:bg-[#20242e] border border-[#262a34] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>JSON Backup</span>
          </button>
          <button
            type="button"
            onClick={() => handleSaveAll()}
            disabled={isSaving}
            className="px-4 py-2 bg-[#d4af37] hover:bg-[#e0bc45] active:bg-[#c29f2f] disabled:opacity-50 text-[#14161d] text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
          >
            {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </div>

      {/* Status Alert Notice */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${
            statusMessage.type === 'success'
              ? 'bg-[#122319] border-[#1e482f] text-[#86efac]'
              : 'bg-[#261316] border-[#4d1f25] text-[#fca5a5]'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-[#4ade80] shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-[#ef4444] shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* 2. Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 bg-[#14161d] p-1.5 rounded-xl border border-[#232732]">
        <button
          onClick={() => setActiveTab('identity')}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'identity'
              ? 'bg-[#1f222b] text-white font-semibold'
              : 'text-[#8a919e] hover:text-white'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>Showroom Identity</span>
        </button>

        <button
          onClick={() => setActiveTab('intake')}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'intake'
              ? 'bg-[#1f222b] text-white font-semibold'
              : 'text-[#8a919e] hover:text-white'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Deduplication & Rules</span>
        </button>

        <button
          onClick={() => setActiveTab('backup')}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'backup'
              ? 'bg-[#1f222b] text-white font-semibold'
              : 'text-[#8a919e] hover:text-white'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Backup & Restore</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'security'
              ? 'bg-[#1f222b] text-white font-semibold'
              : 'text-[#8a919e] hover:text-white'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Security & Master PIN</span>
        </button>
      </div>

      {/* 3. Settings Form Sections */}
      <form onSubmit={handleSaveAll} className="space-y-6">
        {/* TAB 1: SHOWROOM IDENTITY */}
        {activeTab === 'identity' && (
          <div className="bg-[#14161d] border border-[#232732] rounded-2xl p-6 space-y-6">
            <div className="border-b border-[#1f222a] pb-4">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Building className="w-4 h-4 text-[#d4af37]" />
                <span>Showroom Identity & Business Information</span>
              </h2>
              <p className="text-xs text-[#717886] mt-0.5">
                Official store details printed on customer summaries, exports, and receipts.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-medium text-[#c0c6d2] mb-1.5">
                  Jewellery Store Name *
                </label>
                <input
                  type="text"
                  required
                  value={settings.businessName}
                  onChange={(e) => handleFieldChange('businessName', e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-[#0e1014] border border-[#252832] rounded-lg text-white focus:outline-none focus:border-[#d4af37] font-semibold"
                  placeholder="e.g. Giri Jewellers"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#c0c6d2] mb-1.5">
                  Showroom Tagline
                </label>
                <input
                  type="text"
                  value={settings.tagline}
                  onChange={(e) => handleFieldChange('tagline', e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-[#0e1014] border border-[#252832] rounded-lg text-white focus:outline-none focus:border-[#d4af37]"
                  placeholder="e.g. Fine Gold, Diamond & Heritage Bridal Jewellery"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#c0c6d2] mb-1.5">
                  Branch / Landmark
                </label>
                <input
                  type="text"
                  value={settings.branchName}
                  onChange={(e) => handleFieldChange('branchName', e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-[#0e1014] border border-[#252832] rounded-lg text-white focus:outline-none focus:border-[#d4af37]"
                  placeholder="e.g. Trivandrum Flagship Showroom"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#c0c6d2] mb-1.5">
                  GSTIN Tax Registration Number
                </label>
                <input
                  type="text"
                  value={settings.gstin}
                  onChange={(e) => handleFieldChange('gstin', e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2 text-xs bg-[#0e1014] border border-[#252832] rounded-lg text-white font-mono focus:outline-none focus:border-[#d4af37] uppercase"
                  placeholder="e.g. 32AABCG1234F1Z9"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#c0c6d2] mb-1.5">
                  BIS Hallmark Licence / HUID
                </label>
                <input
                  type="text"
                  value={settings.bisHallmarkNumber}
                  onChange={(e) => handleFieldChange('bisHallmarkNumber', e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-[#0e1014] border border-[#252832] rounded-lg text-white font-mono focus:outline-none focus:border-[#d4af37]"
                  placeholder="e.g. HM/C-7849201"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#c0c6d2] mb-1.5">
                  Customer Support WhatsApp / Phone
                </label>
                <input
                  type="text"
                  value={settings.whatsappPhone}
                  onChange={(e) => handleFieldChange('whatsappPhone', e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-[#0e1014] border border-[#252832] rounded-lg text-white focus:outline-none focus:border-[#d4af37] font-mono"
                  placeholder="e.g. +91 98470 54321"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#c0c6d2] mb-1.5">
                  Showroom Email
                </label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-[#0e1014] border border-[#252832] rounded-lg text-white focus:outline-none focus:border-[#d4af37] font-mono"
                  placeholder="e.g. girijewelstvm@gmail.com"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#c0c6d2] mb-1.5">
                  Store Contact Landline
                </label>
                <input
                  type="text"
                  value={settings.phone}
                  onChange={(e) => handleFieldChange('phone', e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-[#0e1014] border border-[#252832] rounded-lg text-white focus:outline-none focus:border-[#d4af37] font-mono"
                  placeholder="e.g. +91 98470 54321"
                />
              </div>
            </div>

            {/* Address Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[#1f222a]">
              <div className="sm:col-span-3">
                <label className="block text-xs font-medium text-[#c0c6d2] mb-1.5">
                  Full Street Address
                </label>
                <input
                  type="text"
                  value={settings.address}
                  onChange={(e) => handleFieldChange('address', e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-[#0e1014] border border-[#252832] rounded-lg text-white focus:outline-none focus:border-[#d4af37]"
                  placeholder="e.g. MG Road, Overbridge Junction, East Fort"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#c0c6d2] mb-1.5">City</label>
                <input
                  type="text"
                  value={settings.city}
                  onChange={(e) => handleFieldChange('city', e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-[#0e1014] border border-[#252832] rounded-lg text-white focus:outline-none focus:border-[#d4af37]"
                  placeholder="e.g. Thiruvananthapuram"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#c0c6d2] mb-1.5">State</label>
                <input
                  type="text"
                  value={settings.state}
                  onChange={(e) => handleFieldChange('state', e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-[#0e1014] border border-[#252832] rounded-lg text-white focus:outline-none focus:border-[#d4af37]"
                  placeholder="e.g. Kerala"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#c0c6d2] mb-1.5">Pincode</label>
                <input
                  type="text"
                  value={settings.pincode}
                  onChange={(e) => handleFieldChange('pincode', e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-[#0e1014] border border-[#252832] rounded-lg text-white font-mono focus:outline-none focus:border-[#d4af37]"
                  placeholder="e.g. 695001"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: INTAKE & DEDUPLICATION */}
        {activeTab === 'intake' && (
          <div className="bg-[#14161d] border border-[#232732] rounded-2xl p-6 space-y-6">
            <div className="border-b border-[#1f222a] pb-4">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#d4af37]" />
                <span>Customer Deduplication & Counter Intake Rules</span>
              </h2>
              <p className="text-xs text-[#717886] mt-0.5">
                Prevent duplicate customer files across walk-in counters and bulk Excel imports.
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-[#0e1014] rounded-xl border border-[#252832] flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-white block">Duplicate Guard</span>
                  <span className="text-[11px] text-[#717886] block">
                    Automatically detect duplicate phone numbers & email addresses on entry
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enableDuplicateGuard}
                  onChange={(e) => handleFieldChange('enableDuplicateGuard', e.target.checked)}
                  className="w-4 h-4 accent-[#d4af37] rounded"
                />
              </div>

              <div className="p-4 bg-[#0e1014] rounded-xl border border-[#252832] flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-white block">Auto-Capitalize Names</span>
                  <span className="text-[11px] text-[#717886] block">
                    Automatically format customer names with proper title casing
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoFormatNames}
                  onChange={(e) => handleFieldChange('autoFormatNames', e.target.checked)}
                  className="w-4 h-4 accent-[#d4af37] rounded"
                />
              </div>

              <div className="p-4 bg-[#0e1014] rounded-xl border border-[#252832] flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-white block">Require Location / Town</span>
                  <span className="text-[11px] text-[#717886] block">
                    Prompt staff to enter customer locality or place for regional analytics
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.requireCityOnWalkin}
                  onChange={(e) => handleFieldChange('requireCityOnWalkin', e.target.checked)}
                  className="w-4 h-4 accent-[#d4af37] rounded"
                />
              </div>

              <div className="p-4 bg-[#0e1014] rounded-xl border border-[#252832] flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-white block">Anniversary & Birthday Tracking</span>
                  <span className="text-[11px] text-[#717886] block">
                    Collect customer anniversary / milestone date for jewellery gifting reminders
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.collectAnniversaryDate}
                  onChange={(e) => handleFieldChange('collectAnniversaryDate', e.target.checked)}
                  className="w-4 h-4 accent-[#d4af37] rounded"
                />
              </div>
            </div>

            {/* QR Standee Message Customization */}
            <div className="pt-4 border-t border-[#1f222a] space-y-4">
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                Counter QR Standee Customization
              </h3>

              <div>
                <label className="block text-xs font-medium text-[#c0c6d2] mb-1">
                  Standee Header Message
                </label>
                <input
                  type="text"
                  value={settings.qrWelcomeHeading}
                  onChange={(e) => handleFieldChange('qrWelcomeHeading', e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-[#0e1014] border border-[#252832] rounded-lg text-white focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#c0c6d2] mb-1">
                  Standee Tagline
                </label>
                <input
                  type="text"
                  value={settings.standeeTagline}
                  onChange={(e) => handleFieldChange('standeeTagline', e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-[#0e1014] border border-[#252832] rounded-lg text-white focus:outline-none focus:border-[#d4af37]"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: BACKUP & RESTORE */}
        {activeTab === 'backup' && (
          <div className="bg-[#14161d] border border-[#232732] rounded-2xl p-6 space-y-6">
            <div className="border-b border-[#1f222a] pb-4">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-[#d4af37]" />
                <span>Showroom Database Backup & Restore</span>
              </h2>
              <p className="text-xs text-[#717886] mt-0.5">
                Export complete offline database archives or restore from previous JSON backups.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 bg-[#0e1014] border border-[#252832] rounded-xl space-y-3">
                <h3 className="text-xs font-semibold text-white">Full JSON Database Archive</h3>
                <p className="text-xs text-[#717886]">
                  Download a complete backup including customers, jewellery categories, and store configurations.
                </p>
                <button
                  type="button"
                  onClick={handleExportFullBackup}
                  className="w-full py-2 px-3 text-xs font-medium bg-[#1e222b] hover:bg-[#272b36] text-white rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>Download JSON Archive</span>
                </button>
              </div>

              <div className="p-5 bg-[#0e1014] border border-[#252832] rounded-xl space-y-3">
                <h3 className="text-xs font-semibold text-white">Multi-Sheet Excel Roster</h3>
                <p className="text-xs text-[#717886]">
                  Download formatted .xlsx workbook with individual sheets for Customers, Categories, and Settings.
                </p>
                <button
                  type="button"
                  onClick={handleExportExcelFullBackup}
                  className="w-full py-2 px-3 text-xs font-medium bg-[#1e222b] hover:bg-[#272b36] text-white rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>Download Excel Workbook</span>
                </button>
              </div>
            </div>

            {/* Restore from File */}
            <div className="p-5 bg-[#0e1014] border border-[#252832] rounded-xl space-y-3">
              <h3 className="text-xs font-semibold text-white">Restore Database From Backup</h3>
              <p className="text-xs text-[#717886]">
                Upload a previously exported JSON backup file to restore records.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isRestoring}
                className="py-2 px-4 text-xs font-medium bg-[#1e222b] hover:bg-[#272b36] text-white rounded-lg transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Upload className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>{isRestoring ? 'Restoring records...' : 'Select Backup File (.json)'}</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: SECURITY & MASTER PIN */}
        {activeTab === 'security' && (
          <div className="bg-[#14161d] border border-[#232732] rounded-2xl p-6 space-y-6">
            <div className="border-b border-[#1f222a] pb-4">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#d4af37]" />
                <span>Security & Master Recovery PIN</span>
              </h2>
              <p className="text-xs text-[#717886] mt-0.5">
                Manage the Master PIN required for account recovery and sensitive deletion actions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-medium text-[#c0c6d2] mb-1.5">
                  Store Master Security Recovery PIN *
                </label>
                <input
                  type="text"
                  required
                  value={settings.masterSecurityPin}
                  onChange={(e) => handleFieldChange('masterSecurityPin', e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2 text-xs bg-[#0e1014] border border-[#252832] rounded-lg text-white font-mono focus:outline-none focus:border-[#d4af37] uppercase font-bold"
                  placeholder="e.g. GIRI-7788"
                />
                <span className="text-[11px] text-[#717886] mt-1 block">
                  Accepted for password resets and critical administrative overrides
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#c0c6d2] mb-1.5">
                  Counter Staff Export Permissions
                </label>
                <div className="p-3 bg-[#0e1014] rounded-lg border border-[#252832]">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.allowStaffExports}
                      onChange={(e) => handleFieldChange('allowStaffExports', e.target.checked)}
                      className="w-4 h-4 accent-[#d4af37] rounded"
                    />
                    <span className="text-xs text-[#c0c6d2]">
                      Permit counter staff to download customer Excel rosters
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* QR Scan Reset */}
            <div className="p-4 bg-[#0e1014] rounded-xl border border-[#252832] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-semibold text-white block">
                  Reset QR Activity Logs
                </span>
                <span className="text-[11px] text-[#717886] block">
                  Clear past QR scan visitor logs while preserving all customer profiles
                </span>
              </div>
              <button
                type="button"
                onClick={promptClearQRData}
                className="px-3 py-1.5 text-xs font-medium text-amber-300 hover:text-white bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/60 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Logs</span>
              </button>
            </div>

            {/* Danger Zone: Database Reset */}
            <div className="p-4 bg-rose-950/20 border border-rose-900/40 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <span>Danger Zone: Database Reset</span>
              </div>
              <p className="text-xs text-[#c0c6d2] leading-relaxed">
                Clear all {customers.length} customer records from live storage. Make sure to download a JSON backup first.
              </p>
              <button
                type="button"
                onClick={promptClearCustomers}
                className="px-3.5 py-2 bg-rose-700 hover:bg-rose-600 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All Customer Records ({customers.length})</span>
              </button>
            </div>
          </div>
        )}

        {/* Floating Bottom Save Action */}
        <div className="p-4 bg-[#14161d] border border-[#232732] rounded-xl flex items-center justify-between">
          <span className="text-xs text-[#717886]">
            Showroom changes take effect across all terminals immediately.
          </span>
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2 bg-[#d4af37] hover:bg-[#e0bc45] active:bg-[#c29f2f] disabled:opacity-50 text-[#14161d] text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
          >
            {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
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
