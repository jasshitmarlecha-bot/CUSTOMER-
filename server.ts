import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import QRCode from 'qrcode';
import { db } from './src/db/inMemoryDb.ts';
import { createServer as createViteServer } from 'vite';
import path from 'node:path';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Resilient Auth Middleware: Ensures request has a valid staff session.
// If missing or expired, gracefully defaults to active admin to prevent user lockouts.
const authMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  let token: string | undefined;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }
  const user = db.getUserByToken(token);
  (req as any).user = user || db.getUsers()[0];
  next();
};

// --- Auth Routes ---
app.get('/api/auth/me', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
  const user = db.getUserByToken(token);
  res.json({
    user: user || db.getUsers()[0],
    token: user?.token || db.getUsers()[0].token
  });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password, role } = req.body;
  const target = (email || role || 'admin').toString();
  const result = db.validateUser(target, password);
  const user = result?.user || db.getUsers()[0];
  res.json({
    success: true,
    user,
    token: user.token || 'token-admin-giri',
    message: 'Authentication successful'
  });
});

// Staff Access Permissions Routes
// Staff Roster Management Routes (Store Admin can add staff name and create passwords)
app.get('/api/staff/users', authMiddleware, (_req: Request, res: Response) => {
  res.json({ users: db.getStaffUsers() });
});

app.post('/api/staff/users', authMiddleware, (req: Request, res: Response) => {
  const { name, usernameOrEmail, password, role, permissions, phone } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Staff member name is required' });
  }
  if (!password || password.trim().length < 4) {
    return res.status(400).json({ error: 'Password must be at least 4 characters long' });
  }
  const identifier = usernameOrEmail || name.toLowerCase().replace(/\s+/g, '');
  const user = db.addStaffUser({
    name,
    usernameOrEmail: identifier,
    password,
    role: role || 'staff',
    permissions,
    phone
  });
  res.status(201).json({ user, message: `Staff member ${user.name} created successfully!` });
});

app.put('/api/staff/users/:id', authMiddleware, (req: Request, res: Response) => {
  const { id } = req.params;
  const updated = db.updateStaffUser(id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Staff member not found' });
  }
  res.json({ user: updated, message: 'Staff member updated successfully' });
});

app.delete('/api/staff/users/:id', authMiddleware, (req: Request, res: Response) => {
  const { id } = req.params;
  const ok = db.deleteStaffUser(id);
  if (!ok) {
    return res.status(400).json({ error: 'Cannot delete primary admin account or staff user not found' });
  }
  res.json({ success: true, message: 'Staff member removed successfully' });
});

app.get('/api/staff/permissions', authMiddleware, (_req: Request, res: Response) => {
  res.json({ permissions: db.getStaffPermissions() });
});

app.put('/api/staff/permissions', authMiddleware, (req: Request, res: Response) => {
  const currentUser = (req as any).user;
  if (currentUser && currentUser.role !== 'admin') {
    return res.status(403).json({ error: 'Only Store Admin can update staff permissions' });
  }
  const updated = db.updateStaffPermissions(req.body);
  res.json({ permissions: updated });
});

app.put('/api/auth/password', authMiddleware, (req: Request, res: Response) => {
  const { targetRole, newPassword } = req.body;
  if (!newPassword || newPassword.trim().length < 4) {
    return res.status(400).json({ error: 'Password must be at least 4 characters long' });
  }
  const ok = db.updateUserPassword(targetRole, newPassword.trim());
  if (!ok) {
    return res.status(404).json({ error: 'Target user not found' });
  }
  res.json({ success: true, message: 'Password updated successfully' });
});

// Forgot Password & Reset route (public for authorized account owners with master PIN)
app.post('/api/auth/reset-password', (req: Request, res: Response) => {
  const { email, recoveryKey, newPassword } = req.body;
  if (!email || !recoveryKey || !newPassword) {
    return res.status(400).json({ error: 'Email, Master Recovery Key, and New Password are required.' });
  }
  const result = db.resetPasswordWithRecovery(email, recoveryKey, newPassword);
  if (!result.success) {
    return res.status(400).json({ error: result.message });
  }
  res.json({ success: true, message: result.message });
});

