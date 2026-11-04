import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  Users,
  Plus,
  Trash2,
  Key,
  Eye,
  EyeOff,
  Copy,
  Check,
  Shield,
  Download,
  Upload,
  Printer,
  Tags,
  BarChart3,
  QrCode,
  Sparkles,
  RefreshCw,
  Phone
} from 'lucide-react';
import { StaffUser, StaffPermissions } from '../../types/index.ts';
import { getStaffUsers, addStaffUser, updateStaffUser, deleteStaffUser } from '../../api/client.ts';

interface StaffAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPermissions: StaffPermissions;
  onSavePermissions: (permissions: StaffPermissions) => Promise<void>;
  onUpdatePassword: (role: 'admin' | 'staff', newPass: string) => Promise<void>;
}

export const StaffAccessModal: React.FC<StaffAccessModalProps> = ({
  isOpen,
  onClose,
  currentPermissions,
  onSavePermissions
}) => {
  const [activeTab, setActiveTab] = useState<'roster' | 'permissions'>('roster');
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  const [permissions, setPermissions] = useState<StaffPermissions>(currentPermissions);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // New Staff Creation Form State
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffUsername, setNewStaffUsername] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [newStaffPhone, setNewStaffPhone] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<'staff' | 'admin'>('staff');
  const [showNewPassword, setShowNewPassword] = useState(true);
  const [isCreatingStaff, setIsCreatingStaff] = useState(false);

  // Password visibility map for existing staff: Record<userId, boolean>
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Inline Password Change state for an existing user
  const [editingPasswordUserId, setEditingPasswordUserId] = useState<string | null>(null);
  const [inlineNewPassword, setInlineNewPassword] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadStaff();
      setPermissions(currentPermissions);
    }
  }, [isOpen, currentPermissions]);

  const loadStaff = async () => {
    setIsLoadingStaff(true);
    try {
      const users = await getStaffUsers();
      setStaffUsers(users);
    } catch (err: any) {
      console.error('Failed to load staff list', err);
    } finally {
      setIsLoadingStaff(false);
    }
  };

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    setNewStaffName(val);
    const slug = val.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!newStaffUsername || newStaffUsername === slug.slice(0, -1)) {
      setNewStaffUsername(slug);
    }
  };

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewStaffPassword(`Giri@${result.slice(0, 4)}`);
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim()) {
      setNotice({ type: 'error', message: 'Please enter staff member name.' });
      return;
    }
    if (!newStaffPassword.trim()) {
      setNotice({ type: 'error', message: 'Please specify a password for this staff member.' });
      return;
    }

    setIsCreatingStaff(true);
    setNotice(null);
    try {
      const created = await addStaffUser({
        name: newStaffName.trim(),
        usernameOrEmail: newStaffUsername.trim() || newStaffName.toLowerCase().replace(/[^a-z0-9]/g, ''),
        password: newStaffPassword.trim(),
        phone: newStaffPhone.trim() || undefined,
        role: newStaffRole
      });

      setNotice({
        type: 'success',
        message: `Account created for "${created.name}"! Share login "${created.email}" and password "${created.password}" with them.`
      });

      // Clear form
      setNewStaffName('');
      setNewStaffUsername('');
      setNewStaffPassword('');
      setNewStaffPhone('');
      await loadStaff();
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Failed to create staff member.' });
    } finally {
      setIsCreatingStaff(false);
    }
  };

  const handleTogglePasswordVisibility = (userId: string) => {
    setRevealedPasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const handleCopyCredentials = (user: StaffUser) => {
    const text = `Giri Jewellers Portal Login:\nUsername/Email: ${user.email}\nPassword: ${user.password || 'Contact Admin'}\nRole: ${user.role === 'admin' ? 'Store Admin' : 'Counter Staff'}`;
    navigator.clipboard.writeText(text);
    setCopiedId(user.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleSaveInlinePassword = async (userId: string) => {
    if (!inlineNewPassword.trim() || inlineNewPassword.trim().length < 4) {
      setNotice({ type: 'error', message: 'Password must be at least 4 characters long.' });
      return;
    }
    try {
      await updateStaffUser(userId, { password: inlineNewPassword.trim() });
      setNotice({ type: 'success', message: 'Staff password updated successfully!' });
      setEditingPasswordUserId(null);
      setInlineNewPassword('');
      await loadStaff();
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Failed to update password.' });
    }
  };

  const handleDeleteStaff = async (user: StaffUser) => {
    if (user.id === 'user-admin-1') {
      setNotice({ type: 'error', message: 'Primary Admin account cannot be deleted.' });
      return;
    }
    if (!window.confirm(`Are you sure you want to remove staff member "${user.name}"? They will no longer be able to log in.`)) {
      return;
    }
    try {
      await deleteStaffUser(user.id);
      setNotice({ type: 'success', message: `Staff member ${user.name} removed successfully.` });
      await loadStaff();
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Failed to delete staff member.' });
    }
  };

  const togglePermission = (key: keyof StaffPermissions) => {
    setPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSelectAll = (val: boolean) => {
    setPermissions({
      canViewCustomers: val,
      canAddEditCustomers: val,
      canDeleteCustomers: val,
      canExportData: val,
      canImportData: val,
      canPrintData: val,
      canManageCategories: val,
      canRunCleaning: val,
      canViewAnalytics: val,
      canViewCommonQR: val
    });
  };

  const handleSavePermissions = async () => {
    setIsSaving(true);
    setNotice(null);
    try {
      await onSavePermissions(permissions);
      setNotice({ type: 'success', message: 'Staff permissions updated and synced successfully!' });
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Failed to update staff permissions.' });
    } finally {
      setIsSaving(false);
    }
  };

  const permissionItems: Array<{
    key: keyof StaffPermissions;
    label: string;
    description: string;
    icon: any;
  }> = [
    {
      key: 'canViewCustomers',
      label: 'View Customer Directory',
      description: 'Can see list of customers and search profiles',
      icon: Users
    },
    {
      key: 'canAddEditCustomers',
      label: 'Add & Edit Customer Records',
      description: 'Can create new walk-in entries and edit details',
      icon: Plus
    },
    {
      key: 'canDeleteCustomers',
      label: 'Delete Customer Records',
      description: 'Can remove profiles or purge customer records',
      icon: Trash2
    },
    {
      key: 'canExportData',
      label: 'Export Data (Excel & CSV)',
      description: 'Can download customer database into Excel spreadsheets',
      icon: Download
    },
    {
      key: 'canImportData',
      label: 'Import Customer Data',
      description: 'Can bulk import files into showroom database',
      icon: Upload
    },
    {
      key: 'canPrintData',
      label: 'Print Customer Rosters',
      description: 'Can generate print documents and summaries',
      icon: Printer
    },
    {
      key: 'canManageCategories',
      label: 'Manage Jewellery Categories',
      description: 'Can create, edit, and delete category interest tags',
      icon: Tags
    },
    {
      key: 'canRunCleaning',
      label: 'Resolve Duplicates & Hygiene',
      description: 'Can execute duplicate consolidation and conflict merges',
      icon: Sparkles
    },
    {
      key: 'canViewAnalytics',
      label: 'View Footfall & Analytics Hub',
      description: 'Can inspect showroom performance and conversion charts',
      icon: BarChart3
    },
    {
      key: 'canViewCommonQR',
      label: 'Access Showroom QR Standee',
      description: 'Can access and print counter QR standees',
      icon: QrCode
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#040e0b]/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#ffffff] border border-[#ede3d3] w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-[#0b241c] font-sans">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#ede3d3] flex items-center justify-between bg-[#faf7f0]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0b241c] text-[#dfb76c] flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-[#0b241c] flex items-center gap-2">
                <span>Staff Access & Password Management</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#f4ece1] text-[#785b1f] border border-[#dfb76c]/40 font-mono">
                  Giri Jewellers
                </span>
              </h2>
              <p className="text-xs text-[#718079]">
                Add staff members, create passwords to give them, and manage counter access permissions.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#718079] hover:text-[#0b241c] hover:bg-[#ede3d3] rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-[#ede3d3] bg-[#ffffff]">
          <button
            type="button"
            onClick={() => setActiveTab('roster')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'roster'
                ? 'border-[#0b241c] text-[#0b241c] bg-[#faf7f0]'
                : 'border-transparent text-[#718079] hover:text-[#0b241c]'
            }`}
          >
            <Users className="w-4 h-4 text-[#b08738]" />
            <span>Staff Roster & Passwords ({staffUsers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('permissions')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'permissions'
                ? 'border-[#0b241c] text-[#0b241c] bg-[#faf7f0]'
                : 'border-transparent text-[#718079] hover:text-[#0b241c]'
            }`}
          >
            <Shield className="w-4 h-4 text-[#b08738]" />
            <span>Staff Permissions Matrix</span>
          </button>
        </div>

        {/* Notification Banner */}
        {notice && (
          <div
            className={`mx-6 mt-4 p-3.5 rounded-2xl border text-xs flex items-center justify-between gap-2 shadow-xs ${
              notice.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-rose-50 border-rose-300 text-rose-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {notice.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span className="font-medium">{notice.message}</span>
            </div>
            <button
              onClick={() => setNotice(null)}
              className="text-xs hover:opacity-100 opacity-70 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {activeTab === 'roster' ? (
            <div className="space-y-6">
              {/* Card 1: Add New Staff Member Form */}
              <div className="bg-[#ffffff] border border-[#ede3d3] rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#ede3d3]">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#0b241c] text-[#dfb76c] flex items-center justify-center">
                      <Plus className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-bold text-[#0b241c]">Add Staff Member & Create Password</h3>
                  </div>
                  <span className="text-[11px] text-[#b08738] font-semibold">
                    Store Owner / Admin Tool
                  </span>
                </div>

                <form onSubmit={handleCreateStaff} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Staff Name */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#1c2e26] block">
                        Staff Member Full Name <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={newStaffName}
                        onChange={(e) => handleNameChange(e.target.value)}
                        placeholder="e.g. Anjali Nair, Rahul Krishna"
                        required
                        className="w-full text-xs px-3.5 py-2.5 bg-[#faf7f0] border border-[#ded7ca] focus:border-[#0b241c] rounded-xl text-[#0b241c] placeholder-[#97a49e] focus:outline-none font-medium"
                      />
                    </div>

                    {/* Login Username */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#1c2e26] block">
                        Login Username or Email
                      </label>
                      <input
                        type="text"
                        value={newStaffUsername}
                        onChange={(e) => setNewStaffUsername(e.target.value)}
                        placeholder="e.g. anjali or anjali@girijewels.com"
                        className="w-full text-xs px-3.5 py-2.5 bg-[#faf7f0] border border-[#ded7ca] focus:border-[#0b241c] rounded-xl text-[#0b241c] placeholder-[#97a49e] focus:outline-none font-medium"
                      />
                    </div>

                    {/* Staff Password with generator */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-[#1c2e26] block">
                          Create Staff Password <span className="text-rose-600">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={handleGeneratePassword}
                          className="text-[11px] text-[#0b241c] hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                        >
                          <Sparkles className="w-3 h-3 text-[#b08738]" />
                          <span>Generate Password</span>
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={newStaffPassword}
                          onChange={(e) => setNewStaffPassword(e.target.value)}
                          placeholder="e.g. Giri@2025"
                          required
                          className="w-full text-xs font-mono px-3.5 py-2.5 pr-10 bg-[#faf7f0] border border-[#ded7ca] focus:border-[#0b241c] rounded-xl text-[#0b241c] placeholder-[#97a49e] focus:outline-none font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#718079] hover:text-[#0b241c] cursor-pointer"
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <span className="text-[10.5px] text-[#718079] block">
                        You can show this password to your staff member so they can log in.
                      </span>
                    </div>

                    {/* Staff Role */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#1c2e26] block">
                        Staff Role
                      </label>
                      <select
                        value={newStaffRole}
                        onChange={(e) => setNewStaffRole(e.target.value as any)}
                        className="w-full text-xs px-3.5 py-2.5 bg-[#faf7f0] border border-[#ded7ca] focus:border-[#0b241c] rounded-xl text-[#0b241c] focus:outline-none cursor-pointer font-medium"
                      >
                        <option value="staff">Counter Staff (Standard)</option>
                        <option value="admin">Store Admin (Full Showroom Control)</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={isCreatingStaff || !newStaffName.trim() || !newStaffPassword.trim()}
                      className="px-5 py-2.5 bg-[#0b241c] hover:bg-[#12362b] active:scale-95 text-[#f7eedf] border border-[#dfb76c]/40 font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-40"
                    >
                      <Plus className="w-4 h-4 text-[#dfb76c]" />
                      <span>{isCreatingStaff ? 'Creating Staff Account...' : 'Create Staff & Password'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Card 2: Current Staff Roster & Passwords Table */}
              <div className="bg-[#ffffff] border border-[#ede3d3] rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#ede3d3]">
                  <div>
                    <h3 className="text-sm font-bold text-[#0b241c] flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#b08738]" />
                      <span>Active Staff Accounts & Passwords</span>
                    </h3>
                    <p className="text-[11px] text-[#718079] mt-0.5">
                      View assigned credentials, reveal passwords to give to staff, or reset credentials.
                    </p>
                  </div>
                  <button
                    onClick={loadStaff}
                    className="p-1.5 text-[#718079] hover:text-[#0b241c] bg-[#faf7f0] rounded-lg border border-[#ede3d3] cursor-pointer"
                    title="Refresh list"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingStaff ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#faf7f0] text-[#718079] font-semibold border-b border-[#ede3d3]">
                      <tr>
                        <th className="py-3 px-3">Staff Name</th>
                        <th className="py-3 px-3">Role</th>
                        <th className="py-3 px-3">Login Username / Email</th>
                        <th className="py-3 px-3">Password</th>
                        <th className="py-3 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#ede3d3]">
                      {staffUsers.map((user) => {
                        const isRevealed = Boolean(revealedPasswords[user.id]);
                        const isEditingThisPassword = editingPasswordUserId === user.id;

                        return (
                          <tr key={user.id} className="hover:bg-[#faf7f0] transition-colors">
                            {/* Staff Name */}
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-[#0b241c] text-[#dfb76c] flex items-center justify-center font-bold text-[11px]">
                                  {user.name.slice(0, 1).toUpperCase()}
                                </div>
                                <div>
                                  <span className="font-bold text-[#0b241c] block">{user.name}</span>
                                  {user.phone && (
                                    <span className="text-[10.5px] text-[#718079] flex items-center gap-1 font-mono">
                                      <Phone className="w-2.5 h-2.5 text-[#b08738]" />
                                      {user.phone}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Role */}
                            <td className="py-3 px-3">
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  user.role === 'admin'
                                    ? 'bg-[#f4ece1] text-[#785b1f] border border-[#dfb76c]/40 font-mono'
                                    : 'bg-[#faf7f0] text-[#4b5a54] border border-[#ded7ca]'
                                }`}
                              >
                                {user.role === 'admin' ? 'Store Admin' : 'Counter Staff'}
                              </span>
                            </td>

                            {/* Login Email / Username */}
                            <td className="py-3 px-3 font-mono text-[#0b241c]">
                              {user.email}
                            </td>

                            {/* Password display & Reveal */}
                            <td className="py-3 px-3">
                              {isEditingThisPassword ? (
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="text"
                                    value={inlineNewPassword}
                                    onChange={(e) => setInlineNewPassword(e.target.value)}
                                    placeholder="Enter new password"
                                    className="w-32 px-2 py-1 text-xs bg-white border border-[#0b241c] rounded-lg text-[#0b241c] font-mono focus:outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleSaveInlinePassword(user.id)}
                                    className="px-2 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[11px] font-bold cursor-pointer"
                                  >
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingPasswordUserId(null)}
                                    className="px-2 py-1 text-[#718079] hover:text-[#0b241c] rounded text-[11px] cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs text-[#0b241c] bg-[#faf7f0] px-2.5 py-1 rounded-lg border border-[#ede3d3]">
                                    {isRevealed ? (user.password || '••••••••') : '••••••••'}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleTogglePasswordVisibility(user.id)}
                                    className="p-1 text-[#718079] hover:text-[#0b241c] cursor-pointer"
                                    title={isRevealed ? 'Hide Password' : 'Show Password to give to staff'}
                                  >
                                    {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                  </button>
                                </div>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleCopyCredentials(user)}
                                  className="p-1.5 bg-[#ffffff] hover:bg-[#faf7f0] border border-[#ded7ca] text-[#0b241c] rounded-lg transition-colors cursor-pointer shadow-xs"
                                  title="Copy Login & Password to share with staff"
                                >
                                  {copiedId === user.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingPasswordUserId(user.id);
                                    setInlineNewPassword(user.password || '');
                                  }}
                                  className="px-2.5 py-1 bg-[#ffffff] hover:bg-[#faf7f0] text-[#0b241c] border border-[#ded7ca] rounded-lg text-[11px] font-semibold transition-colors cursor-pointer shadow-xs"
                                  title="Change Password"
                                >
                                  <Key className="w-3 h-3 inline mr-1 text-[#b08738]" />
                                  <span>Change</span>
                                </button>

                                {user.role !== 'admin' && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteStaff(user)}
                                    className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                    title="Delete staff member"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            /* Tab 2: Permissions Matrix */
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#faf7f0] p-4 rounded-2xl border border-[#ede3d3]">
                <div>
                  <h3 className="text-sm font-bold text-[#0b241c]">Counter Staff Role Permissions</h3>
                  <p className="text-xs text-[#718079]">
                    Control what features your counter staff can access and execute in the showroom suite.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectAll(true)}
                    className="px-3 py-1.5 text-xs font-semibold text-[#0b241c] bg-[#ffffff] hover:bg-[#ede3d3] border border-[#ded7ca] rounded-xl transition-colors cursor-pointer"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectAll(false)}
                    className="px-3 py-1.5 text-xs font-semibold text-[#718079] hover:text-[#0b241c] bg-[#ffffff] border border-[#ded7ca] rounded-xl transition-colors cursor-pointer"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              {/* Grid of Permission Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {permissionItems.map((item) => {
                  const isChecked = permissions[item.key];
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.key}
                      onClick={() => togglePermission(item.key)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                        isChecked
                          ? 'bg-[#ffffff] border-[#0b241c] shadow-xs ring-1 ring-[#0b241c]/15'
                          : 'bg-[#faf7f0] border-[#ede3d3] opacity-75'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                          isChecked
                            ? 'bg-[#0b241c] text-[#dfb76c] border-[#0b241c]'
                            : 'bg-[#ffffff] text-[#718079] border-[#ded7ca]'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs font-bold text-[#0b241c] truncate">{item.label}</h4>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="w-4 h-4 rounded text-[#0b241c] focus:ring-[#0b241c] bg-[#ffffff] border-[#ded7ca] cursor-pointer accent-[#0b241c]"
                          />
                        </div>
                        <p className="text-[11px] text-[#718079] mt-0.5 line-clamp-2">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleSavePermissions}
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-[#0b241c] hover:bg-[#12362b] active:scale-95 text-[#f7eedf] border border-[#dfb76c]/40 font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4 text-[#dfb76c]" />
                  <span>{isSaving ? 'Saving Permissions...' : 'Save Permissions'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-[#ede3d3] bg-[#faf7f0] flex items-center justify-between">
          <p className="text-[11px] text-[#718079]">
            {activeTab === 'roster'
              ? 'Give the created login username and password to your staff member to access the showroom portal.'
              : 'Permissions take effect across counter terminals immediately.'}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#ffffff] hover:bg-[#ede3d3] text-[#0b241c] border border-[#ded7ca] rounded-xl text-xs font-bold cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
