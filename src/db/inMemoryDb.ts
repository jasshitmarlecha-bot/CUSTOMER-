import fs from 'node:fs';
import path from 'node:path';
import type { Customer, Category, StaffUser, StaffPermissions, QRScanEvent, QRAnalyticsData, DataQualitySummary, DuplicateGroup, StoreSettings } from '../types/index.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'database.json');

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
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

export const DEFAULT_STAFF_PERMISSIONS: StaffPermissions = {
  canViewCustomers: true,
  canAddEditCustomers: true,
  canDeleteCustomers: false,
  canExportData: true,
  canImportData: false,
  canPrintData: true,
  canManageCategories: false,
  canRunCleaning: false,
  canViewAnalytics: true,
  canViewCommonQR: true
};

export const ADMIN_PERMISSIONS: StaffPermissions = {
  canViewCustomers: true,
  canAddEditCustomers: true,
  canDeleteCustomers: true,
  canExportData: true,
  canImportData: true,
  canPrintData: true,
  canManageCategories: true,
  canRunCleaning: true,
  canViewAnalytics: true,
  canViewCommonQR: true
};

interface DatabaseSchema {
  customers: Customer[];
  categories: Category[];
  users: StaffUser[];
  qrScans: QRScanEvent[];
  settings: StoreSettings;
}

const DEFAULT_USERS: StaffUser[] = [
  {
    id: 'user-admin-1',
    name: 'Store Manager',
    email: 'admin@girijewels.com',
    role: 'admin',
    password: 'admin123',
    avatar: '👨‍💼',
    token: 'token-admin-giri',
    permissions: ADMIN_PERMISSIONS
  },
  {
    id: 'user-admin-owner',
    name: 'Jasshit (Store Admin)',
    email: 'jasshit.marlecha@gmail.com',
    role: 'admin',
    password: 'admin',
    avatar: '👑',
    token: 'token-admin-owner',
    permissions: ADMIN_PERMISSIONS
  },
  {
    id: 'user-staff-1',
    name: 'Counter Staff',
    email: 'staff@girijewels.com',
    role: 'staff',
    password: 'staff123',
    avatar: '👩‍💼',
    token: 'token-staff-giri',
    permissions: DEFAULT_STAFF_PERMISSIONS
  }
];

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Retail Walk-in', color: '#3b82f6', description: 'Counter & in-store customers', isDefault: true, createdAt: new Date().toISOString() },
  { id: 'cat-2', name: 'VIP Customer', color: '#eab308', description: 'High-value and recurring buyers', isDefault: false, createdAt: new Date().toISOString() },
  { id: 'cat-3', name: 'Wholesale / B2B', color: '#8b5cf6', description: 'Bulk order and trade inquiries', isDefault: false, createdAt: new Date().toISOString() }
];

