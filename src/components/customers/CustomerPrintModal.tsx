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
  businessName = 'GIRI JEWELLERS'
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#040e0b]/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#ffffff] border border-[#ede3d3] rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] font-sans">
        {/* Modal Header */}
        <div className="p-4 border-b border-[#ede3d3] flex items-center justify-between bg-[#faf7f0] print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0b241c] text-[#dfb76c] flex items-center justify-center shadow-xs">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#0b241c]">Print Customer Roster Preview</h2>
              <p className="text-xs text-[#718079]">
                Ready to print {customers.length} customer records with Place & Referral details.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#0b241c] hover:bg-[#12362b] text-[#f7eedf] border border-[#dfb76c]/40 font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[#dfb76c]" />
              <span>Print Now</span>
            </button>
            <button
              onClick={onClose}
              className="text-[#718079] hover:text-[#0b241c] p-1.5 rounded-lg hover:bg-[#ede3d3] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-6 overflow-y-auto bg-white text-slate-900 flex-1 font-sans">
          <div id="printable-customer-data" className="space-y-6">
            {/* Document Header */}
            <div className="border-b-2 border-[#0b241c] pb-4 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#0b241c] text-[#dfb76c] flex items-center justify-center font-bold">
                    <Gem className="w-5 h-5" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-black tracking-tight text-[#0b241c] uppercase font-cinzel">
                      {businessName}
                    </h1>
                    <p className="text-[11px] font-semibold tracking-wider text-[#b08738] uppercase">
                      Customer Directory Roster & Referrals
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-right text-xs text-slate-600 space-y-0.5">
                <div className="flex items-center justify-end gap-1 font-semibold text-slate-900">
                  <Calendar className="w-3.5 h-3.5 text-[#0b241c]" />
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {customers.map((c, index) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono text-slate-500">{index + 1}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-950">{c.name}</td>
                      <td className="py-2.5 px-3 font-mono">{c.phone}</td>
                      <td className="py-2.5 px-3">{c.place || c.city || '-'}</td>
                      <td className="py-2.5 px-3">{c.referredBy || 'Direct Walk-in'}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-800 text-[10px]">
                          {c.categoryName || 'General'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 uppercase text-[10px] font-bold">
                        <span className={`px-2 py-0.5 rounded ${
                          c.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                          c.status === 'lead' ? 'bg-amber-100 text-amber-800' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Print Footer */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
              <p>Confidential Showroom Document • For Internal Use Only • {businessName}</p>
              <p>Generated by Showroom Management Suite</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
