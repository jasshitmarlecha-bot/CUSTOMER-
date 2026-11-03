export type UserRole = 'admin' | 'manager' | 'staff';

export interface StaffPermissions {
  canViewCustomers: boolean;
  canAddEditCustomers: boolean;
  canDeleteCustomers: boolean;
  canExportData: boolean;
  canImportData: boolean;
  canPrintData: boolean;
  canManageCategories: boolean;
  canRunCleaning: boolean;
  canViewAnalytics: boolean;
  canViewCommonQR: boolean;
}

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password?: string;
  phone?: string;
  avatar?: string;
  token?: string;
  permissions?: StaffPermissions;
  createdAt?: string;
}

export interface Category {
  id: string;
  name: string;
  color?: string;
  description?: string;
  isDefault?: boolean;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  categoryId?: string;
  categoryName?: string;
  address?: string;
  city?: string;
  place?: string;
  referredBy?: string;
  notes?: string;
  tags?: string[];
  status: 'active' | 'lead' | 'inactive';
  source: 'walkin_qr' | 'manual' | 'import' | 'website';
  scanId?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  qualityScore?: number;
}

export interface QRScanEvent {
  id: string;
  scanId: string;
  timestamp: string;
  userAgent?: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  os: 'iOS' | 'Android' | 'macOS' | 'Windows' | 'Linux' | 'Other';
  startedFilling: boolean;
  startedAt?: string;
  completed: boolean;
  completedAt?: string;
  customerId?: string;
  timeSpentSeconds?: number;
}

export interface QRAnalyticsData {
  totalScans: number;
  uniqueVisitors: number;
  totalStarted: number;
  totalCompleted: number;
  scanToRegRate: number; // in %
  startToCompleteRate: number; // in %
  avgTimeSeconds: number;
  peakHours: { hour: number; label: string; scans: number }[];
  deviceBreakdown: { name: string; count: number; percentage: number }[];
  dailyTrends: { date: string; scans: number; registrations: number }[];
  recentScans: QRScanEvent[];
}

export interface DataQualitySummary {
  totalRecords: number;
  healthyRecords: number;
  missingEmails: number;
  missingPhones: number;
  duplicateCount: number;
  overallScore: number;
}

export interface DuplicateGroup {
  id: string;
  reason: 'phone' | 'email' | 'name_similar';
  key: string;
  customers: Customer[];
}

export type DeduplicateStrategy = 'skip' | 'update' | 'all';

export interface MergeCustomersPayload {
  primaryId: string;
  duplicateIds: string[];
  mergedData?: Partial<Customer>;
}

export interface DuplicateCheckResult {
  hasDuplicate: boolean;
  matchType?: 'phone' | 'email';
  existingCustomer?: Customer;
}

export interface StoreSettings {
  // Showroom Identity & Registrations
  businessName: string;
  tagline: string;
  branchName: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  whatsappPhone: string;
  email: string;
  gstin: string;
  bisHallmarkNumber: string;

  // Showroom Currency
  currency: string;

  // Customer Data & Deduplication Safeguards
  enableDuplicateGuard: boolean;
  minPhoneDigits: number;
  defaultCategoryId: string;
  autoFormatNames: boolean;
  requireCityOnWalkin: boolean;

  // Showroom QR Portal Experience
  standeeTagline: string;
  qrIntakeActive: boolean;
  qrWelcomeHeading: string;
  qrSubtitle: string;
  qrSuccessMessage: string;
  collectAnniversaryDate: boolean;

  // Security & Operations
  masterSecurityPin: string;
  allowStaffExports: boolean;
  sessionTimeoutMinutes: number;
  lastBackupDate?: string;
}
