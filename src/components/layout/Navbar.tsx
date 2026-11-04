import React from 'react';
import { QrCode, UserPlus, ShieldCheck, LogOut, Upload, ChevronDown, Menu, Store, ChevronRight } from 'lucide-react';
import { StaffUser } from '../../types/index.ts';

interface NavbarProps {
  currentUser: StaffUser;
  onLogout: () => void;
  onOpenStaffAccessModal: () => void;
  onOpenAddCustomer: () => void;
  onNavigateTab: (tab: string) => void;
  businessName: string;
  onToggleMobileMenu?: () => void;
  activeTab?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onLogout,
  onOpenStaffAccessModal,
  onOpenAddCustomer,
  onNavigateTab,
  businessName,
  onToggleMobileMenu,
  activeTab = 'dashboard'
}) => {
  const permissions = currentUser.permissions || {
    canAddEditCustomers: currentUser.role === 'admin',
    canImportData: currentUser.role === 'admin',
    canViewCommonQR: true
  };

  const getBreadcrumb = (tab: string) => {
    switch (tab) {
      case 'customers':
        return { section: 'Store Operations', page: 'Customer Directory' };
      case 'import':
        return { section: 'Store Operations', page: 'Import Customer Data' };
      case 'duplicates':
        return { section: 'Store Operations', page: 'Duplicate Manager' };
      case 'qr_common':
      case 'intake':
      case 'qr_print':
      case 'qr_activity':
        return { section: 'Store Operations', page: 'Showroom QR Standee' };
      case 'analytics':
      case 'cleaning':
        return { section: 'Store Analytics', page: 'Footfall & Performance' };
      case 'categories':
        return { section: 'Showroom Setup', page: 'Jewellery Categories' };
      case 'settings':
        return { section: 'Showroom Setup', page: 'Settings & Backups' };
      case 'dashboard':
      default:
        return { section: 'Store Operations', page: 'Store Dashboard' };
    }
  };

  const breadcrumb = getBreadcrumb(activeTab);

  return (
    <header className="bg-[#faf4f0]/95 backdrop-blur-md border-b border-[#ebdcd3] sticky top-0 z-30 shadow-xs">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Mobile Brand & Hamburger Button */}
        <div className="flex items-center gap-2.5">
          {onToggleMobileMenu && (
            <button
              type="button"
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 rounded-full bg-[#ffffff] text-[#2a0717] hover:bg-[#f5e9e2] border border-[#ebdcd3] flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
              title="Open Navigation Menu"
              aria-label="Toggle navigation"
            >
              <Menu className="w-5 h-5 text-[#3d0c22]" />
              <span className="text-[11px] font-bold hidden sm:inline">Menu</span>
            </button>
          )}

          {/* Mobile visible logo */}
          <button
            onClick={() => onNavigateTab('dashboard')}
            className="lg:hidden flex items-center gap-2 text-left focus:outline-none cursor-pointer"
          >
            <div className="w-7 h-7 shrink-0 text-[#dfb76c]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M6 3h12l4 6-10 12L2 9z" />
                <path d="M11 3v18" />
                <path d="M2 9h20" />
              </svg>
            </div>
            <span className="font-cinzel text-sm font-black tracking-wider text-[#2a0717] uppercase">
              {businessName || 'GIRI JEWELLERS'}
            </span>
          </button>

          {/* Desktop Breadcrumb Wayfinding */}
          <div className="hidden lg:flex items-center gap-2 text-xs font-medium text-[#876876]">
            <button
              type="button"
              onClick={() => onNavigateTab('dashboard')}
              className="flex items-center gap-1.5 hover:text-[#2a0717] transition-colors cursor-pointer"
            >
              <Store className="w-3.5 h-3.5 text-[#3d0c22]" />
              <span className="font-cinzel text-[11px] font-bold uppercase tracking-wider text-[#2a0717]">
                {businessName}
              </span>
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-[#cfb6c2]" />
            <span className="text-[#8a6877] text-[11px] font-medium">{breadcrumb.section}</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#cfb6c2]" />
            <span className="text-[#2a0717] font-bold text-xs">
              {breadcrumb.page}
            </span>
          </div>
        </div>

        {/* Action Pills & Profile (Matching Design Mockup) */}
        <div className="flex items-center gap-2 sm:gap-2.5 ml-auto">
          {/* QR Center Button */}
          <button
            onClick={() => onNavigateTab('qr_common')}
            className={`hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer shadow-xs ${
              activeTab === 'qr_common' || activeTab.startsWith('qr_')
                ? 'bg-[#3d0c22] text-[#ffffff] border border-[#dfb76c]/40 font-bold shadow-xs'
                : 'text-[#2a0717] bg-[#ffffff] hover:bg-[#f6ebe4] border border-[#ebdcd3]'
            }`}
            title="Open Showroom QR Center"
          >
            <QrCode className={`w-3.5 h-3.5 ${activeTab === 'qr_common' ? 'text-[#dfb76c]' : 'text-[#3d0c22]'}`} />
            <span className="font-semibold">QR Center</span>
          </button>

          {/* Import Data Button */}
          {permissions.canImportData && (
            <button
              onClick={() => onNavigateTab('import')}
              className={`hidden md:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer shadow-xs ${
                activeTab === 'import'
                  ? 'bg-[#3d0c22] text-[#ffffff] border border-[#dfb76c]/40 font-bold shadow-xs'
                  : 'text-[#2a0717] bg-[#ffffff] hover:bg-[#f6ebe4] border border-[#ebdcd3]'
              }`}
              title="Import outside customer data (Excel & CSV)"
            >
              <Upload className={`w-3.5 h-3.5 ${activeTab === 'import' ? 'text-[#dfb76c]' : 'text-[#3d0c22]'}`} />
              <span className="font-semibold">Import Data</span>
            </button>
          )}

          {/* + Add Walk-In Button (Prominent Velvet Burgundy Pill from Mockup) */}
          {permissions.canAddEditCustomers && (
            <button
              onClick={onOpenAddCustomer}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-[#ffffff] bg-[#3d0c22] hover:bg-[#521130] active:scale-95 border border-[#5c1334] shadow-md shadow-[#3d0c22]/20 transition-all cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 text-[#ffffff] stroke-[2.4]" />
              <span className="font-bold">Add Walk-In</span>
            </button>
          )}

          {/* Staff Access Control Button */}
          {currentUser.role === 'admin' && (
            <button
              onClick={onOpenStaffAccessModal}
              className="hidden lg:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#2a0717] bg-[#ffffff] hover:bg-[#f6ebe4] border border-[#ebdcd3] transition-all cursor-pointer shadow-xs"
              title="Manage Staff Permissions & Access"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#3d0c22]" />
              <span className="font-semibold">Staff Access Control</span>
            </button>
          )}

          {/* User Account / Role Pill */}
          <div className="hidden sm:flex items-center gap-1.5 text-right pl-2 pr-1">
            <div>
              <p className="text-[10px] font-medium text-[#876876] leading-tight">Store Manager</p>
              <div className="flex items-center gap-1 text-xs text-[#2a0717] font-bold">
                <span>{currentUser.role === 'admin' ? 'Store Admin' : 'Counter Staff'}</span>
                <ChevronDown className="w-3 h-3 text-[#3d0c22]" />
              </div>
            </div>
          </div>

          {/* Log Out Button */}
          <button
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-[#2a0717] bg-[#ffffff] hover:bg-[#f6ebe4] border border-[#ebdcd3] transition-all cursor-pointer shadow-xs"
            title="Log out and return to password login gate"
          >
            <LogOut className="w-3.5 h-3.5 text-[#876876]" />
            <span className="hidden sm:inline font-semibold">Log Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};
