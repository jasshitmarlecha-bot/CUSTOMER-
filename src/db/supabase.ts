import { createClient } from '@supabase/supabase-js';
import type { Customer, Category, StoreSettings } from '../types/index.ts';

export const SUPABASE_URL = (import.meta.env?.VITE_SUPABASE_URL || 'https://syspsywxcutkwgjazxsb.supabase.co').trim();
export const SUPABASE_ANON_KEY = (import.meta.env?.VITE_SUPABASE_ANON_KEY || 'sb_publishable_E3QpJDuddcVjGED6ZBA3uQ_D35HC8dd').trim();

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});

export interface SupabaseHealth {
  connected: boolean;
  status: 'connected' | 'tables_missing' | 'error';
  message: string;
  url: string;
  tables: {
    customers: boolean;
    categories: boolean;
    settings: boolean;
  };
}

/**
 * Check connectivity and table availability in Supabase
 */
export async function checkSupabaseConnection(): Promise<SupabaseHealth> {
  const result: SupabaseHealth = {
    connected: false,
    status: 'error',
    message: '',
    url: SUPABASE_URL,
    tables: {
      customers: false,
      categories: false,
      settings: false
    }
  };

  try {
    // 1. Check customers table
    const { error: custErr } = await supabase.from('customers').select('id').limit(1);
    if (!custErr) {
      result.tables.customers = true;
    }

    // 2. Check categories table
    const { error: catErr } = await supabase.from('categories').select('id').limit(1);
    if (!catErr) {
      result.tables.categories = true;
    }

    // 3. Check store_settings table
    const { error: setErr } = await supabase.from('store_settings').select('id').limit(1);
    if (!setErr) {
      result.tables.settings = true;
    }

    if (result.tables.customers && result.tables.categories) {
      result.connected = true;
      result.status = 'connected';
      result.message = 'Supabase Cloud Database connected and synchronized.';
    } else {
      result.connected = true; // Connection worked, but schema missing
      result.status = 'tables_missing';
      result.message = 'Supabase reached! Database tables need to be created using the provided SQL schema in Supabase SQL Editor.';
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    result.status = 'error';
    result.message = `Could not connect to Supabase: ${errorMsg}`;
  }

  return result;
}

// --- Customer Sync ---
export async function fetchSupabaseCustomers(): Promise<Customer[] | null> {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      return null;
    }

    return data.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email || '',
      phone: row.phone,
      categoryId: row.category_id || undefined,
      categoryName: row.category_name || undefined,
      address: row.address || '',
      city: row.city || '',
      place: row.place || '',
      referredBy: row.referred_by || '',
      notes: row.notes || '',
      tags: row.tags || [],
      status: row.status || 'active',
      source: row.source || 'walkin_qr',
      scanId: row.scan_id || undefined,
      createdBy: row.created_by || 'Store Staff',
      qualityScore: row.quality_score ?? 100,
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.updated_at || new Date().toISOString()
    }));
  } catch {
    return null;
  }
}

export async function upsertSupabaseCustomer(c: Customer): Promise<boolean> {
  try {
    const payload = {
      id: c.id,
      name: c.name,
      email: c.email || '',
      phone: c.phone,
      category_id: c.categoryId || null,
      category_name: c.categoryName || '',
      address: c.address || '',
      city: c.city || '',
      place: c.place || '',
      referred_by: c.referredBy || '',
      notes: c.notes || '',
      tags: c.tags || [],
      status: c.status || 'active',
      source: c.source || 'walkin_qr',
      scan_id: c.scanId || null,
      created_by: c.createdBy || 'Store Staff',
      quality_score: c.qualityScore ?? 100,
      created_at: c.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase.from('customers').upsert(payload, { onConflict: 'id' });
    return !error;
  } catch {
    return false;
  }
}

export async function deleteSupabaseCustomer(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('customers').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

// --- Categories Sync ---
export async function fetchSupabaseCategories(): Promise<Category[] | null> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error || !data) return null;

    return data.map((row) => ({
      id: row.id,
      name: row.name,
      color: row.color || '#dfb76c',
      description: row.description || '',
      isDefault: Boolean(row.is_default),
      createdAt: row.created_at || new Date().toISOString()
    }));
  } catch {
    return null;
  }
}

