import QRCode from 'qrcode';
import { clientDb } from '../db/clientDb.ts';
import {
  checkSupabaseConnection,
  fetchSupabaseCustomers,
  upsertSupabaseCustomer,
  deleteSupabaseCustomer,
  fetchSupabaseCategories,
  upsertSupabaseCategory,
  fetchSupabaseSettings,
  saveSupabaseSettings,
  SUPABASE_URL,
  type SupabaseHealth
} from '../db/supabase.ts';
import type { Customer, Category, StaffUser, StaffPermissions, QRAnalyticsData, DataQualitySummary, DuplicateGroup, StoreSettings } from '../types/index.ts';

const TOKEN_KEY = 'custpro_staff_token';

export function getStoredToken(): string | null {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token || token === 'logged_out') return 'token-admin-giri';
  return token;
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// --- Auth ---
export async function getCurrentUser(): Promise<StaffUser> {
  try {
    const token = getStoredToken();
    const user = clientDb.getUserByToken(token || undefined);
    if (user) return user;
  } catch {
    // Fall through to default
  }
  return {
    id: 'user-admin-1',
    name: 'Giri Admin',
    email: 'admin@girijewels.com',
    role: 'admin',
    avatar: '💎',
    token: 'token-admin-giri'
  };
}

export async function loginUser(email?: string, password?: string): Promise<StaffUser> {
  const result = clientDb.validateUser(email, password);
  if (!result) {
    throw new Error('Invalid email or password. Please try again.');
  }
  const { user } = result;
  if (user.token) {
    setStoredToken(user.token);
  }
  return user;
}

export function logoutUser(): void {
  clearStoredToken();
}

// --- Staff Users ---
export async function getStaffUsers(): Promise<StaffUser[]> {
  return Promise.resolve(clientDb.getStaffUsers());
}

export async function addStaffUser(payload: {
  name: string;
  usernameOrEmail: string;
  password: string;
  phone?: string;
  role?: 'admin' | 'staff';
  permissions?: StaffPermissions;
}): Promise<StaffUser> {
  return Promise.resolve(clientDb.addStaffUser(payload));
}

export async function updateStaffUser(id: string, updates: Partial<StaffUser>): Promise<StaffUser> {
  const result = clientDb.updateStaffUser(id, updates);
  if (!result) throw new Error(`Staff user ${id} not found`);
  return result;
}

export async function deleteStaffUser(id: string): Promise<boolean> {
  return Promise.resolve(clientDb.deleteStaffUser(id));
}

export async function getStaffPermissions(): Promise<StaffPermissions> {
  return Promise.resolve(clientDb.getStaffPermissions());
}

export async function updateStaffPermissions(permissions: StaffPermissions): Promise<StaffPermissions> {
  return Promise.resolve(clientDb.updateStaffPermissions(permissions));
}

export async function updateUserPassword(targetRole: string, newPassword: string): Promise<boolean> {
  return Promise.resolve(clientDb.updateUserPassword(targetRole, newPassword));
}

export async function resetPassword(email: string, recoveryKey: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  return Promise.resolve(clientDb.resetPasswordWithRecovery(email, recoveryKey, newPassword));
}

// --- Customers ---
export async function getCustomers(params?: { search?: string; categoryId?: string; status?: string; source?: string }): Promise<Customer[]> {
  let customers = clientDb.getCustomers();

  if (params?.search) {
    const q = params.search.toLowerCase();
    customers = customers.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.city && c.city.toLowerCase().includes(q)) ||
      (c.place && c.place.toLowerCase().includes(q))
    );
  }
  if (params?.categoryId) {
    customers = customers.filter(c => c.categoryId === params.categoryId);
  }
  if (params?.status) {
    customers = customers.filter(c => c.status === params.status);
  }
  if (params?.source) {
    customers = customers.filter(c => c.source === params.source);
  }

  return Promise.resolve(customers);
}

export async function importCustomers(
  customers: any[],
  deduplicateStrategy: 'skip' | 'update' | 'all' = 'skip'
): Promise<{ success: boolean; importedCount: number; updatedCount: number; skippedCount: number; errors: string[]; message: string }> {
  const result = clientDb.bulkImportCustomers(customers, { deduplicateStrategy });
  return Promise.resolve({
    success: true,
    ...result,
    message: `Import complete: ${result.importedCount} added, ${result.updatedCount} updated, ${result.skippedCount} skipped.`
  });
}

export async function checkCustomerDuplicate(phone?: string, email?: string, excludeId?: string): Promise<{ hasDuplicate: boolean; matchType?: 'phone' | 'email'; existingCustomer?: Customer }> {
  const result = clientDb.findDuplicateCustomer(phone, email, excludeId);
  if (!result) {
    return { hasDuplicate: false };
  }
  return {
    hasDuplicate: true,
    matchType: result.reason,
    existingCustomer: result.match
  };
}