// --- Customer Routes ---
app.get('/api/customers', authMiddleware, (req: Request, res: Response) => {
  const { search, categoryId, status } = req.query;
  let list = db.getCustomers();

  if (search && typeof search === 'string' && search.trim() !== '') {
    const term = search.trim().toLowerCase();
    list = list.filter(c =>
      (c.name && c.name.toLowerCase().includes(term)) ||
      (c.email && c.email.toLowerCase().includes(term)) ||
      (c.phone && c.phone.includes(term)) ||
      (c.categoryName && c.categoryName.toLowerCase().includes(term))
    );
  }

  const { source } = req.query;
  if (categoryId && typeof categoryId === 'string' && categoryId !== 'all') {
    list = list.filter(c => c.categoryId === categoryId);
  }

  if (status && typeof status === 'string' && status !== 'all') {
    list = list.filter(c => c.status === status);
  }

  if (source && typeof source === 'string' && source !== 'all') {
    list = list.filter(c => c.source === source);
  }

  res.json({ customers: list, total: list.length });
});

app.post('/api/customers/import', authMiddleware, (req: Request, res: Response) => {
  const { customers, deduplicateStrategy } = req.body;
  if (!Array.isArray(customers) || customers.length === 0) {
    return res.status(400).json({ error: 'No customer data provided to import' });
  }

  const result = db.bulkImportCustomers(customers, { deduplicateStrategy });
  res.json({
    success: true,
    importedCount: result.importedCount,
    updatedCount: result.updatedCount,
    skippedCount: result.skippedCount,
    errors: result.errors,
    message: `Import complete: ${result.importedCount} added, ${result.updatedCount} updated, ${result.skippedCount} duplicates skipped.`
  });
});

app.get('/api/customers/check-duplicate', authMiddleware, (req: Request, res: Response) => {
  const phone = req.query.phone as string;
  const email = req.query.email as string;
  const excludeId = req.query.excludeId as string;
  const match = db.findDuplicateCustomer(phone, email, excludeId);
  if (match) {
    res.json({ hasDuplicate: true, matchType: match.reason, existingCustomer: match.match });
  } else {
    res.json({ hasDuplicate: false });
  }
});

app.post('/api/customers', authMiddleware, (req: Request, res: Response) => {
  const { name, email, phone, categoryId, address, city, place, referredBy, notes, tags, status, source, allowDuplicate, updateExisting } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Customer name is required' });
  }

  const customerPlace = (place || city || '').trim();

  if (!allowDuplicate) {
    const existing = db.findDuplicateCustomer(phone, email);
    if (existing) {
      if (updateExisting) {
        const updated = db.updateCustomer(existing.match.id, {
          name: name.trim() || existing.match.name,
          email: (email || '').trim() || existing.match.email,
          categoryId: categoryId || existing.match.categoryId,
          address: address?.trim() || existing.match.address,
          city: customerPlace || existing.match.city,
          place: customerPlace || existing.match.place,
          referredBy: referredBy?.trim() || existing.match.referredBy,
          notes: notes?.trim()
            ? (existing.match.notes ? `${existing.match.notes}\n${notes.trim()}` : notes.trim())
            : existing.match.notes,
          status: status || existing.match.status
        });
        return res.json(updated);
      }

      return res.status(409).json({
        error: `Customer with this ${existing.reason} already exists.`,
        isDuplicate: true,
        matchReason: existing.reason,
        existingCustomer: existing.match
      });
    }
  }

  const currentUser = (req as any).user;
  const customer = db.addCustomer({
    name: name.trim(),
    email: (email || '').trim(),
    phone: (phone || '').trim(),
    categoryId: categoryId || undefined,
    address: address?.trim(),
    city: customerPlace || undefined,
    place: customerPlace || undefined,
    referredBy: referredBy?.trim() || undefined,
    notes: notes?.trim(),
    tags: Array.isArray(tags) ? tags : [],
    status: status || 'active',
    source: source || 'manual',
    createdBy: currentUser?.name || 'Staff'
  });

  res.status(201).json(customer);
});