export async function upsertSupabaseCategory(cat: Category): Promise<boolean> {
  try {
    const payload = {
      id: cat.id,
      name: cat.name,
      color: cat.color || '#dfb76c',
      description: cat.description || '',
      is_default: Boolean(cat.isDefault),
      created_at: cat.createdAt || new Date().toISOString()
    };
    const { error } = await supabase.from('categories').upsert(payload, { onConflict: 'id' });
    return !error;
  } catch {
    return false;
  }
}

// --- Store Settings Sync ---
export async function fetchSupabaseSettings(): Promise<Partial<StoreSettings> | null> {
  try {
    const { data, error } = await supabase
      .from('store_settings')
      .select('*')
      .eq('id', 'primary')
      .single();

    if (error || !data) return null;

    return {
      businessName: data.business_name,
      tagline: data.tagline,
      branchName: data.branch_name,
      address: data.address,
      city: data.city,
      state: data.state,
      pincode: data.pincode,
      phone: data.phone,
      whatsappPhone: data.whatsapp_phone,
      email: data.email,
      gstin: data.gstin,
      bisHallmarkNumber: data.bis_hallmark_number,
      currency: data.currency || '₹',
      enableDuplicateGuard: Boolean(data.enable_duplicate_guard),
      minPhoneDigits: data.min_phone_digits ?? 10,
      defaultCategoryId: data.default_category_id,
      autoFormatNames: Boolean(data.auto_format_names),
      requireCityOnWalkin: Boolean(data.require_city_on_walkin),
      standeeTagline: data.standee_tagline,
      qrIntakeActive: Boolean(data.qr_intake_active),
      qrWelcomeHeading: data.qr_welcome_heading,
      qrSubtitle: data.qr_subtitle,
      qrSuccessMessage: data.qr_success_message,
      collectAnniversaryDate: Boolean(data.collect_anniversary_date),
      masterSecurityPin: data.master_security_pin,
      allowStaffExports: Boolean(data.allow_staff_exports),
      sessionTimeoutMinutes: data.session_timeout_minutes ?? 60
    };
  } catch {
    return null;
  }
}

export async function saveSupabaseSettings(settings: StoreSettings): Promise<boolean> {
  try {
    const payload = {
      id: 'primary',
      business_name: settings.businessName,
      tagline: settings.tagline,
      branch_name: settings.branchName,
      address: settings.address,
      city: settings.city,
      state: settings.state,
      pincode: settings.pincode,
      phone: settings.phone,
      whatsapp_phone: settings.whatsappPhone,
      email: settings.email,
      gstin: settings.gstin,
      bis_hallmark_number: settings.bisHallmarkNumber,
      currency: settings.currency || '₹',
      enable_duplicate_guard: settings.enableDuplicateGuard,
      min_phone_digits: settings.minPhoneDigits,
      default_category_id: settings.defaultCategoryId,
      auto_format_names: settings.autoFormatNames,
      require_city_on_walkin: settings.requireCityOnWalkin,
      standee_tagline: settings.standeeTagline,
      qr_intake_active: settings.qrIntakeActive,
      qr_welcome_heading: settings.qrWelcomeHeading,
      qr_subtitle: settings.qrSubtitle,
      qr_success_message: settings.qrSuccessMessage,
      collect_anniversary_date: settings.collectAnniversaryDate,
      master_security_pin: settings.masterSecurityPin,
      allow_staff_exports: settings.allowStaffExports,
      session_timeout_minutes: settings.sessionTimeoutMinutes,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase.from('store_settings').upsert(payload, { onConflict: 'id' });
    return !error;
  } catch {
    return false;
  }
}

