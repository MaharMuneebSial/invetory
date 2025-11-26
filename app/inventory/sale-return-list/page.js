"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Filter,
  Download,
  Eye,
  Printer,
  ChevronLeft,
  ChevronRight,
  Undo2,
  X,
} from "lucide-react";
import { getSaleReturns, getSaleReturnStats, getSaleReturnById } from "@/lib/db";

export default function SaleReturnListPage() {
  const router = useRouter();
  const [returns, setReturns] = useState([]);
  const [stats, setStats] = useState({
    totalReturns: 0,
    totalRefunded: 0,
    pendingReturns: 0,
    returnRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // View Modal
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [returnsData, statsData] = await Promise.all([
          getSaleReturns(),
          getSaleReturnStats(),
        ]);
        setReturns(returnsData || []);
        setStats(statsData || {
          totalReturns: 0,
          totalRefunded: 0,
          pendingReturns: 0,
          returnRate: 0,
        });
      } catch (error) {
        console.error("Failed to fetch sale returns:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredReturns = returns.filter(
    (item) =>
      item.return_invoice_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.original_sale_invoice_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.original_invoice?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount) => {
    return `Rs.${Number(amount || 0).toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Handle View
  const handleView = async (returnItem) => {
    setLoadingDetails(true);
    setViewModalOpen(true);
    try {
      const fullReturn = await getSaleReturnById(returnItem.id);
      setSelectedReturn(fullReturn || returnItem);
    } catch (error) {
      console.error("Error loading return details:", error);
      setSelectedReturn(returnItem);
    }
    setLoadingDetails(false);
  };

  // Handle Print
  const handlePrint = (returnItem) => {
    const printContent = `
      <html>
        <head>
          <title>Sale Return - ${returnItem.return_invoice_no}</title>
          <style>
            body { font-family: 'Courier New', monospace; font-size: 12px; width: 80mm; margin: 0 auto; padding: 10px; }
            .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
            .title { font-size: 16px; font-weight: bold; }
            .info { margin: 10px 0; }
            .info-row { display: flex; justify-content: space-between; margin: 3px 0; }
            .items { border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 10px 0; margin: 10px 0; }
            .item { margin: 5px 0; }
            .totals { margin-top: 10px; }
            .total-row { display: flex; justify-content: space-between; margin: 3px 0; }
            .grand-total { font-size: 14px; font-weight: bold; border-top: 1px dashed #000; padding-top: 5px; margin-top: 5px; }
            .footer { text-align: center; margin-top: 15px; font-size: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">SALE RETURN</div>
            <div>${returnItem.return_invoice_no}</div>
          </div>
          <div class="info">
            <div class="info-row"><span>Date:</span><span>${returnItem.return_date || '-'}</span></div>
            <div class="info-row"><span>Time:</span><span>${returnItem.return_time || '-'}</span></div>
            <div class="info-row"><span>Original Invoice:</span><span>${returnItem.original_sale_invoice_no || returnItem.original_invoice || '-'}</span></div>
            ${returnItem.customer_name ? `<div class="info-row"><span>Customer:</span><span>${returnItem.customer_name}</span></div>` : ''}
            ${returnItem.customer_contact ? `<div class="info-row"><span>Contact:</span><span>${returnItem.customer_contact}</span></div>` : ''}
          </div>
          <div class="items">
            <div style="font-weight: bold; margin-bottom: 5px;">Returned Items:</div>
            ${returnItem.items && returnItem.items.length > 0
              ? returnItem.items.map(item => `
                <div class="item">
                  <div>${item.product_name || 'Product'}</div>
                  <div style="display: flex; justify-content: space-between;">
                    <span>${item.returned_quantity} x Rs.${Number(item.unit_price || 0).toFixed(2)}</span>
                    <span>Rs.${Number(item.subtotal || 0).toFixed(2)}</span>
                  </div>
                  ${item.return_reason ? `<div style="font-size: 10px; color: #666;">Reason: ${item.return_reason}</div>` : ''}
                </div>
              `).join('')
              : '<div>No items</div>'
            }
          </div>
          <div class="totals">
            <div class="total-row"><span>Subtotal:</span><span>Rs.${Number(returnItem.items_subtotal || 0).toFixed(2)}</span></div>
            ${Number(returnItem.discount_amount) > 0 ? `<div class="total-row"><span>Discount (${returnItem.discount_percentage}%):</span><span>-Rs.${Number(returnItem.discount_amount).toFixed(2)}</span></div>` : ''}
            ${Number(returnItem.tax_amount) > 0 ? `<div class="total-row"><span>Tax (${returnItem.tax_percentage}%):</span><span>Rs.${Number(returnItem.tax_amount).toFixed(2)}</span></div>` : ''}
            ${Number(returnItem.extra_charges_deduction) > 0 ? `<div class="total-row"><span>Deduction:</span><span>-Rs.${Number(returnItem.extra_charges_deduction).toFixed(2)}</span></div>` : ''}
            ${Number(returnItem.round_off) !== 0 ? `<div class="total-row"><span>Round Off:</span><span>Rs.${Number(returnItem.round_off).toFixed(2)}</span></div>` : ''}
            <div class="total-row grand-total"><span>REFUND TOTAL:</span><span>Rs.${Number(returnItem.refund_total || 0).toFixed(2)}</span></div>
          </div>
          <div class="info" style="margin-top: 10px;">
            <div class="info-row"><span>Refund Method:</span><span>${returnItem.refund_method || 'Cash'}</span></div>
            <div class="info-row"><span>Refund Amount:</span><span>Rs.${Number(returnItem.refund_amount || 0).toFixed(2)}</span></div>
            <div class="info-row"><span>Status:</span><span>${returnItem.refund_status || 'Pending'}</span></div>
          </div>
          ${returnItem.return_reason ? `<div style="margin-top: 10px; font-size: 10px;">Reason: ${returnItem.return_reason}</div>` : ''}
          ${returnItem.notes ? `<div style="margin-top: 5px; font-size: 10px;">Notes: ${returnItem.notes}</div>` : ''}
          <div class="footer">
            <p>Thank you!</p>
            ${returnItem.created_by ? `<p>Processed by: ${returnItem.created_by}</p>` : ''}
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank", "width=400,height=600");
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  // Print from modal (with full details)
  const handlePrintFromModal = () => {
    if (selectedReturn) {
      handlePrint(selectedReturn);
    }
  };

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-neutral-900">
            Sale Return List
          </h1>
          <p className="text-[11px] text-neutral-500">
            Track all customer returns and refunds
          </p>
        </div>
        <button
          onClick={() => router.push("/inventory/sale-return")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 text-white text-[11px] font-medium hover:bg-neutral-800 transition-colors shadow-sm"
        >
          <Undo2 className="w-3.5 h-3.5" />
          New Return
        </button>
      </div>

      {/* Stats Cards - Compact */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-white/80 backdrop-blur-xl rounded-lg border border-neutral-200/60 p-2.5">
          <p className="text-[10px] text-neutral-500 font-medium">Total Returns</p>
          <p className="text-lg font-bold text-neutral-900">{stats.totalReturns}</p>
          <p className="text-[9px] text-neutral-400">All time</p>
        </div>
        <div className="bg-white/80 backdrop-blur-xl rounded-lg border border-neutral-200/60 p-2.5">
          <p className="text-[10px] text-neutral-500 font-medium">Total Refunded</p>
          <p className="text-lg font-bold text-red-600">{formatCurrency(stats.totalRefunded)}</p>
          <p className="text-[9px] text-neutral-400">Amount</p>
        </div>
        <div className="bg-white/80 backdrop-blur-xl rounded-lg border border-neutral-200/60 p-2.5">
          <p className="text-[10px] text-neutral-500 font-medium">Pending</p>
          <p className="text-lg font-bold text-amber-600">{stats.pendingReturns}</p>
          <p className="text-[9px] text-neutral-400">Awaiting</p>
        </div>
        <div className="bg-white/80 backdrop-blur-xl rounded-lg border border-neutral-200/60 p-2.5">
          <p className="text-[10px] text-neutral-500 font-medium">Return Rate</p>
          <p className="text-lg font-bold text-indigo-600">{stats.returnRate}%</p>
          <p className="text-[9px] text-neutral-400">Of sales</p>
        </div>
      </div>

      {/* Filters & Search - Compact */}
      <div className="bg-white/80 backdrop-blur-xl rounded-lg border border-neutral-200/60 p-2.5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search by return no, customer, invoice..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-neutral-50 border border-neutral-200 text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-300"
              />
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-100 text-neutral-700 text-[11px] font-medium hover:bg-neutral-200 transition-colors">
              <Filter className="w-3.5 h-3.5" />
              Filters
            </button>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-100 text-neutral-700 text-[11px] font-medium hover:bg-neutral-200 transition-colors">
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
        </div>
      </div>

      {/* Table - Compact */}
      <div className="bg-white/80 backdrop-blur-xl rounded-lg border border-neutral-200/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-neutral-50/50 border-b border-neutral-200/60">
                <th className="px-2 py-1.5 text-left text-[9px] font-semibold text-neutral-500 uppercase tracking-wider">
                  #
                </th>
                <th className="px-2 py-1.5 text-left text-[9px] font-semibold text-neutral-500 uppercase tracking-wider">
                  Return No
                </th>
                <th className="px-2 py-1.5 text-left text-[9px] font-semibold text-neutral-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-2 py-1.5 text-left text-[9px] font-semibold text-neutral-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-2 py-1.5 text-left text-[9px] font-semibold text-neutral-500 uppercase tracking-wider">
                  Orig. Invoice
                </th>
                <th className="px-2 py-1.5 text-left text-[9px] font-semibold text-neutral-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-2 py-1.5 text-left text-[9px] font-semibold text-neutral-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-2 py-1.5 text-left text-[9px] font-semibold text-neutral-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-2 py-1.5 text-left text-[9px] font-semibold text-neutral-500 uppercase tracking-wider">
                  Refund
                </th>
                <th className="px-2 py-1.5 text-left text-[9px] font-semibold text-neutral-500 uppercase tracking-wider">
                  Method
                </th>
                <th className="px-2 py-1.5 text-left text-[9px] font-semibold text-neutral-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-2 py-1.5 text-center text-[9px] font-semibold text-neutral-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <tr>
                  <td colSpan="12" className="px-3 py-6 text-center text-neutral-500 text-[11px]">
                    Loading...
                  </td>
                </tr>
              ) : filteredReturns.length === 0 ? (
                <tr>
                  <td colSpan="12" className="px-3 py-6 text-center text-neutral-500 text-[11px]">
                    No sale returns found
                  </td>
                </tr>
              ) : (
                filteredReturns.map((item, index) => (
                  <tr
                    key={item.id}
                    className="hover:bg-neutral-50/50 transition-colors"
                  >
                    <td className="px-2 py-1.5 text-[10px] text-neutral-600">
                      {index + 1}
                    </td>
                    <td className="px-2 py-1.5">
                      <span className="text-[10px] font-semibold text-indigo-600">
                        {item.return_invoice_no || "-"}
                      </span>
                    </td>
                    <td className="px-2 py-1.5">
                      <span className="text-[10px] text-neutral-600">
                        {item.return_date || "-"}
                      </span>
                    </td>
                    <td className="px-2 py-1.5">
                      <span className="text-[10px] text-neutral-600">
                        {item.return_time || "-"}
                      </span>
                    </td>
                    <td className="px-2 py-1.5">
                      <span className="text-[10px] text-neutral-600">
                        {item.original_sale_invoice_no || item.original_invoice || "-"}
                      </span>
                    </td>
                    <td className="px-2 py-1.5">
                      <span className="text-[10px] font-medium text-neutral-900">
                        {item.customer_name || "Walk-in"}
                      </span>
                    </td>
                    <td className="px-2 py-1.5">
                      <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full bg-neutral-100 text-[9px] font-medium text-neutral-700">
                        {item.total_items || 0}
                      </span>
                    </td>
                    <td className="px-2 py-1.5">
                      <span className="text-[10px] font-semibold text-red-600">
                        {formatCurrency(item.refund_total)}
                      </span>
                    </td>
                    <td className="px-2 py-1.5">
                      <span className="text-[10px] font-semibold text-neutral-900">
                        {formatCurrency(item.refund_amount)}
                      </span>
                    </td>
                    <td className="px-2 py-1.5">
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">
                        {item.refund_method || "Cash"}
                      </span>
                    </td>
                    <td className="px-2 py-1.5">
                      <span
                        className={`inline-flex px-1.5 py-0.5 rounded-full text-[8px] font-semibold uppercase tracking-wider ${
                          item.refund_status === "Refunded"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {item.refund_status || "Pending"}
                      </span>
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="flex items-center justify-center gap-0.5">
                        <button
                          onClick={() => handleView(item)}
                          className="p-1 rounded text-neutral-500 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              const fullReturn = await getSaleReturnById(item.id);
                              handlePrint(fullReturn || item);
                            } catch {
                              handlePrint(item);
                            }
                          }}
                          className="p-1 rounded text-neutral-500 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                          title="Print"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination - Compact */}
        <div className="flex items-center justify-between px-3 py-1.5 border-t border-neutral-200/60 bg-neutral-50/30">
          <p className="text-[10px] text-neutral-500">
            Showing <span className="font-medium text-neutral-900">1</span> to{" "}
            <span className="font-medium text-neutral-900">{filteredReturns.length}</span> of{" "}
            <span className="font-medium text-neutral-900">{returns.length}</span> results
          </p>
          <div className="flex items-center gap-1">
            <button className="p-1 rounded bg-white border border-neutral-200 text-neutral-500 hover:bg-neutral-50 transition-colors">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button className="px-2 py-0.5 rounded bg-neutral-900 text-white text-[10px] font-medium">
              1
            </button>
            <button className="p-1 rounded bg-white border border-neutral-200 text-neutral-500 hover:bg-neutral-50 transition-colors">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* View Modal */}
      {viewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">
                  Sale Return Details
                </h2>
                <p className="text-[13px] text-neutral-500">
                  {selectedReturn?.return_invoice_no}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintFromModal}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 text-emerald-600 text-[13px] font-medium hover:bg-emerald-100 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  Print
                </button>
                <button
                  onClick={() => {
                    setViewModalOpen(false);
                    setSelectedReturn(null);
                  }}
                  className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {loadingDetails ? (
                <div className="flex items-center justify-center py-12">
                  <p className="text-neutral-500">Loading details...</p>
                </div>
              ) : selectedReturn ? (
                <div className="space-y-6">
                  {/* Return Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-neutral-50 rounded-xl p-4">
                      <p className="text-[11px] font-medium text-neutral-500 uppercase">Return Invoice No</p>
                      <p className="text-[15px] font-semibold text-indigo-600 mt-1">{selectedReturn.return_invoice_no}</p>
                    </div>
                    <div className="bg-neutral-50 rounded-xl p-4">
                      <p className="text-[11px] font-medium text-neutral-500 uppercase">Original Invoice</p>
                      <p className="text-[15px] font-semibold text-neutral-900 mt-1">{selectedReturn.original_sale_invoice_no || selectedReturn.original_invoice || "-"}</p>
                    </div>
                    <div className="bg-neutral-50 rounded-xl p-4">
                      <p className="text-[11px] font-medium text-neutral-500 uppercase">Return Date</p>
                      <p className="text-[15px] font-semibold text-neutral-900 mt-1">{selectedReturn.return_date || "-"}</p>
                    </div>
                    <div className="bg-neutral-50 rounded-xl p-4">
                      <p className="text-[11px] font-medium text-neutral-500 uppercase">Return Time</p>
                      <p className="text-[15px] font-semibold text-neutral-900 mt-1">{selectedReturn.return_time || "-"}</p>
                    </div>
                    <div className="bg-neutral-50 rounded-xl p-4">
                      <p className="text-[11px] font-medium text-neutral-500 uppercase">Customer Name</p>
                      <p className="text-[15px] font-semibold text-neutral-900 mt-1">{selectedReturn.customer_name || "Walk-in"}</p>
                    </div>
                    <div className="bg-neutral-50 rounded-xl p-4">
                      <p className="text-[11px] font-medium text-neutral-500 uppercase">Customer Contact</p>
                      <p className="text-[15px] font-semibold text-neutral-900 mt-1">{selectedReturn.customer_contact || "-"}</p>
                    </div>
                  </div>

                  {/* Items Table */}
                  {selectedReturn.items && selectedReturn.items.length > 0 && (
                    <div>
                      <h3 className="text-[13px] font-semibold text-neutral-900 mb-3">Returned Items</h3>
                      <div className="border border-neutral-200 rounded-xl overflow-hidden">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-neutral-50">
                              <th className="px-4 py-2 text-left text-[11px] font-semibold text-neutral-500">#</th>
                              <th className="px-4 py-2 text-left text-[11px] font-semibold text-neutral-500">Product</th>
                              <th className="px-4 py-2 text-left text-[11px] font-semibold text-neutral-500">SKU</th>
                              <th className="px-4 py-2 text-left text-[11px] font-semibold text-neutral-500">Qty</th>
                              <th className="px-4 py-2 text-left text-[11px] font-semibold text-neutral-500">Price</th>
                              <th className="px-4 py-2 text-left text-[11px] font-semibold text-neutral-500">Subtotal</th>
                              <th className="px-4 py-2 text-left text-[11px] font-semibold text-neutral-500">Reason</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-100">
                            {selectedReturn.items.map((item, idx) => (
                              <tr key={idx}>
                                <td className="px-4 py-2 text-[13px] text-neutral-600">{idx + 1}</td>
                                <td className="px-4 py-2 text-[13px] font-medium text-neutral-900">{item.product_name || "-"}</td>
                                <td className="px-4 py-2 text-[13px] text-neutral-500">{item.product_sku || "-"}</td>
                                <td className="px-4 py-2 text-[13px] text-neutral-600">{item.returned_quantity}</td>
                                <td className="px-4 py-2 text-[13px] text-neutral-600">{formatCurrency(item.unit_price)}</td>
                                <td className="px-4 py-2 text-[13px] font-semibold text-neutral-900">{formatCurrency(item.subtotal)}</td>
                                <td className="px-4 py-2 text-[12px] text-neutral-500">{item.return_reason || "-"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Summary */}
                  <div className="bg-neutral-50 rounded-xl p-4">
                    <h3 className="text-[13px] font-semibold text-neutral-900 mb-3">Refund Summary</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-[13px]">
                        <span className="text-neutral-500">Items Subtotal</span>
                        <span className="font-medium">{formatCurrency(selectedReturn.items_subtotal)}</span>
                      </div>
                      {Number(selectedReturn.discount_amount) > 0 && (
                        <div className="flex justify-between text-[13px]">
                          <span className="text-neutral-500">Discount ({selectedReturn.discount_percentage}%)</span>
                          <span className="font-medium text-red-500">-{formatCurrency(selectedReturn.discount_amount)}</span>
                        </div>
                      )}
                      {Number(selectedReturn.tax_amount) > 0 && (
                        <div className="flex justify-between text-[13px]">
                          <span className="text-neutral-500">Tax ({selectedReturn.tax_percentage}%)</span>
                          <span className="font-medium">{formatCurrency(selectedReturn.tax_amount)}</span>
                        </div>
                      )}
                      {Number(selectedReturn.extra_charges_deduction) > 0 && (
                        <div className="flex justify-between text-[13px]">
                          <span className="text-neutral-500">Deduction</span>
                          <span className="font-medium text-red-500">-{formatCurrency(selectedReturn.extra_charges_deduction)}</span>
                        </div>
                      )}
                      {Number(selectedReturn.round_off) !== 0 && (
                        <div className="flex justify-between text-[13px]">
                          <span className="text-neutral-500">Round Off</span>
                          <span className="font-medium">{formatCurrency(selectedReturn.round_off)}</span>
                        </div>
                      )}
                      <div className="h-px bg-neutral-200 my-2"></div>
                      <div className="flex justify-between text-[15px] font-semibold">
                        <span>Refund Total</span>
                        <span className="text-indigo-600">{formatCurrency(selectedReturn.refund_total)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Refund Details */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-blue-50 rounded-xl p-4">
                      <p className="text-[11px] font-medium text-blue-600 uppercase">Refund Method</p>
                      <p className="text-[15px] font-semibold text-blue-900 mt-1">{selectedReturn.refund_method || "Cash"}</p>
                    </div>
                    <div className="bg-emerald-50 rounded-xl p-4">
                      <p className="text-[11px] font-medium text-emerald-600 uppercase">Refund Amount</p>
                      <p className="text-[15px] font-semibold text-emerald-900 mt-1">{formatCurrency(selectedReturn.refund_amount)}</p>
                    </div>
                    <div className={`rounded-xl p-4 ${selectedReturn.refund_status === "Refunded" ? "bg-emerald-50" : "bg-amber-50"}`}>
                      <p className={`text-[11px] font-medium uppercase ${selectedReturn.refund_status === "Refunded" ? "text-emerald-600" : "text-amber-600"}`}>Refund Status</p>
                      <p className={`text-[15px] font-semibold mt-1 ${selectedReturn.refund_status === "Refunded" ? "text-emerald-900" : "text-amber-900"}`}>{selectedReturn.refund_status || "Pending"}</p>
                    </div>
                  </div>

                  {/* Return Reason & Notes */}
                  {(selectedReturn.return_reason || selectedReturn.notes) && (
                    <div className="space-y-3">
                      {selectedReturn.return_reason && (
                        <div className="bg-neutral-50 rounded-xl p-4">
                          <p className="text-[11px] font-medium text-neutral-500 uppercase">Return Reason</p>
                          <p className="text-[13px] text-neutral-700 mt-1">{selectedReturn.return_reason}</p>
                        </div>
                      )}
                      {selectedReturn.notes && (
                        <div className="bg-neutral-50 rounded-xl p-4">
                          <p className="text-[11px] font-medium text-neutral-500 uppercase">Notes</p>
                          <p className="text-[13px] text-neutral-700 mt-1">{selectedReturn.notes}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Meta Info */}
                  <div className="grid grid-cols-2 gap-4">
                    {selectedReturn.created_by && (
                      <div className="bg-neutral-50 rounded-xl p-4">
                        <p className="text-[11px] font-medium text-neutral-500 uppercase">Created By</p>
                        <p className="text-[13px] font-medium text-neutral-700 mt-1">{selectedReturn.created_by}</p>
                      </div>
                    )}
                    {selectedReturn.stock_adjustment_status && (
                      <div className="bg-neutral-50 rounded-xl p-4">
                        <p className="text-[11px] font-medium text-neutral-500 uppercase">Stock Status</p>
                        <p className="text-[13px] font-medium text-neutral-700 mt-1">{selectedReturn.stock_adjustment_status}</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-center text-neutral-500 py-12">No details available</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
