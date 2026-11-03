import React from 'react';
import {
  QrCode,
  UserPlus,
  Shield,
  LogOut,
  Upload,
  Menu
} from 'lucide-react';
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
    <header className="bg-[#12141a] border-b border-[#21242d] sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Mobile Hamburger */}
        <div className="flex items-center gap-3">
          {onToggleMobileMenu && (
            <button
              type="button"
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 rounded-lg bg-[#181a22] text-[#f4f5f7] hover:bg-[#20232c] border border-[#272b36] flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Open Navigation"
              aria-label="Toggle operations navigation"
            >
              <Menu className="w-4 h-4 text-[#d4af37]" />
            </button>
          )}

          <button
            onClick={() => onNavigateTab('dashboard')}
            className="flex items-center gap-3 text-left focus:outline-none group cursor-pointer"
          >
            <img
              src="/assets/aistudio/giri_jewellers_logo_transparent.png"
              alt="Giri Jewellers Crest"
              className="w-8 h-8 object-contain shrink-0"
            />
            <div>
              <span className="font-cinzel text-sm sm:text-base font-semibold tracking-[0.14em] text-[#e8c86d] uppercase block leading-tight">
                {businessName || 'GIRI JEWELLERS'}
              </span>
              <p className="text-[11px] text-[#8a919e] hidden sm:block font-normal">
                Customer Management & Showroom Suite
              </p>
            </div>
          </button>
        </div>

        {/* Action Controls & User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Showroom QR Portal */}
          <button
            onClick={() => onNavigateTab('qr_common')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#c0c6d2] hover:text-white bg-[#181b22] hover:bg-[#20242e] border border-[#262a34] rounded-lg transition-colors cursor-pointer"
            title="Open Showroom QR Center"
          >
            <QrCode className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>QR Intake</span>
          </button>

          {/* Import Customer Data */}
          {permissions.canImportData && (
            <button
              onClick={() => onNavigateTab('import')}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#c0c6d2] hover:text-white bg-[#181b22] hover:bg-[#20242e] border border-[#262a34] rounded-lg transition-colors cursor-pointer"
              title="Import Excel or CSV records"
            >
              <Upload className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>Import</span>
            </button>
          )}

          {/* Add Walk-In (Primary CTA) */}
          {permissions.canAddEditCustomers && (
            <button
              onClick={onOpenAddCustomer}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#14161d] bg-[#d4af37] hover:bg-[#e0bc45] active:bg-[#c29f2f] rounded-lg transition-colors cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 text-[#14161d] stroke-[2.5]" />
              <span>New Walk-In</span>
            </button>
          )}

          {/* Staff Access Administration */}
          {currentUser.role === 'admin' && (
            <button
              onClick={onOpenStaffAccessModal}
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#c0c6d2] hover:text-white bg-[#181b22] hover:bg-[#20242e] border border-[#262a34] rounded-lg transition-colors cursor-pointer"
              title="Staff Permissions & User Roster"
            >
              <Shield className="w-3.5 h-3.5 text-[#8a919e]" />
              <span>Staff Access</span>
            </button>
          )}

          {/* User Account / Role Pill */}
          <div className="flex items-center gap-2 pl-2 border-l border-[#21242d]">
            <div className="hidden sm:block text-right">
              <span className="block text-xs font-medium text-[#e4e7eb] leading-tight">
                {currentUser.name}
              </span>
              <span className="text-[10px] text-[#8a919e] font-normal uppercase tracking-wider">
                {currentUser.role === 'admin' ? 'Store Admin' : 'Counter Staff'}
              </span>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="p-1.5 rounded-lg text-[#8a919e] hover:text-white hover:bg-[#1e212b] transition-colors cursor-pointer"
              title="Sign Out"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