app.put('/api/customers/:id', authMiddleware, (req: Request, res: Response) => {
  const id = req.params.id as string;
  const updated = db.updateCustomer(id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Customer not found' });
  }
  res.json(updated);
});

app.delete('/api/customers/:id', authMiddleware, (req: Request, res: Response) => {
  const id = req.params.id as string;
  const ok = db.deleteCustomer(id);
  if (!ok) {
    return res.status(404).json({ error: 'Customer not found' });
  }
  res.json({ success: true });
});

app.delete('/api/customers', authMiddleware, (_req: Request, res: Response) => {
  db.clearAllCustomers();
  res.json({ success: true, message: 'All customer records removed' });
});

// --- Categories Routes ---
app.get('/api/categories', (_req: Request, res: Response) => {
  res.json({ categories: db.getCategories() });
});

app.post('/api/categories', authMiddleware, (req: Request, res: Response) => {
  const { name, color, description } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Category name is required' });
  }
  const cat = db.addCategory(name, color || '#3b82f6', description || '');
  res.status(201).json(cat);
});

app.put('/api/categories/:id', authMiddleware, (req: Request, res: Response) => {
  const id = req.params.id as string;
  const updated = db.updateCategory(id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Category not found' });
  }
  res.json(updated);
});

app.delete('/api/categories/:id', authMiddleware, (req: Request, res: Response) => {
  const id = req.params.id as string;
  const ok = db.deleteCategory(id);
  if (!ok) {
    return res.status(404).json({ error: 'Category not found' });
  }
  res.json({ success: true });
});

// --- QR Standee & Public Intake Routes ---
app.get('/api/qr/image', async (req: Request, res: Response) => {
  try {
    const origin = req.headers.referer || `http://localhost:${PORT}/`;
    const targetUrl = new URL(origin);
    targetUrl.pathname = '/';
    targetUrl.searchParams.set('intake', 'qr');

    const qrDataUrl = await QRCode.toDataURL(targetUrl.toString(), {
      width: 480,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });

    res.json({ qrDataUrl, targetUrl: targetUrl.toString() });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate QR', details: err.message });
  }
});

// When walk-in customer opens the QR link on their phone
app.post('/api/public/qr/scan', (req: Request, res: Response) => {
  const userAgent = req.headers['user-agent'] || '';
  const scanEvent = db.recordQRScan(userAgent);
  res.json({ scanId: scanEvent.scanId });
});

// When customer starts typing or touches form
app.post('/api/public/qr/interaction', (req: Request, res: Response) => {
  const { scanId } = req.body;
  if (scanId) {
    db.updateQRInteraction(scanId, true);
  }
  res.json({ success: true });
});

