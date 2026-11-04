import React from 'react';
import { QrCode, UserPlus, ShieldCheck, LogOut, Upload, ChevronDown, Menu } from 'lucide-react';
import { StaffUser } from '../../types/index.ts';

interface NavbarProps {
  currentUser: StaffUser;
  onLogout: () => void;
  onOpenStaffAccessModal: () => void;
  onOpenAddCustomer: () => void;
  onNavigateTab: (tab: string) => void;
  businessName: string;
  onToggleMobileMenu?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onLogout,
  onOpenStaffAccessModal,
  onOpenAddCustomer,
  onNavigateTab,
  businessName,
  onToggleMobileMenu
}) => {
  const permissions = currentUser.permissions || {
    canAddEditCustomers: currentUser.role === 'admin',
    canImportData: currentUser.role === 'admin',
    canViewCommonQR: true
  };

  return (
    <header className="bg-[#fbf8f2]/95 backdrop-blur-md border-b border-[#e8decb] sticky top-0 z-30 shadow-xs">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Mobile Brand & Hamburger Button */}
        <div className="flex items-center gap-2.5">
          {onToggleMobileMenu && (
            <button
              type="button"
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 rounded-full bg-[#ffffff] text-[#1c2621] hover:bg-[#f4ece0] border border-[#dfd3bd] flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
              title="Open Navigation Menu"
              aria-label="Toggle navigation"
            >
              <Menu className="w-5 h-5 text-[#b08738]" />
              <span className="text-[11px] font-bold hidden sm:inline">Menu</span>
            </button>
          )}

          {/* Mobile visible logo */}
          <button
            onClick={() => onNavigateTab('dashboard')}
            className="lg:hidden flex items-center gap-2 text-left focus:outline-none cursor-pointer"
          >
            <div className="w-7 h-7 shrink-0 text-[#b08738]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M6 3h12l4 6-10 12L2 9z" />
                <path d="M11 3v18" />
                <path d="M2 9h20" />
              </svg>
            </div>
            <span className="font-cinzel text-sm font-bold tracking-wider text-[#1c2621] uppercase">
              {businessName || 'GIRI JEWELLERS'}
            </span>
          </button>
        </div>

        {/* Action Pills & Profile (Matching Screenshot Exactly) */}
        <div className="flex items-center gap-2 sm:gap-2.5 ml-auto">
          {/* QR Center Button */}
          <button
            onClick={() => onNavigateTab('qr_common')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#1c2823] bg-[#ffffff] hover:bg-[#f6eee0] border border-[#dfd3bd] transition-all cursor-pointer shadow-xs"
            title="Open Showroom QR Center"
          >
            <QrCode className="w-3.5 h-3.5 text-[#b08738]" />
            <span>QR Center</span>
          </button>

          {/* Import Data Button */}
          {permissions.canImportData && (
            <button
              onClick={() => onNavigateTab('import')}
              className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#1c2823] bg-[#ffffff] hover:bg-[#f6eee0] border border-[#dfd3bd] transition-all cursor-pointer shadow-xs"
              title="Import outside customer data (Excel & CSV)"
            >
              <Upload className="w-3.5 h-3.5 text-[#b08738]" />
              <span>Import Data</span>
            </button>
          )}

          {/* + Add Walk-In Button (Dark Emerald Pill from Screenshot) */}
          {permissions.canAddEditCustomers && (
            <button
              onClick={onOpenAddCustomer}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold text-[#f7eedf] bg-[#0b241c] hover:bg-[#12362b] active:scale-95 border border-[#1b4334] shadow-xs transition-all cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 text-[#f7eedf] stroke-[2.4]" />
              <span>Add Walk-In</span>
            </button>
          )}

          {/* Staff Access Control Button */}
          {currentUser.role === 'admin' && (
            <button
              onClick={onOpenStaffAccessModal}
              className="hidden lg:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#1c2823] bg-[#ffffff] hover:bg-[#f6eee0] border border-[#dfd3bd] transition-all cursor-pointer shadow-xs"
              title="Manage Staff Permissions & Access"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#0f3d2e]" />
              <span>Staff Access Control</span>
            </button>
          )}

          {/* User Account / Role Pill */}
          <div className="hidden sm:flex items-center gap-1.5 text-right pl-2 pr-1">
            <div>
              <p className="text-[10.5px] font-medium text-[#73847e] leading-tight">Store Manager</p>
              <div className="flex items-center gap-1 text-xs text-[#14261f] font-bold">
                <span>{currentUser.role === 'admin' ? 'Store Admin' : 'Counter Staff'}</span>
                <ChevronDown className="w-3 h-3 text-[#b08738]" />
              </div>
            </div>
          </div>

          {/* Log Out Button */}
          <button
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-[#1c2823] bg-[#ffffff] hover:bg-[#f6eee0] border border-[#dfd3bd] transition-all cursor-pointer shadow-xs"
            title="Log out and return to password login gate"
          >
            <LogOut className="w-3.5 h-3.5 text-[#73847e]" />
            <span className="hidden sm:inline">Log Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};