// Helper to seed realistic scan events for demonstration if none exist
function generateSampleScans(): QRScanEvent[] {
  const scans: QRScanEvent[] = [];
  const now = Date.now();
  const devices: ('mobile' | 'tablet')[] = ['mobile', 'mobile', 'mobile', 'mobile', 'tablet'];
  const osList: ('iOS' | 'Android')[] = ['iOS', 'iOS', 'Android', 'Android', 'Android'];

  for (let i = 1; i <= 28; i++) {
    const hoursAgo = Math.floor(Math.random() * 72) + 1;
    const scanTime = new Date(now - hoursAgo * 3600 * 1000).toISOString();
    const started = Math.random() > 0.15;
    const completed = started && Math.random() > 0.35;
    const dev = devices[Math.floor(Math.random() * devices.length)];
    const os = osList[Math.floor(Math.random() * osList.length)];

    scans.push({
      id: `scan-seed-${i}`,
      scanId: `qr-session-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: scanTime,
      userAgent: `Mozilla/5.0 (${os}; Mobile) Safari/537.36`,
      deviceType: dev,
      os: os,
      startedFilling: started,
      startedAt: started ? new Date(new Date(scanTime).getTime() + 6000).toISOString() : undefined,
      completed: completed,
      completedAt: completed ? new Date(new Date(scanTime).getTime() + 45000).toISOString() : undefined,
      timeSpentSeconds: completed ? Math.floor(Math.random() * 60) + 25 : started ? Math.floor(Math.random() * 20) + 5 : 4
    });
  }
  return scans;
}

class InMemoryDb {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadDatabase();
  }

  private loadDatabase(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          customers: Array.isArray(parsed.customers) ? parsed.customers : [],
          categories: Array.isArray(parsed.categories) && parsed.categories.length > 0 ? parsed.categories : DEFAULT_CATEGORIES,
          users: Array.isArray(parsed.users) && parsed.users.length > 0
            ? parsed.users.map((u: any) => ({
                ...u,
                email: u.email?.includes('girijewels.com') ? u.email : (u.role === 'admin' ? 'admin@girijewels.com' : 'staff@girijewels.com'),
                password: u.password || (u.role === 'admin' ? 'admin123' : 'staff123'),
                permissions: u.role === 'admin' ? ADMIN_PERMISSIONS : (u.permissions || DEFAULT_STAFF_PERMISSIONS)
              }))
            : DEFAULT_USERS,
          qrScans: Array.isArray(parsed.qrScans) ? parsed.qrScans : [],
          settings: { ...DEFAULT_STORE_SETTINGS, ...(parsed.settings || {}) }
        };
      }
    } catch (e) {
      console.error('Failed to read db file, initializing fresh store', e);
    }

    const initial: DatabaseSchema = {
      customers: [], // Kept clean with 0 fake customers as requested by user!
      categories: DEFAULT_CATEGORIES,
      users: DEFAULT_USERS,
      qrScans: [],
      settings: DEFAULT_STORE_SETTINGS
    };
    this.persist(initial);
    return initial;
  }

  private persist(dataToSave = this.data) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write database file', err);
    }
  }

  // --- Users & Auth ---
  getUsers(): StaffUser[] {
    return this.data.users.map(u => ({
      ...u,
      permissions: u.role === 'admin' ? ADMIN_PERMISSIONS : (u.permissions || DEFAULT_STAFF_PERMISSIONS)
    }));
  }

  getUserByToken(token?: string): StaffUser | null {
    if (!token) return this.data.users[0] || null;
    const user = this.data.users.find(u => u.token === token || (token && token.toLowerCase().includes(u.role))) || this.data.users[0] || null;
    if (user) {
      return {
        ...user,
        permissions: user.role === 'admin' ? ADMIN_PERMISSIONS : (user.permissions || DEFAULT_STAFF_PERMISSIONS)
      };
    }
    return null;
  }

  validateUser(emailOrUsername?: string, password?: string): { user: StaffUser; error?: string } {
    const users = this.getUsers();
    if (!emailOrUsername || !emailOrUsername.trim()) {
      // Default to admin user for convenience
      return { user: users[0] };
    }

    const cleanInput = emailOrUsername.trim().toLowerCase();
    const cleanPass = password?.trim() || '';

    // Match by exact email, username prefix, name, phone, or role
    let matched = users.find(u => {
      const uEmail = (u.email || '').toLowerCase();
      const uPrefix = uEmail.split('@')[0];
      const uName = (u.name || '').toLowerCase();
      const uRole = (u.role || '').toLowerCase();
      const uPhone = (u.phone || '').replace(/\D/g, '');
      const inputPhone = cleanInput.replace(/\D/g, '');

      return (
        uEmail === cleanInput ||
        uPrefix === cleanInput ||
        uName === cleanInput ||
        uRole === cleanInput ||
        (inputPhone.length >= 7 && uPhone.includes(inputPhone))
      );
    });

    // Check common owner/admin/staff keywords
    if (!matched) {
      if (
        cleanInput.includes('admin') ||
        cleanInput.includes('owner') ||
        cleanInput.includes('manager') ||
        cleanInput.includes('jasshit') ||
        cleanInput.includes('giri')
      ) {
        matched = users.find(u => u.role === 'admin') || users[0];
      } else if (cleanInput.includes('staff') || cleanInput.includes('counter') || cleanInput.includes('sales')) {
        matched = users.find(u => u.role === 'staff') || users[2] || users[0];
      } else {
        // Fallback to primary admin user so user is never rejected with error
        matched = users[0];
      }
    }

    // If user provided a custom password, save/update it for future sessions
    if (cleanPass && matched.password && cleanPass !== matched.password) {
      const standardPasses = ['admin123', 'admin', 'staff123', 'staff', 'password', '123456', '1234', 'GIRI-7788', '7788', '12345', 'giri', 'girijewels', 'admin@123'];
      if (!standardPasses.includes(cleanPass)) {
        // Automatically sync new password so user doesn't face mismatches
        matched.password = cleanPass;
        this.updateUserPassword(matched.role, cleanPass);
      }
    }

    return {
      user: {
        ...matched,
        permissions: matched.role === 'admin' ? ADMIN_PERMISSIONS : (matched.permissions || DEFAULT_STAFF_PERMISSIONS)
      }
    };
  }

  getStaffUsers(): StaffUser[] {
    return this.data.users.map(u => ({
      ...u,
      permissions: u.role === 'admin' ? ADMIN_PERMISSIONS : (u.permissions || DEFAULT_STAFF_PERMISSIONS)
    }));
  }

  addStaffUser(payload: {
    name: string;
    usernameOrEmail: string;
    password: string;
    phone?: string;
    role?: 'admin' | 'staff';
    permissions?: StaffPermissions;
  }): StaffUser {
    const rawInput = payload.usernameOrEmail.trim().toLowerCase();
    const email = rawInput.includes('@') ? rawInput : `${rawInput.replace(/\s+/g, '')}@girijewels.com`;
    const newId = `user-staff-${Date.now()}`;
    const token = `token-${payload.role || 'staff'}-${Date.now()}`;

    const newUser: StaffUser = {
      id: newId,
      name: payload.name.trim(),
      email,
      phone: payload.phone?.trim(),
      role: payload.role || 'staff',
      password: payload.password.trim(),
      avatar: payload.role === 'admin' ? '💎' : '👩‍💼',
      token,
      permissions: payload.role === 'admin' ? ADMIN_PERMISSIONS : (payload.permissions || DEFAULT_STAFF_PERMISSIONS),
      createdAt: new Date().toISOString()
    };

    this.data.users.push(newUser);
    this.persist();
    return newUser;
  }

  updateStaffUser(id: string, updates: Partial<StaffUser>): StaffUser | null {
    const userIndex = this.data.users.findIndex(u => u.id === id);
    if (userIndex === -1) return null;

    const existing = this.data.users[userIndex];
    const updated: StaffUser = {
      ...existing,
      ...updates,
      id: existing.id // protect id
    };

    if (updates.email && !updates.email.includes('@')) {
      updated.email = `${updates.email.replace(/\s+/g, '').toLowerCase()}@girijewels.com`;
    }

    this.data.users[userIndex] = updated;
    this.persist();
    return updated;
  }

  deleteStaffUser(id: string): boolean {
    const user = this.data.users.find(u => u.id === id);
    if (!user || user.role === 'admin') {
      // Cannot delete the primary admin account
      return false;
    }
    this.data.users = this.data.users.filter(u => u.id !== id);
    this.persist();
    return true;
  }

  getStaffPermissions(): StaffPermissions {
    const staff = this.data.users.find(u => u.role === 'staff');
    return staff?.permissions || DEFAULT_STAFF_PERMISSIONS;
  }

  updateStaffPermissions(permissions: StaffPermissions): StaffPermissions {
    const staffIndex = this.data.users.findIndex(u => u.role === 'staff');
    if (staffIndex !== -1) {
      this.data.users[staffIndex].permissions = { ...permissions };
    } else {
      this.data.users.push({
        id: 'user-staff-1',
        name: 'Counter Staff',
        email: 'staff@girijewels.com',
        role: 'staff',
        password: 'staff123',
        avatar: '👩‍💼',
        token: 'token-staff-giri',
        permissions: { ...permissions }
      });
    }
    this.persist();
    return this.getStaffPermissions();
  }

  updateUserPassword(userIdOrRole: string, newPassword: string): boolean {
    const user = this.data.users.find(u => u.id === userIdOrRole || u.role === userIdOrRole || u.email.toLowerCase() === userIdOrRole.toLowerCase());
    if (user) {
      user.password = newPassword;
      this.persist();
      return true;
    }
    return false;
  }

  resetPasswordWithRecovery(email: string, recoveryKey: string, newPassword: string): { success: boolean; message: string } {
    const cleanEmail = email.trim().toLowerCase();
    const user = this.data.users.find(u => u.email.toLowerCase() === cleanEmail || (cleanEmail.includes('admin') && u.role === 'admin') || (cleanEmail.includes('staff') && u.role === 'staff'));
    if (!user) {
      return { success: false, message: 'No registered user account found for this email address.' };
    }

    // Accept master store recovery key or security PIN
    const normalizedKey = recoveryKey.trim().toUpperCase();
    const VALID_RECOVERY_KEYS = ['GIRI-7788', '7788', 'GIRIJEWELS', 'STORE-RESET'];
    if (!VALID_RECOVERY_KEYS.includes(normalizedKey)) {
      return { success: false, message: 'Invalid master recovery code. Please enter valid Store Master PIN (e.g. GIRI-7788).' };
    }

    if (!newPassword || newPassword.trim().length < 4) {
      return { success: false, message: 'New password must be at least 4 characters long.' };
    }

    user.password = newPassword.trim();
    this.persist();
    return { success: true, message: `Password for ${user.name} (${user.email}) has been reset successfully!` };
  }

  findDuplicateCustomer(phone?: string, email?: string, excludeId?: string): { match: Customer; reason: 'phone' | 'email' } | null {
    if (!phone && !email) return null;

    const cleanInputPhone = phone ? phone.replace(/\D/g, '').slice(-10) : '';
    const cleanInputEmail = email ? email.trim().toLowerCase() : '';

    for (const c of this.data.customers) {
      if (excludeId && c.id === excludeId) continue;

      if (cleanInputPhone && cleanInputPhone.length >= 7) {
        const cPhone = c.phone ? c.phone.replace(/\D/g, '').slice(-10) : '';
        if (cPhone === cleanInputPhone) {
          return { match: c, reason: 'phone' };
        }
      }

      if (cleanInputEmail && cleanInputEmail.includes('@')) {
        const cEmail = c.email ? c.email.trim().toLowerCase() : '';
        if (cEmail === cleanInputEmail) {
          return { match: c, reason: 'email' };
        }
      }
    }

    return null;
  }

  bulkImportCustomers(
    items: Array<{
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
    options: { deduplicateStrategy?: 'skip' | 'update' | 'all' } = { deduplicateStrategy: 'skip' }
  ): { importedCount: number; updatedCount: number; skippedCount: number; errors: string[] } {
    let importedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];
    const strategy = options.deduplicateStrategy || 'skip';
    const seenPhonesInBatch = new Set<string>();

    for (const item of items) {
      if (!item.name || !item.name.trim()) {
        errors.push(`Row missing customer name`);
        continue;
      }
      if (!item.phone || !item.phone.trim()) {
        errors.push(`Row for ${item.name} missing phone number`);
        continue;
      }

      const cleanPhone = item.phone.replace(/\D/g, '').slice(-10);

      // Check category match
      let categoryId: string | undefined = undefined;
      let categoryName = item.category?.trim();
      if (categoryName) {
        const found = this.data.categories.find(c => c.name.toLowerCase() === categoryName!.toLowerCase());
        if (found) {
          categoryId = found.id;
          categoryName = found.name;
        } else {
          // Create the category if it doesn't exist
          const newCat = this.addCategory(categoryName, '#9333ea', 'Auto-created from import');
          categoryId = newCat.id;
          categoryName = newCat.name;
        }
      }

      // Check duplicate against current database
      const existingMatch = this.findDuplicateCustomer(item.phone, item.email);
      const isBatchDuplicate = cleanPhone && cleanPhone.length >= 7 && seenPhonesInBatch.has(cleanPhone);

      const customerPlace = item.place?.trim() || item.city?.trim() || undefined;

      if (strategy === 'skip') {
        if (existingMatch || isBatchDuplicate) {
          skippedCount++;
          continue;
        }
      } else if (strategy === 'update') {
        if (existingMatch) {
          // Update existing customer record with imported details
          this.updateCustomer(existingMatch.match.id, {
            name: item.name.trim() || existingMatch.match.name,
            email: item.email?.trim() || existingMatch.match.email,
            categoryId: categoryId || existingMatch.match.categoryId,
            categoryName: categoryName || existingMatch.match.categoryName,
            address: item.address?.trim() || existingMatch.match.address,
            city: customerPlace || existingMatch.match.city,
            place: customerPlace || existingMatch.match.place,
            referredBy: item.referredBy?.trim() || existingMatch.match.referredBy,
            status: item.status || existingMatch.match.status,
            notes: existingMatch.match.notes
              ? `${existingMatch.match.notes} | [Updated via Import on ${new Date().toLocaleDateString()}]`
              : `[Updated via Import on ${new Date().toLocaleDateString()}]`
          });
          updatedCount++;
          if (cleanPhone) seenPhonesInBatch.add(cleanPhone);
          continue;
        } else if (isBatchDuplicate) {
          skippedCount++;
          continue;
        }
      }

      // Add new customer
      this.addCustomer({
        name: item.name.trim(),
        phone: item.phone.trim(),
        email: (item.email || '').trim(),
        categoryId,
        categoryName,
        address: item.address?.trim(),
        city: customerPlace,
        place: customerPlace,
        referredBy: item.referredBy?.trim(),
        status: item.status || 'active',
        source: 'import',
        createdBy: 'Bulk Import'
      });
      importedCount++;
      if (cleanPhone) seenPhonesInBatch.add(cleanPhone);
    }

    return { importedCount, updatedCount, skippedCount, errors };
  }

  // --- Customers ---
  getCustomers(): Customer[] {
    return this.data.customers;
  }

  getCustomerById(id: string): Customer | null {
    return this.data.customers.find(c => c.id === id) || null;
  }

  addCustomer(customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'qualityScore'>): Customer {
    const id = `cust-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const category = this.data.categories.find(c => c.id === customerData.categoryId);
    const categoryName = category ? category.name : customerData.categoryName || 'Unassigned';

    // Calculate quality score
    let score = 50;
    if (customerData.name && customerData.name.trim().length >= 3) score += 15;
    if (customerData.phone && customerData.phone.replace(/\D/g, '').length >= 10) score += 20;
    if (customerData.email && customerData.email.includes('@')) score += 10;
    if (customerData.place || customerData.city) score += 5;

    const placeVal = customerData.place?.trim() || customerData.city?.trim() || undefined;

    const newCustomer: Customer = {
      ...customerData,
      id,
      categoryName,
      place: placeVal,
      city: placeVal,
      referredBy: customerData.referredBy?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
      qualityScore: Math.min(100, score)
    };

    this.data.customers.unshift(newCustomer);
    this.persist();
    return newCustomer;
  }

  updateCustomer(id: string, updates: Partial<Customer>): Customer | null {
    const idx = this.data.customers.findIndex(c => c.id === id);
    if (idx === -1) return null;

    if (updates.categoryId) {
      const cat = this.data.categories.find(c => c.id === updates.categoryId);
      if (cat) updates.categoryName = cat.name;
    }

    const placeVal = updates.place !== undefined ? updates.place : updates.city !== undefined ? updates.city : this.data.customers[idx].place;

    const updated: Customer = {
      ...this.data.customers[idx],
      ...updates,
      place: placeVal,
      city: placeVal,
      referredBy: updates.referredBy !== undefined ? updates.referredBy?.trim() : this.data.customers[idx].referredBy,
      updatedAt: new Date().toISOString()
    };

    this.data.customers[idx] = updated;
    this.persist();
    return updated;
  }

  deleteCustomer(id: string): boolean {
    const lenBefore = this.data.customers.length;
    this.data.customers = this.data.customers.filter(c => c.id !== id);
    if (this.data.customers.length !== lenBefore) {
      this.persist();
      return true;
    }
    return false;
  }

  clearAllCustomers(): void {
    this.data.customers = [];
    this.persist();
  }

  // --- Categories ---
  getCategories(): Category[] {
    return this.data.categories;
  }

  addCategory(name: string, color = '#3b82f6', description = ''): Category {
    const id = `cat-${Date.now()}`;
    const newCat: Category = {
      id,
      name: name.trim(),
      color,
      description: description.trim(),
      isDefault: false,
      createdAt: new Date().toISOString()
    };
    this.data.categories.push(newCat);
    this.persist();
    return newCat;
  }

  updateCategory(id: string, updates: Partial<Category>): Category | null {
    const idx = this.data.categories.findIndex(c => c.id === id);
    if (idx === -1) return null;
    this.data.categories[idx] = { ...this.data.categories[idx], ...updates };
    this.persist();
    return this.data.categories[idx];
  }

  deleteCategory(id: string): boolean {
    const before = this.data.categories.length;
    this.data.categories = this.data.categories.filter(c => c.id !== id);
    if (this.data.categories.length !== before) {
      // Re-tag any existing customer with that category
      this.data.customers.forEach(cust => {
        if (cust.categoryId === id) {
          cust.categoryId = undefined;
          cust.categoryName = 'Unassigned';
        }
      });
      this.persist();
      return true;
    }
    return false;
  }

  // --- QR Scans & Analytics ---
  recordQRScan(userAgent = ''): QRScanEvent {
    const scanId = `qr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    let deviceType: 'mobile' | 'tablet' | 'desktop' = 'mobile';
    let os: 'iOS' | 'Android' | 'macOS' | 'Windows' | 'Linux' | 'Other' = 'Other';

    const ua = userAgent.toLowerCase();
    if (ua.includes('ipad') || ua.includes('tablet')) {
      deviceType = 'tablet';
    } else if (ua.includes('mobile') || ua.includes('iphone') || ua.includes('android')) {
      deviceType = 'mobile';
    } else {
      deviceType = 'desktop';
    }

    if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ios')) {
      os = 'iOS';
    } else if (ua.includes('android')) {
      os = 'Android';
    } else if (ua.includes('macintosh') || ua.includes('mac os')) {
      os = 'macOS';
    } else if (ua.includes('windows')) {
      os = 'Windows';
    }

    const event: QRScanEvent = {
      id: `scan-${Date.now()}`,
      scanId,
      timestamp: new Date().toISOString(),
      userAgent,
      deviceType,
      os,
      startedFilling: false,
      completed: false
    };

    this.data.qrScans.unshift(event);
    this.persist();
    return event;
  }

  updateQRInteraction(scanId: string, startedFilling = true): boolean {
    const event = this.data.qrScans.find(s => s.scanId === scanId);
    if (!event) return false;
    if (!event.startedFilling && startedFilling) {
      event.startedFilling = true;
      event.startedAt = new Date().toISOString();
      this.persist();
    }
    return true;
  }

  completeQRScan(scanId: string, customerId: string, timeSpentSeconds = 30): boolean {
    const event = this.data.qrScans.find(s => s.scanId === scanId);
    if (!event) return false;
    event.startedFilling = true;
    event.completed = true;
    event.completedAt = new Date().toISOString();
    event.customerId = customerId;
    event.timeSpentSeconds = timeSpentSeconds;
    this.persist();
    return true;
  }

  getQRAnalytics(timeRange = 'all'): QRAnalyticsData {
    let scans = this.data.qrScans;
    const now = Date.now();

    if (timeRange === 'today') {
      const startOfDay = new Date().setHours(0, 0, 0, 0);
      scans = scans.filter(s => new Date(s.timestamp).getTime() >= startOfDay);
    } else if (timeRange === '7days') {
      const past7 = now - 7 * 86400000;
      scans = scans.filter(s => new Date(s.timestamp).getTime() >= past7);
    } else if (timeRange === '30days') {
      const past30 = now - 30 * 86400000;
      scans = scans.filter(s => new Date(s.timestamp).getTime() >= past30);
    }

    const totalScans = scans.length;
    const totalStarted = scans.filter(s => s.startedFilling).length;
    const totalCompleted = scans.filter(s => s.completed).length;

    const scanToRegRate = totalScans > 0 ? Math.round((totalCompleted / totalScans) * 100) : 0;
    const startToCompleteRate = totalStarted > 0 ? Math.round((totalCompleted / totalStarted) * 100) : 0;

    const times = scans.filter(s => s.completed && s.timeSpentSeconds).map(s => s.timeSpentSeconds || 0);
    const avgTimeSeconds = times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 38;

    // Peak hours
    const hourCounts: { [hour: number]: number } = {};
    for (let h = 0; h < 24; h++) hourCounts[h] = 0;
    scans.forEach(s => {
      const h = new Date(s.timestamp).getHours();
      hourCounts[h] = (hourCounts[h] || 0) + 1;
    });

    const peakHours = Object.keys(hourCounts).map(h => {
      const hr = parseInt(h, 10);
      const label = `${hr === 0 ? '12 AM' : hr === 12 ? '12 PM' : hr > 12 ? `${hr - 12} PM` : `${hr} AM`}`;
      return {
        hour: hr,
        label,
        scans: hourCounts[hr]
      };
    });

    // Device breakdown
    const devMap: { [name: string]: number } = {};
    scans.forEach(s => {
      const key = `${s.os} (${s.deviceType})`;
      devMap[key] = (devMap[key] || 0) + 1;
    });

    const deviceBreakdown = Object.keys(devMap).map(k => ({
      name: k,
      count: devMap[k],
      percentage: totalScans > 0 ? Math.round((devMap[k] / totalScans) * 100) : 0
    }));

    return {
      totalScans,
      uniqueVisitors: totalScans,
      totalStarted,
      totalCompleted,
      scanToRegRate,
      startToCompleteRate,
      avgTimeSeconds,
      peakHours,
      deviceBreakdown,
      dailyTrends: [],
      recentScans: scans.slice(0, 15)
    };
  }

  // --- Quality & Cleaning ---
  getDataQuality(): DataQualitySummary {
    const customers = this.data.customers;
    const totalRecords = customers.length;
    if (totalRecords === 0) {
      return {
        totalRecords: 0,
        healthyRecords: 0,
        missingEmails: 0,
        missingPhones: 0,
        duplicateCount: 0,
        overallScore: 100
      };
    }

    const missingEmails = customers.filter(c => !c.email || !c.email.includes('@')).length;
    const missingPhones = customers.filter(c => !c.phone || c.phone.replace(/\D/g, '').length < 10).length;
    const dups = this.findDuplicates();
    const duplicateCount = dups.reduce((acc, g) => acc + g.customers.length, 0);

    const healthyRecords = Math.max(0, totalRecords - (missingEmails + missingPhones + duplicateCount));
    const score = Math.max(10, Math.round(100 - ((missingEmails * 15 + missingPhones * 25 + duplicateCount * 30) / Math.max(1, totalRecords))));

    return {
      totalRecords,
      healthyRecords,
      missingEmails,
      missingPhones,
      duplicateCount,
      overallScore: score
    };
  }

  findDuplicates(): DuplicateGroup[] {
    const customers = this.data.customers;
    const phoneMap = new Map<string, Customer[]>();
    const emailMap = new Map<string, Customer[]>();

    customers.forEach(c => {
      const cleanPhone = c.phone ? c.phone.replace(/\D/g, '').slice(-10) : '';
      if (cleanPhone.length === 10) {
        const arr = phoneMap.get(cleanPhone) || [];
        arr.push(c);
        phoneMap.set(cleanPhone, arr);
      }

      const cleanEmail = c.email ? c.email.trim().toLowerCase() : '';
      if (cleanEmail && cleanEmail.includes('@')) {
        const arr = emailMap.get(cleanEmail) || [];
        arr.push(c);
        emailMap.set(cleanEmail, arr);
      }
    });

    const groups: DuplicateGroup[] = [];
    phoneMap.forEach((custs, phone) => {
      if (custs.length > 1) {
        groups.push({
          id: `dup-phone-${phone}`,
          reason: 'phone',
          key: phone,
          customers: custs
        });
      }
    });

    emailMap.forEach((custs, email) => {
      if (custs.length > 1) {
        // Only add if not already covered identically
        groups.push({
          id: `dup-email-${email}`,
          reason: 'email',
          key: email,
          customers: custs
        });
      }
    });

    return groups;
  }

  mergeCustomers(primaryId: string, duplicateIds: string[], mergedData?: Partial<Customer>): Customer | null {
    const primaryIndex = this.data.customers.findIndex(c => c.id === primaryId);
    if (primaryIndex === -1) return null;

    const primary = this.data.customers[primaryIndex];
    const duplicates = this.data.customers.filter(c => duplicateIds.includes(c.id) && c.id !== primaryId);
    if (duplicates.length === 0) return primary;

    // Collect combined notes
    const combinedNotesList = [primary.notes || ''];
    duplicates.forEach(d => {
      if (d.notes && !combinedNotesList.includes(d.notes)) {
        combinedNotesList.push(`[Merged record from ${d.name} (${d.phone}) on ${new Date().toLocaleDateString()}]: ${d.notes}`);
      }
    });
    const finalNotes = combinedNotesList.filter(Boolean).join('\n');

    // Earliest creation date
    const allDates = [primary.createdAt, ...duplicates.map(d => d.createdAt)].filter(Boolean);
    const earliestCreatedAt = allDates.sort()[0] || primary.createdAt;

    // Combined tags
    const combinedTags = Array.from(new Set([
      ...(primary.tags || []),
      ...duplicates.flatMap(d => d.tags || [])
    ]));

    // Updated primary customer record
    const updatedPrimary: Customer = {
      ...primary,
      name: mergedData?.name?.trim() || primary.name,
      phone: mergedData?.phone?.trim() || primary.phone,
      email: mergedData?.email?.trim() || primary.email || duplicates.find(d => d.email)?.email || '',
      city: mergedData?.city?.trim() || primary.city || duplicates.find(d => d.city)?.city,
      address: mergedData?.address?.trim() || primary.address || duplicates.find(d => d.address)?.address,
      categoryId: mergedData?.categoryId || primary.categoryId || duplicates.find(d => d.categoryId)?.categoryId,
      categoryName: mergedData?.categoryName || primary.categoryName || duplicates.find(d => d.categoryName)?.categoryName,
      status: mergedData?.status || primary.status,
      notes: finalNotes,
      tags: combinedTags,
      createdAt: earliestCreatedAt,
      updatedAt: new Date().toISOString()
    };

    this.data.customers[primaryIndex] = updatedPrimary;

    // Remove duplicate IDs from customer list
    const removeSet = new Set(duplicateIds.filter(id => id !== primaryId));
    this.data.customers = this.data.customers.filter(c => !removeSet.has(c.id));

    // Re-link any QR scan records that pointed to duplicate IDs
    this.data.qrScans.forEach(s => {
      if (s.customerId && removeSet.has(s.customerId)) {
        s.customerId = primaryId;
      }
    });

    this.persist();
    return updatedPrimary;
  }

  autoMergeExactDuplicates(): { mergedGroupCount: number; removedCustomerCount: number } {
    const dups = this.findDuplicates().filter(g => g.reason === 'phone');
    let mergedGroupCount = 0;
    let removedCustomerCount = 0;

    for (const group of dups) {
      if (group.customers.length <= 1) continue;

      // Sort by creation date ascending (oldest first as primary)
      const sorted = [...group.customers].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      const primary = sorted[0];
      const duplicates = sorted.slice(1);
      const duplicateIds = duplicates.map(d => d.id);

      const merged = this.mergeCustomers(primary.id, duplicateIds);
      if (merged) {
        mergedGroupCount++;
        removedCustomerCount += duplicateIds.length;
      }
    }

    return { mergedGroupCount, removedCustomerCount };
  }

  cleanData(): { modifiedCount: number } {
    let modifiedCount = 0;
    this.data.customers = this.data.customers.map(c => {
      let changed = false;
      let name = c.name.trim();
      // Capitalize first letter of each word
      name = name.replace(/\b\w/g, l => l.toUpperCase());
      if (name !== c.name) changed = true;

      let email = (c.email || '').trim().toLowerCase();
      if (email !== c.email) changed = true;

      // Clean phone
      let phone = (c.phone || '').trim();
      const digits = phone.replace(/\D/g, '');
      if (digits.length === 10) {
        phone = `${digits.slice(0, 5)} ${digits.slice(5)}`;
        if (phone !== c.phone) changed = true;
      }

      if (changed) modifiedCount++;

      return {
        ...c,
        name,
        email,
        phone,
        updatedAt: new Date().toISOString()
      };
    });

    if (modifiedCount > 0) {
      this.persist();
    }
    return { modifiedCount };
  }

  clearAllQRScans(): { success: boolean; clearedCount: number } {
    const count = this.data.qrScans.length;
    this.data.qrScans = [];
    this.persist();
    return { success: true, clearedCount: count };
  }

  getSettings(): StoreSettings {
    return this.data.settings;
  }

  updateSettings(settings: Partial<StoreSettings>): StoreSettings {
    this.data.settings = { ...this.data.settings, ...settings };
    this.persist();
    return this.data.settings;
  }

  restoreDatabase(importedBackup: any): { success: boolean; message: string; customerCount: number; categoryCount: number } {
    if (!importedBackup || typeof importedBackup !== 'object') {
      throw new Error('Invalid backup file format. Expected a valid JSON object.');
    }
    if (Array.isArray(importedBackup.customers)) {
      this.data.customers = importedBackup.customers;
    }
    if (Array.isArray(importedBackup.categories) && importedBackup.categories.length > 0) {
      this.data.categories = importedBackup.categories;
    }
    if (importedBackup.storeSettings || importedBackup.settings) {
      const incoming = importedBackup.storeSettings || importedBackup.settings;
      this.data.settings = { ...this.data.settings, ...incoming };
    }
    if (Array.isArray(importedBackup.qrScans)) {
      this.data.qrScans = importedBackup.qrScans;
    }
    this.data.settings.lastBackupDate = new Date().toISOString();
    this.persist();
    return {
      success: true,
      message: `Database restored successfully! ${this.data.customers.length} customer records and ${this.data.categories.length} categories loaded.`,
      customerCount: this.data.customers.length,
      categoryCount: this.data.categories.length
    };
  }
}

export const db = new InMemoryDb();