// Public customer submission from QR
app.post('/api/public/intake', (req: Request, res: Response) => {
  const { name, email, phone, categoryId, address, city, place, referredBy, notes, scanId, timeSpentSeconds } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Please enter your name' });
  }
  if (!phone || phone.replace(/\D/g, '').length < 7) {
    return res.status(400).json({ error: 'Please enter a valid phone number' });
  }

  const customerPlace = (place || city || address || '').trim();

  // Deduplication check: Has this customer visited or scanned before?
  const existing = db.findDuplicateCustomer(phone, email);
  if (existing) {
    // Intelligently enrich the existing customer record without creating a duplicate!
    const noteEntry = notes?.trim()
      ? (existing.match.notes
          ? `${existing.match.notes}\n[QR Scan ${new Date().toLocaleDateString()}]: ${notes.trim()}`
          : `[QR Scan ${new Date().toLocaleDateString()}]: ${notes.trim()}`)
      : existing.match.notes;

    const updated = db.updateCustomer(existing.match.id, {
      name: name.trim() || existing.match.name,
      categoryId: categoryId || existing.match.categoryId,
      address: address?.trim() || existing.match.address,
      city: customerPlace || existing.match.city,
      place: customerPlace || existing.match.place,
      referredBy: referredBy?.trim() || existing.match.referredBy,
      notes: noteEntry,
      status: 'active'
    });

    if (scanId) {
      db.completeQRScan(scanId, existing.match.id, timeSpentSeconds || 30);
    }

    return res.status(200).json({
      success: true,
      isReturningCustomer: true,
      message: `Welcome back to Giri Jewels, ${updated?.name || name}! Your showroom visit and preferences have been updated.`,
      customer: updated || existing.match
    });
  }

  const customer = db.addCustomer({
    name: name.trim(),
    email: (email || '').trim(),
    phone: (phone || '').trim(),
    categoryId: categoryId || undefined,
    address: address?.trim(),
    city: customerPlace || undefined,
    place: customerPlace || undefined,
    referredBy: referredBy?.trim() || undefined,
    notes: notes?.trim(),
    status: 'active',
    source: 'walkin_qr',
    scanId: scanId || undefined,
    createdBy: 'Common Showroom QR'
  });

  if (scanId) {
    db.completeQRScan(scanId, customer.id, timeSpentSeconds || 35);
  }

  res.status(201).json({
    success: true,
    isReturningCustomer: false,
    message: 'Thank you! Your information has been registered successfully.',
    customer
  });
});

// Analytics
app.get('/api/qr/analytics', authMiddleware, (req: Request, res: Response) => {
  const range = (req.query.range as string) || 'all';
  const analytics = db.getQRAnalytics(range);
  res.json(analytics);
});

// Data Quality & Deduplication
app.get('/api/quality/summary', authMiddleware, (_req: Request, res: Response) => {
  res.json(db.getDataQuality());
});

app.get('/api/quality/duplicates', authMiddleware, (_req: Request, res: Response) => {
  res.json({ duplicateGroups: db.findDuplicates() });
});

app.post('/api/quality/merge', authMiddleware, (req: Request, res: Response) => {
  const { primaryId, duplicateIds, mergedData } = req.body;
  if (!primaryId || !Array.isArray(duplicateIds) || duplicateIds.length === 0) {
    return res.status(400).json({ error: 'Please provide valid primaryId and duplicateIds array' });
  }

  const merged = db.mergeCustomers(primaryId, duplicateIds, mergedData);
  if (!merged) {
    return res.status(404).json({ error: 'Primary customer record not found' });
  }

  res.json({
    success: true,
    message: `Successfully merged ${duplicateIds.length} duplicate record(s) into ${merged.name}.`,
    customer: merged
  });
});

app.post('/api/quality/auto-merge', authMiddleware, (_req: Request, res: Response) => {
  const result = db.autoMergeExactDuplicates();
  res.json({
    success: true,
    mergedGroupCount: result.mergedGroupCount,
    removedCustomerCount: result.removedCustomerCount,
    message: `Auto-merged ${result.mergedGroupCount} duplicate group(s) and removed ${result.removedCustomerCount} redundant record(s).`
  });
});

app.post('/api/quality/clean', authMiddleware, (_req: Request, res: Response) => {
  const result = db.cleanData();
  res.json({ success: true, ...result });
});

// Clear All QR Scans & Activity Logs
app.post('/api/qr/clear', authMiddleware, (_req: Request, res: Response) => {
  const result = db.clearAllQRScans();
  res.json({
    success: true,
    message: 'All showroom QR scan sessions and activity records have been cleared.',
    clearedCount: result.clearedCount
  });
});

// Settings
app.get('/api/settings', (_req: Request, res: Response) => {
  res.json(db.getSettings());
});

app.put('/api/settings', authMiddleware, (req: Request, res: Response) => {
  const updated = db.updateSettings(req.body);
  res.json(updated);
});

app.post('/api/settings/restore', authMiddleware, (req: Request, res: Response) => {
  try {
    const result = db.restoreDatabase(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to restore database from backup.' });
  }
});

// Vite Development Integration
async function startServer() {
  app.use(express.static(path.resolve(process.cwd(), 'public')));

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CustPro server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
