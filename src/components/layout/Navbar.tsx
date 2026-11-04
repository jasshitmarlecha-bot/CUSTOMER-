import React from 'react';
import { QrCode, UserPlus, ShieldCheck, LogOut, Upload, Bell, ChevronDown, Menu } from 'lucide-react';
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
    <header className="bg-[#130c15]/95 backdrop-blur-md border-b border-[#2d1b28] sticky top-0 z-30 shadow-lg shadow-black/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Mobile Hamburger */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile/Tablet Menu Button to Slide Operations Drawer */}
          {onToggleMobileMenu && (
            <button
              type="button"
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 rounded-xl bg-[#1d121c] text-[#faeed4] hover:bg-[#281928] border border-[#482c40] flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition-all"
              title="Open Operations Menu"
              aria-label="Toggle operations navigation"
            >
              <Menu className="w-5 h-5 text-[#dfb76c]" />
              <span className="text-[11px] font-bold text-[#faeed4] hidden sm:inline">Menu</span>
            </button>
          )}

          <button
            onClick={() => onNavigateTab('dashboard')}
            className="flex items-center gap-2.5 sm:gap-3 text-left focus:outline-none group cursor-pointer"
          >
            {/* Royal Crown & Laurel Monogram Emblem without black background */}
            <div className="relative group-hover:scale-105 transition-transform shrink-0">
              <img
                src="/assets/aistudio/giri_jewellers_logo_transparent.png"
                alt="Giri Jewellers Crest"
                className="w-9 h-9 sm:w-10 sm:h-10 object-contain drop-shadow-[0_0_10px_rgba(245,215,127,0.45)]"
              />
            </div>
            <div>
              <span className="font-cinzel text-base sm:text-lg font-bold tracking-[0.16em] text-[#fae7ba] uppercase block leading-tight">
                {businessName || 'GIRI JEWELLERS'}
              </span>
              <p className="text-[10.5px] text-[#d6be9a] hidden sm:block font-medium tracking-wide">
                Customer Database & Showroom QR Suite
              </p>
            </div>
          </button>
        </div>

        {/* Quick Actions & Staff Profile */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* QR Center Button */}
          <button
            onClick={() => onNavigateTab('qr_common')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#f2e6ee] bg-[#1a111a] hover:bg-[#281928] border border-[#482c40] rounded-xl transition-all cursor-pointer shadow-xs"
            title="Open Showroom QR Center"
          >
            <QrCode className="w-3.5 h-3.5 text-[#dfb76c]" />
            <span>QR Center</span>
          </button>

          {/* Import Data Button */}
          {permissions.canImportData && (
            <button
              onClick={() => onNavigateTab('import')}
              className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#f2e6ee] bg-[#1a111a] hover:bg-[#281928] border border-[#482c40] rounded-xl transition-all cursor-pointer shadow-xs"
              title="Import outside customer data (Excel & CSV)"
            >
              <Upload className="w-3.5 h-3.5 text-[#dfb76c]" />
              <span>Import Data</span>
            </button>
          )}

          {/* + Add Walk-In Button (Warm Champagne Gold from Screenshot) */}
          {permissions.canAddEditCustomers && (
            <button
              onClick={onOpenAddCustomer}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-[#1c1206] bg-gradient-to-r from-[#fae2ab] to-[#f0cc85] hover:brightness-105 active:scale-95 rounded-xl shadow-[0_2px_12px_rgba(250,226,171,0.25)] transition-all cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 text-[#1c1206] stroke-[2.5]" />
              <span>+ Add Walk-In</span>
            </button>
          )}

          {/* Staff Access Control Button */}
          {currentUser.role === 'admin' && (
            <button
              onClick={onOpenStaffAccessModal}
              className="hidden lg:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#f2e6ee] bg-[#1a111a] hover:bg-[#281928] border border-[#482c40] rounded-xl transition-all cursor-pointer shadow-xs"
              title="Manage Staff Permissions & Access"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#d8b4fe]" />
              <span>Staff Access Control</span>
            </button>
          )}

          {/* User Account / Role Pill */}
          <div className="hidden sm:flex items-center gap-1.5 text-right pl-2 pr-1">
            <div>
              <p className="text-[11px] font-semibold text-[#cfb7c8] leading-tight">Store Manager</p>
              <div className="flex items-center gap-1 text-xs text-[#fae7ba] font-bold">
                <span>{currentUser.role === 'admin' ? 'Store Admin' : 'Counter Staff'}</span>
                <ChevronDown className="w-3 h-3 text-[#dfb76c]" />
              </div>
            </div>
          </div>

          {/* Log Out Button */}
          <button
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#f2e6ee] bg-[#1a111a] hover:bg-[#281928] border border-[#482c40] rounded-xl transition-all cursor-pointer shadow-xs"
            title="Log out and return to password login gate"
          >
            <LogOut className="w-3.5 h-3.5 text-[#d8b4fe]" />
            <span>Log Out</span>
          </button>

          {/* Bell with red indicator dot */}
          <div className="relative p-1.5 text-[#d8b4fe] hidden sm:block cursor-pointer hover:text-white">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[#130c15]" />
          </div>
        </div>
      </div>
    </header>
  );
};
