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
  FileText,
  X,
} from "lucide-react";
import { getSaleInvoices, getSaleInvoiceById } from "@/lib/db";

export default function SaleInvoicesListPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewingInvoice, setViewingInvoice] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const invoicesData = await getSaleInvoices();
        setInvoices(invoicesData || []);
      } catch (error) {
        console.error("Failed to fetch sale invoices:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredInvoices = invoices.filter(
    (invoice) =>
      invoice.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount) => {
    return `Rs. ${Number(amount || 0).toLocaleString()}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-PK", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleTimeString("en-PK", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Handle View Invoice
  const handleViewInvoice = async (invoice) => {
    try {
      const fullInvoice = await getSaleInvoiceById(invoice.id);
      setViewingInvoice(fullInvoice || invoice);
      setViewModalOpen(true);
    } catch (error) {
      console.error("Failed to fetch invoice details:", error);
      setViewingInvoice(invoice);
      setViewModalOpen(true);
    }
  };

  // Handle Print Invoice
  const handlePrintInvoice = (invoice) => {
    const printWindow = window.open("", "_blank", "width=400,height=600");

    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${invoice.invoice_number}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            padding: 10px;
            width: 80mm;
            max-width: 80mm;
          }
          .header { text-align: center; margin-bottom: 15px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
          .header h1 { font-size: 16px; margin-bottom: 5px; }
          .header p { font-size: 11px; color: #666; }
          .info { margin-bottom: 15px; }
          .info-row { display: flex; justify-content: space-between; margin-bottom: 3px; }
          .items { border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 10px 0; margin-bottom: 10px; }
          .item { margin-bottom: 8px; }
          .item-name { font-weight: bold; }
          .item-details { display: flex; justify-content: space-between; font-size: 11px; }
          .totals { margin-bottom: 15px; }
          .total-row { display: flex; justify-content: space-between; margin-bottom: 3px; }
          .grand-total { font-weight: bold; font-size: 14px; border-top: 1px solid #000; padding-top: 5px; margin-top: 5px; }
          .footer { text-align: center; font-size: 10px; color: #666; border-top: 1px dashed #000; padding-top: 10px; }
          @media print {
            body { width: 80mm; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>SALE INVOICE</h1>
          <p>Your Store Name</p>
          <p>Contact: 0300-0000000</p>
        </div>

        <div class="info">
          <div class="info-row">
            <span>Invoice #:</span>
            <span>${invoice.invoice_number}</span>
          </div>
          <div class="info-row">
            <span>Date:</span>
            <span>${formatDate(invoice.created_at)}</span>
          </div>
          <div class="info-row">
            <span>Time:</span>
            <span>${formatTime(invoice.created_at)}</span>
          </div>
          <div class="info-row">
            <span>Payment:</span>
            <span>${invoice.payment_method || "Cash"}</span>
          </div>
        </div>

        <div class="items">
          <div class="item">
            <div class="item-details">
              <span>Total Items:</span>
              <span>${invoice.item_count || 0}</span>
            </div>
          </div>
        </div>

        <div class="totals">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>${formatCurrency(invoice.subtotal || invoice.total)}</span>
          </div>
          ${invoice.discount ? `
          <div class="total-row">
            <span>Discount:</span>
            <span>-${formatCurrency(invoice.discount)}</span>
          </div>
          ` : ""}
          ${invoice.tax ? `
          <div class="total-row">
            <span>Tax:</span>
            <span>${formatCurrency(invoice.tax)}</span>
          </div>
          ` : ""}
          <div class="total-row grand-total">
            <span>TOTAL:</span>
            <span>${formatCurrency(invoice.total)}</span>
          </div>
        </div>

        <div class="footer">
          <p>Thank you for your purchase!</p>
          <p>Please visit again</p>
        </div>

        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(receiptHTML);
    printWindow.document.close();
  };

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-neutral-900">
            Sale Invoice List
          </h1>
          <p className="text-[11px] text-neutral-500">
            View and manage all sale invoices
          </p>
        </div>
        <button
          onClick={() => router.push("/inventory/sale-invoice")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 text-white text-[11px] font-medium hover:bg-neutral-800 transition-colors shadow-sm"
        >
          <FileText className="w-3.5 h-3.5" />
          New Invoice
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white/80 backdrop-blur-xl rounded-lg border border-neutral-200/60 p-2.5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search by invoice number..."
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

      {/* Table */}
      <div className="bg-white/80 backdrop-blur-xl rounded-lg border border-neutral-200/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-neutral-50/50 border-b border-neutral-200/60">
                <th className="px-2.5 py-2 text-left text-[9px] font-semibold text-neutral-500 uppercase tracking-wider">
                  #
                </th>
                <th className="px-2.5 py-2 text-left text-[9px] font-semibold text-neutral-500 uppercase tracking-wider">
                  Invoice No
                </th>
                <th className="px-2.5 py-2 text-left text-[9px] font-semibold text-neutral-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-2.5 py-2 text-left text-[9px] font-semibold text-neutral-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-2.5 py-2 text-left text-[9px] font-semibold text-neutral-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-2.5 py-2 text-left text-[9px] font-semibold text-neutral-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-2.5 py-2 text-left text-[9px] font-semibold text-neutral-500 uppercase tracking-wider">
                  Paid
                </th>
                <th className="px-2.5 py-2 text-left text-[9px] font-semibold text-neutral-500 uppercase tracking-wider">
                  Balance
                </th>
                <th className="px-2.5 py-2 text-left text-[9px] font-semibold text-neutral-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-2.5 py-2 text-center text-[9px] font-semibold text-neutral-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <tr>
                  <td colSpan="10" className="px-3 py-6 text-center text-neutral-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin"></div>
                      <span className="text-[11px]">Loading invoices...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-3 py-6 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="w-8 h-8 text-neutral-300" />
                      <div>
                        <p className="text-neutral-600 font-medium text-[12px]">No invoices found</p>
                        <p className="text-neutral-400 text-[11px]">Create your first sale invoice to get started</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((invoice, index) => {
                  const paid = Number(invoice.paid || 0);
                  const total = Number(invoice.total || 0);
                  const balance = total - paid;
                  const status = balance <= 0 ? "Paid" : paid > 0 ? "Partial" : "Unpaid";

                  return (
                    <tr
                      key={invoice.id}
                      className="hover:bg-neutral-50/50 transition-colors"
                    >
                      <td className="px-2.5 py-1.5">
                        <span className="text-[10px] text-neutral-500">
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-2.5 py-1.5">
                        <span className="text-[10px] font-semibold text-indigo-600">
                          {invoice.invoice_number}
                        </span>
                      </td>
                      <td className="px-2.5 py-1.5">
                        <span className="text-[10px] text-neutral-600">
                          {formatDate(invoice.created_at)}
                        </span>
                      </td>
                      <td className="px-2.5 py-1.5">
                        <span className="text-[10px] text-neutral-600">
                          {formatTime(invoice.created_at)}
                        </span>
                      </td>
                      <td className="px-2.5 py-1.5">
                        <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full bg-neutral-100 text-[9px] font-medium text-neutral-700">
                          {invoice.item_count || 0}
                        </span>
                      </td>
                      <td className="px-2.5 py-1.5">
                        <span className="text-[10px] font-bold text-neutral-900">
                          {formatCurrency(invoice.total)}
                        </span>
                      </td>
                      <td className="px-2.5 py-1.5">
                        <span className="text-[10px] font-medium text-emerald-600">
                          {formatCurrency(paid)}
                        </span>
                      </td>
                      <td className="px-2.5 py-1.5">
                        <span className={`text-[10px] font-medium ${balance > 0 ? 'text-red-600' : 'text-neutral-500'}`}>
                          {formatCurrency(balance)}
                        </span>
                      </td>
                      <td className="px-2.5 py-1.5">
                        <span
                          className={`inline-flex px-1.5 py-0.5 rounded-full text-[8px] font-semibold uppercase tracking-wider ${
                            status === "Paid"
                              ? "bg-emerald-100 text-emerald-700"
                              : status === "Partial"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="px-2.5 py-1.5">
                        <div className="flex items-center justify-center gap-0.5">
                          <button
                            onClick={() => handleViewInvoice(invoice)}
                            className="p-1 rounded text-neutral-500 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                            title="View Invoice"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handlePrintInvoice(invoice)}
                            className="p-1 rounded text-neutral-500 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                            title="Print Invoice"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredInvoices.length > 0 && (
          <div className="flex items-center justify-between px-3 py-1.5 border-t border-neutral-200/60 bg-neutral-50/30">
            <p className="text-[10px] text-neutral-500">
              Showing <span className="font-medium text-neutral-900">1</span> to{" "}
              <span className="font-medium text-neutral-900">{filteredInvoices.length}</span> of{" "}
              <span className="font-medium text-neutral-900">{invoices.length}</span> invoices
            </p>
            <div className="flex items-center gap-1">
              <button className="p-1 rounded bg-white border border-neutral-200 text-neutral-500 hover:bg-neutral-50 transition-colors disabled:opacity-50" disabled>
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button className="px-2 py-0.5 rounded bg-neutral-900 text-white text-[10px] font-medium">
                1
              </button>
              <button className="p-1 rounded bg-white border border-neutral-200 text-neutral-500 hover:bg-neutral-50 transition-colors disabled:opacity-50" disabled>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Invoice Modal */}
      {viewModalOpen && viewingInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">Invoice Details</h2>
                <p className="text-[13px] text-neutral-500">{viewingInvoice.invoice_number}</p>
              </div>
              <button
                onClick={() => setViewModalOpen(false)}
                className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                <X className="w-5 h-5 text-neutral-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-4">
                {/* Invoice Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-neutral-50 rounded-xl p-4">
                    <p className="text-[11px] text-neutral-500 uppercase tracking-wider mb-1">Invoice Number</p>
                    <p className="text-[14px] font-semibold text-indigo-600">{viewingInvoice.invoice_number}</p>
                  </div>
                  <div className="bg-neutral-50 rounded-xl p-4">
                    <p className="text-[11px] text-neutral-500 uppercase tracking-wider mb-1">Date & Time</p>
                    <p className="text-[14px] font-medium text-neutral-900">
                      {formatDate(viewingInvoice.created_at)}
                    </p>
                    <p className="text-[12px] text-neutral-500">{formatTime(viewingInvoice.created_at)}</p>
                  </div>
                  <div className="bg-neutral-50 rounded-xl p-4">
                    <p className="text-[11px] text-neutral-500 uppercase tracking-wider mb-1">Total Items</p>
                    <p className="text-[14px] font-medium text-neutral-900">{viewingInvoice.item_count || 0} items</p>
                  </div>
                  <div className="bg-neutral-50 rounded-xl p-4">
                    <p className="text-[11px] text-neutral-500 uppercase tracking-wider mb-1">Payment Method</p>
                    <p className="text-[14px] font-medium text-neutral-900">{viewingInvoice.payment_method || "Cash"}</p>
                  </div>
                </div>

                {/* Bill Summary */}
                <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-xl p-5 text-white">
                  <p className="text-[11px] text-neutral-400 uppercase tracking-wider mb-3">Bill Summary</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[13px]">
                      <span className="text-neutral-400">Subtotal</span>
                      <span>{formatCurrency(viewingInvoice.subtotal || viewingInvoice.total)}</span>
                    </div>
                    {viewingInvoice.discount > 0 && (
                      <div className="flex justify-between text-[13px]">
                        <span className="text-neutral-400">Discount</span>
                        <span className="text-red-400">-{formatCurrency(viewingInvoice.discount)}</span>
                      </div>
                    )}
                    {viewingInvoice.tax > 0 && (
                      <div className="flex justify-between text-[13px]">
                        <span className="text-neutral-400">Tax</span>
                        <span>{formatCurrency(viewingInvoice.tax)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-[16px] font-bold pt-2 border-t border-neutral-700">
                      <span>Total Bill</span>
                      <span className="text-emerald-400">{formatCurrency(viewingInvoice.total)}</span>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center justify-between bg-neutral-50 rounded-xl p-4">
                  <span className="text-[13px] text-neutral-600">Status</span>
                  <span
                    className={`inline-flex px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider ${
                      viewingInvoice.status === "paid"
                        ? "bg-emerald-100 text-emerald-700"
                        : viewingInvoice.status === "pending"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-neutral-100 text-neutral-700"
                    }`}
                  >
                    {viewingInvoice.status || "Completed"}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-200 bg-neutral-50">
              <button
                onClick={() => setViewModalOpen(false)}
                className="px-4 py-2 rounded-xl text-[13px] font-medium text-neutral-600 hover:bg-neutral-200 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handlePrintInvoice(viewingInvoice);
                  setViewModalOpen(false);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 text-white text-[13px] font-medium hover:bg-neutral-800 transition-colors"
              >
                <Printer className="w-4 h-4" />
                Print Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