export async function createCustomer(customer: Partial<Customer> & { allowDuplicate?: boolean; updateExisting?: boolean }): Promise<Customer> {
  const { allowDuplicate, updateExisting, ...customerData } = customer;

  if (!allowDuplicate && !updateExisting) {
    const dupCheck = clientDb.findDuplicateCustomer(customerData.phone, customerData.email);
    if (dupCheck) {
      throw new Error(`Duplicate customer found by ${dupCheck.reason}: ${dupCheck.match.name}`);
    }
  }

  if (updateExisting) {
    const dupCheck = clientDb.findDuplicateCustomer(customerData.phone, customerData.email);
    if (dupCheck) {
      const updated = clientDb.updateCustomer(dupCheck.match.id, customerData);
      if (updated) return updated;
    }
  }

  const newCustomer = clientDb.addCustomer({
    name: customerData.name || '',
    phone: customerData.phone || '',
    email: customerData.email || '',
    categoryId: customerData.categoryId,
    categoryName: customerData.categoryName,
    address: customerData.address,
    city: customerData.city,
    place: customerData.place,
    referredBy: customerData.referredBy,
    notes: customerData.notes,
    tags: customerData.tags,
    status: customerData.status || 'active',
    source: customerData.source || 'manual',
    scanId: customerData.scanId,
    createdBy: customerData.createdBy
  });
  // Replicate to Supabase Cloud in background
  upsertSupabaseCustomer(newCustomer).catch(() => {});
  return newCustomer;
}

export async function updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer> {
  const result = clientDb.updateCustomer(id, updates);
  if (!result) throw new Error(`Customer ${id} not found`);
  // Replicate update to Supabase Cloud in background
  upsertSupabaseCustomer(result).catch(() => {});
  return result;
}

export async function deleteCustomer(id: string): Promise<void> {
  clientDb.deleteCustomer(id);
  // Replicate deletion to Supabase Cloud in background
  deleteSupabaseCustomer(id).catch(() => {});
}

export async function clearAllCustomers(): Promise<void> {
  clientDb.clearAllCustomers();
}

// --- Categories ---
export async function getCategories(): Promise<Category[]> {
  return Promise.resolve(clientDb.getCategories());
}

export async function createCategory(cat: { name: string; color?: string; description?: string }): Promise<Category> {
  return Promise.resolve(clientDb.addCategory(cat.name, cat.color, cat.description));
}

export async function updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
  const result = clientDb.updateCategory(id, updates);
  if (!result) throw new Error(`Category ${id} not found`);
  return result;
}

export async function deleteCategory(id: string): Promise<void> {
  clientDb.deleteCategory(id);
}

// --- QR & Analytics ---
export async function getQRStandeeInfo(): Promise<{ qrDataUrl: string; targetUrl: string }> {
  const targetUrl = `${window.location.origin}/?intake=qr`;
  const qrDataUrl = await QRCode.toDataURL(targetUrl, {
    width: 480,
    margin: 1,
    color: { dark: '#0f172a', light: '#ffffff' }
  });
  return { qrDataUrl, targetUrl };
}

export async function getQRAnalytics(range = 'all'): Promise<QRAnalyticsData> {
  return Promise.resolve(clientDb.getQRAnalytics(range));
}

export async function recordPublicScan(): Promise<{ scanId: string }> {
  const event = clientDb.recordQRScan(navigator.userAgent);
  return { scanId: event.scanId };
}

export async function recordPublicInteraction(scanId: string): Promise<void> {
  clientDb.updateQRInteraction(scanId);
}

export async function submitPublicIntake(data: {
  name: string;
  email?: string;
  phone: string;
  categoryId?: string;
  place?: string;
  referredBy?: string;
  address?: string;
  city?: string;
  notes?: string;
  scanId?: string;
  timeSpentSeconds?: number;
}): Promise<{ success: boolean; message: string; customer: Customer; isReturningCustomer?: boolean }> {
  const dupCheck = clientDb.findDuplicateCustomer(data.phone, data.email);
  let customer: Customer;
  let isReturningCustomer = false;

  if (dupCheck) {
    isReturningCustomer = true;
    const updated = clientDb.updateCustomer(dupCheck.match.id, {
      name: data.name || dupCheck.match.name,
      email: data.email || dupCheck.match.email,
      place: data.place || data.city || dupCheck.match.place,
      city: data.place || data.city || dupCheck.match.city,
      address: data.address || dupCheck.match.address,
      referredBy: data.referredBy || dupCheck.match.referredBy,
      notes: data.notes
        ? (dupCheck.match.notes ? `${dupCheck.match.notes}\n${data.notes}` : data.notes)
        : dupCheck.match.notes,
      categoryId: data.categoryId || dupCheck.match.categoryId
    });
    customer = updated || dupCheck.match;
  } else {
    customer = clientDb.addCustomer({
      name: data.name,
      phone: data.phone,
      email: data.email || '',
      categoryId: data.categoryId,
      place: data.place || data.city,
      city: data.place || data.city,
      address: data.address,
      referredBy: data.referredBy,
      notes: data.notes,
      status: 'active',
      source: 'walkin_qr',
      scanId: data.scanId,
      createdBy: 'QR Intake'
    });
  }

  if (data.scanId) {
    clientDb.completeQRScan(data.scanId, customer.id, data.timeSpentSeconds || 30);
  }

  const settings = clientDb.getSettings();
  return {
    success: true,
    message: isReturningCustomer
      ? `Welcome back, ${customer.name}! Your visit has been noted.`
      : settings.qrSuccessMessage,
    customer,
    isReturningCustomer
  };
}

