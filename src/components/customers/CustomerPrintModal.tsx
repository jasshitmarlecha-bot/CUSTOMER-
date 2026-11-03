import React from 'react';
import { Printer, X, Gem, Calendar } from 'lucide-react';
import { Customer } from '../../types/index.ts';

interface CustomerPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  filterSummary?: string;
  businessName?: string;
}

export const CustomerPrintModal: React.FC<CustomerPrintModalProps> = ({
  isOpen,
  onClose,
  customers,
  filterSummary,
  businessName = 'Giri Jewels'
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#160d16] border border-[#392233] rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-[#392233] flex items-center justify-between bg-[#100911] print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-[#cfb7c8]">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Print Customer Roster Preview</h2>
              <p className="text-xs text-[#cfb7c8]">
                Ready to print {customers.length} customer records with Place & Referral details.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Now</span>
            </button>
            <button
              onClick={onClose}
              className="text-[#cfb7c8] hover:text-white p-1.5 rounded-lg hover:bg-[#261327] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-6 overflow-y-auto bg-white text-slate-900 flex-1 font-sans">
          <div id="printable-customer-data" className="space-y-6">
            {/* Document Header */}
            <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-700 text-white flex items-center justify-center font-bold">
                    <Gem className="w-5 h-5" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-950 uppercase">
                      {businessName}
                    </h1>
                    <p className="text-[11px] font-semibold tracking-wider text-purple-900 uppercase">
                      Customer Directory Roster & Referrals
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-right text-xs text-slate-600 space-y-0.5">
                <div className="flex items-center justify-end gap-1 font-semibold text-slate-900">
                  <Calendar className="w-3.5 h-3.5 text-purple-700" />
                  <span>{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
                <p className="text-[11px]">Total Records: <strong className="text-slate-900">{customers.length}</strong></p>
                {filterSummary && (
                  <p className="text-[10px] text-slate-500">Filter: {filterSummary}</p>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-300 bg-slate-100 text-slate-700 font-bold">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Customer Name</th>
                    <th className="py-2.5 px-3">Mobile Phone</th>
                    <th className="py-2.5 px-3">Place / Location</th>
                    <th className="py-2.5 px-3">Referred By</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {customers.map((c, index) => (
                    <tr key={c.id} className="even:bg-slate-50/70">
                      <td className="py-2 px-3 font-mono text-[11px] text-slate-400">{index + 1}</td>
                      <td className="py-2 px-3 font-semibold text-slate-900">{c.name}</td>
                      <td className="py-2 px-3 font-mono text-slate-800">{c.phone || '-'}</td>
                      <td className="py-2 px-3 font-medium text-slate-700">{c.place || c.city || '-'}</td>
                      <td className="py-2 px-3 text-slate-700 font-medium">{c.referredBy || 'Direct'}</td>
                      <td className="py-2 px-3 font-medium text-purple-800">{c.categoryName || 'General'}</td>
                      <td className="py-2 px-3 capitalize font-medium">{c.status}</td>
                      <td className="py-2 px-3 text-[11px] text-slate-500">
                        {c.source === 'walkin_qr' ? 'Showroom QR' : c.source === 'import' ? 'Imported' : 'Staff Manual'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Document Footer */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
              <p>Generated by {businessName} Management System</p>
              <p>Official Store Ledger</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