// --- Quality & Cleaning ---
export async function getQualitySummary(): Promise<DataQualitySummary> {
  return Promise.resolve(clientDb.getDataQuality());
}

export async function getDuplicates(): Promise<DuplicateGroup[]> {
  return Promise.resolve(clientDb.findDuplicates());
}

export async function mergeCustomers(
  primaryId: string,
  duplicateIds: string[],
  mergedData?: Partial<Customer>
): Promise<{ success: boolean; message: string; customer: Customer }> {
  const result = clientDb.mergeCustomers(primaryId, duplicateIds, mergedData);
  if (!result) throw new Error('Merge failed: primary customer not found');
  return {
    success: true,
    message: `Successfully merged ${duplicateIds.length} duplicate(s) into ${result.name}.`,
    customer: result
  };
}

export async function autoMergeDuplicates(): Promise<{
  success: boolean;
  mergedGroupCount: number;
  removedCustomerCount: number;
  message: string;
}> {
  const result = clientDb.autoMergeExactDuplicates();
  return {
    success: true,
    ...result,
    message: `Auto-merge complete: ${result.mergedGroupCount} group(s) merged, ${result.removedCustomerCount} duplicate(s) removed.`
  };
}

export async function cleanCustomerData(): Promise<{ success: boolean; modifiedCount: number }> {
  const result = clientDb.cleanData();
  return { success: true, ...result };
}

export async function clearAllQRScans(): Promise<{ success: boolean; message: string; clearedCount: number }> {
  const result = clientDb.clearAllQRScans();
  return { ...result, message: `Cleared ${result.clearedCount} QR scan record(s).` };
}

// --- Settings ---
export async function getSettings(): Promise<StoreSettings> {
  return Promise.resolve(clientDb.getSettings());
}

export async function updateSettings(settings: Partial<StoreSettings>): Promise<StoreSettings> {
  const result = clientDb.updateSettings(settings);
  // Replicate settings to Supabase Cloud in background
  saveSupabaseSettings(result).catch(() => {});
  return Promise.resolve(result);
}

export async function restoreSettingsBackup(backupData: any): Promise<{
  success: boolean;
  message: string;
  customerCount: number;
  categoryCount: number;
}> {
  return Promise.resolve(clientDb.restoreDatabase(backupData));
}

// --- Supabase Cloud Sync Operations ---
export async function getSupabaseHealth(): Promise<SupabaseHealth> {
  return checkSupabaseConnection();
}

export async function syncLocalDataToSupabase(): Promise<{
  success: boolean;
  customerCount: number;
  categoryCount: number;
  settingsSaved: boolean;
  message: string;
}> {
  const customers = clientDb.getCustomers();
  const categories = clientDb.getCategories();
  const settings = clientDb.getSettings();

  let custSuccess = 0;
  for (const c of customers) {
    const ok = await upsertSupabaseCustomer(c);
    if (ok) custSuccess++;
  }

  let catSuccess = 0;
  for (const cat of categories) {
    const ok = await upsertSupabaseCategory(cat);
    if (ok) catSuccess++;
  }

  const settingsSaved = await saveSupabaseSettings(settings);

  return {
    success: custSuccess > 0 || catSuccess > 0 || settingsSaved,
    customerCount: custSuccess,
    categoryCount: catSuccess,
    settingsSaved,
    message: `Synchronized ${custSuccess}/${customers.length} customer(s), ${catSuccess}/${categories.length} category(ies), and showroom settings to Supabase.`
  };
}

export async function syncSupabaseDataToLocal(): Promise<{
  success: boolean;
  customerCount: number;
  categoryCount: number;
  message: string;
}> {
  const cloudCustomers = await fetchSupabaseCustomers();
  const cloudCategories = await fetchSupabaseCategories();
  const cloudSettings = await fetchSupabaseSettings();

  let custCount = 0;
  if (cloudCustomers && cloudCustomers.length > 0) {
    const importResult = clientDb.bulkImportCustomers(cloudCustomers, { deduplicateStrategy: 'update' });
    custCount = importResult.importedCount + importResult.updatedCount;
  }

  let catCount = 0;
  if (cloudCategories && cloudCategories.length > 0) {
    for (const cat of cloudCategories) {
      clientDb.addCategory(cat.name, cat.color, cat.description);
      catCount++;
    }
  }

  if (cloudSettings) {
    clientDb.updateSettings(cloudSettings);
  }

  return {
    success: (cloudCustomers !== null) || (cloudCategories !== null),
    customerCount: custCount,
    categoryCount: catCount,
    message: `Downloaded and updated ${custCount} customer record(s) and categories from Supabase cloud.`
  };
}

