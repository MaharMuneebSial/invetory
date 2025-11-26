"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Printer,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  X,
  Package,
} from "lucide-react";
import { getPurchaseInvoices, getPurchaseInvoiceById } from "@/lib/db";

export default function PurchaseInvoicesListPage() {
  const router = useRouter();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewingInvoice, setViewingInvoice] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const purchasesData = await getPurchaseInvoices();
        setPurchases(purchasesData || []);
      } catch (error) {
        console.error("Failed to fetch purchase invoices:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredPurchases = purchases.filter(
    (purchase) =>
      purchase.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase())
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

  // Get payment status based on paid and total amounts
  const getPaymentStatus = (purchase) => {
    const paid = Number(purchase.paid || 0);
    const total = Number(purchase.total || 0);

    if (paid >= total) return "Paid";
    if (paid > 0) return "Partial";
    return "Pending";
  };

  // Get payment status styling
  const getPaymentStatusStyle = (status) => {
    switch (status) {
      case "Paid":
        return "bg-emerald-100 text-emerald-700";
      case "Partial":
        return "bg-amber-100 text-amber-700";
      case "Pending":
        return "bg-red-100 text-red-700";
      default:
        return "bg-neutral-100 text-neutral-700";
    }
  };

  // Handle View Invoice
  const handleViewInvoice = async (purchase) => {
    try {
      const fullInvoice = await getPurchaseInvoiceById(purchase.id);
      setViewingInvoice(fullInvoice || purchase);
      setViewModalOpen(true);
    } catch (error) {
      console.error("Failed to fetch invoice details:", error);
      setViewingInvoice(purchase);
      setViewModalOpen(true);
    }
  };

  // Handle Print Invoice
  const handlePrintInvoice = (purchase) => {
    const printWindow = window.open("", "_blank", "width=400,height=600");
    const paymentStatus = getPaymentStatus(purchase);
    const remainingBalance = Number(purchase.total || 0) - Number(purchase.paid || 0);

    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Purchase Invoice - ${purchase.invoice_number}</title>
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
          .supplier-section { background: #f5f5f5; padding: 10px; margin-bottom: 15px; border-radius: 4px; }
          .supplier-section h3 { font-size: 12px; margin-bottom: 5px; }
          .items { border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 10px 0; margin-bottom: 10px; }
          .item { margin-bottom: 8px; }
          .item-details { display: flex; justify-content: space-between; font-size: 11px; }
          .totals { margin-bottom: 15px; }
          .total-row { display: flex; justify-content: space-between; margin-bottom: 3px; }
          .grand-total { font-weight: bold; font-size: 14px; border-top: 1px solid #000; padding-top: 5px; margin-top: 5px; }
          .status { text-align: center; padding: 5px; margin-bottom: 10px; font-weight: bold; }
          .status.paid { background: #d1fae5; color: #065f46; }
          .status.partial { background: #fef3c7; color: #92400e; }
          .status.pending { background: #fee2e2; color: #991b1b; }
          .footer { text-align: center; font-size: 10px; color: #666; border-top: 1px dashed #000; padding-top: 10px; }
          @media print {
            body { width: 80mm; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>PURCHASE INVOICE</h1>
          <p>Your Store Name</p>
          <p>Contact: 0300-0000000</p>
        </div>

        <div class="info">
          <div class="info-row">
            <span>Invoice #:</span>
            <span>${purchase.invoice_number}</span>
          </div>
          <div class="info-row">
            <span>Date:</span>
            <span>${formatDate(purchase.created_at)}</span>
          </div>
          <div class="info-row">
            <span>Time:</span>
            <span>${formatTime(purchase.created_at)}</span>
          </div>
        </div>

        <div class="supplier-section">
          <h3>Supplier Details</h3>
          <p>${purchase.supplier_name || "Unknown Supplier"}</p>
        </div>

        <div class="items">
          <div class="item">
            <div class="item-details">
              <span>Total Items:</span>
              <span>${purchase.item_count || 0}</span>
            </div>
          </div>
        </div>

        <div class="totals">
          <div class="total-row">
            <span>Grand Total:</span>
            <span>${formatCurrency(purchase.total)}</span>
          </div>
          <div class="total-row">
            <span>Paid Amount:</span>
            <span>${formatCurrency(purchase.paid || 0)}</span>
          </div>
          <div class="total-row grand-total">
            <span>Balance:</span>
            <span>${formatCurrency(remainingBalance)}</span>
          </div>
        </div>

        <div class="status ${paymentStatus.toLowerCase()}">
          Payment Status: ${paymentStatus}
        </div>

        <div class="footer">
          <p>Thank you for your business!</p>
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

  // Handle Edit Invoice
  const handleEditInvoice = (purchase) => {
    router.push(`/inventory/purchase-invoice?edit=${purchase.id}`);
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-neutral-900">
            Purchase Invoice List
          </h1>
          <p className="text-[11px] text-neutral-500">
            View and manage all purchase invoices
          </p>
        </div>
        <button
          onClick={() => router.push("/inventory/purchase-invoice")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 text-white text-[11px] font-medium hover:bg-neutral-800 transition-colors shadow-sm"
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          New Purchase
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
                placeholder="Search by invoice number or supplier..."
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
                <th className="px-2.5 py-2 text-left text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                  #
                </th>
                <th className="px-2.5 py-2 text-left text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                  Invoice No
                </th>
                <th className="px-2.5 py-2 text-left text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-2.5 py-2 text-left text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-2.5 py-2 text-left text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                  Supplier
                </th>
                <th className="px-2.5 py-2 text-left text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-2.5 py-2 text-left text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-2.5 py-2 text-left text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                  Paid
                </th>
                <th className="px-2.5 py-2 text-left text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                  Balance
                </th>
                <th className="px-2.5 py-2 text-left text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-2.5 py-2 text-center text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <tr>
                  <td colSpan="11" className="px-3 py-8 text-center text-neutral-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin"></div>
                      <span className="text-[11px]">Loading invoices...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan="11" className="px-3 py-8 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Package className="w-8 h-8 text-neutral-300" />
                      <div>
                        <p className="text-neutral-600 font-medium text-[12px]">No purchase invoices found</p>
                        <p className="text-neutral-400 text-[11px]">Create your first purchase invoice to get started</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((purchase, index) => {
                  const paymentStatus = getPaymentStatus(purchase);
                  const remainingBalance = Number(purchase.total || 0) - Number(purchase.paid || 0);

                  return (
                    <tr
                      key={purchase.id}
                      className="hover:bg-neutral-50/50 transition-colors"
                    >
                      <td className="px-2.5 py-2">
                        <span className="text-[11px] text-neutral-500">
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-2.5 py-2">
                        <span className="text-[11px] font-semibold text-emerald-600">
                          {purchase.invoice_number}
                        </span>
                      </td>
                      <td className="px-2.5 py-2">
                        <span className="text-[11px] text-neutral-600">
                          {formatDate(purchase.created_at)}
                        </span>
                      </td>
                      <td className="px-2.5 py-2">
                        <span className="text-[11px] text-neutral-600">
                          {formatTime(purchase.created_at)}
                        </span>
                      </td>
                      <td className="px-2.5 py-2">
                        <span className="text-[11px] font-medium text-neutral-900">
                          {purchase.supplier_name || "Unknown"}
                        </span>
                      </td>
                      <td className="px-2.5 py-2">
                        <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full bg-neutral-100 text-[10px] font-medium text-neutral-700">
                          {purchase.item_count || 0}
                        </span>
                      </td>
                      <td className="px-2.5 py-2">
                        <span className="text-[11px] font-bold text-neutral-900">
                          {formatCurrency(purchase.total)}
                        </span>
                      </td>
                      <td className="px-2.5 py-2">
                        <span className="text-[11px] font-medium text-emerald-600">
                          {formatCurrency(purchase.paid || 0)}
                        </span>
                      </td>
                      <td className="px-2.5 py-2">
                        <span className={`text-[11px] font-medium ${remainingBalance > 0 ? 'text-red-600' : 'text-neutral-500'}`}>
                          {formatCurrency(remainingBalance)}
                        </span>
                      </td>
                      <td className="px-2.5 py-2">
                        <span
                          className={`inline-flex px-1.5 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider ${getPaymentStatusStyle(paymentStatus)}`}
                        >
                          {paymentStatus}
                        </span>
                      </td>
                      <td className="px-2.5 py-2">
                        <div className="flex items-center justify-center gap-0.5">
                          <button
                            onClick={() => handleViewInvoice(purchase)}
                            className="p-1 rounded text-neutral-500 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                            title="View Invoice"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handlePrintInvoice(purchase)}
                            className="p-1 rounded text-neutral-500 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                            title="Print Invoice"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleEditInvoice(purchase)}
                            className="p-1 rounded text-neutral-500 hover:bg-amber-50 hover:text-amber-600 transition-colors"
                            title="Edit Invoice"
                          >
                            <Edit className="w-3.5 h-3.5" />
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
        {filteredPurchases.length > 0 && (
          <div className="flex items-center justify-between px-3 py-2 border-t border-neutral-200/60 bg-neutral-50/30">
            <p className="text-[10px] text-neutral-500">
              Showing <span className="font-medium text-neutral-900">1</span> to{" "}
              <span className="font-medium text-neutral-900">{filteredPurchases.length}</span> of{" "}
              <span className="font-medium text-neutral-900">{purchases.length}</span> invoices
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
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-gradient-to-r from-emerald-500 to-teal-600">
              <div className="text-white">
                <h2 className="text-lg font-semibold">Purchase Invoice Details</h2>
                <p className="text-[13px] text-emerald-100">{viewingInvoice.invoice_number}</p>
              </div>
              <button
                onClick={() => setViewModalOpen(false)}
                className="p-2 rounded-lg hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-4">
                {/* Invoice Info Grid */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-neutral-50 rounded-xl p-4">
                    <p className="text-[11px] text-neutral-500 uppercase tracking-wider mb-1">Invoice Number</p>
                    <p className="text-[14px] font-semibold text-emerald-600">{viewingInvoice.invoice_number}</p>
                  </div>
                  <div className="bg-neutral-50 rounded-xl p-4">
                    <p className="text-[11px] text-neutral-500 uppercase tracking-wider mb-1">Purchase Date</p>
                    <p className="text-[14px] font-medium text-neutral-900">
                      {formatDate(viewingInvoice.created_at)}
                    </p>
                  </div>
                  <div className="bg-neutral-50 rounded-xl p-4">
                    <p className="text-[11px] text-neutral-500 uppercase tracking-wider mb-1">Purchase Time</p>
                    <p className="text-[14px] font-medium text-neutral-900">
                      {formatTime(viewingInvoice.created_at)}
                    </p>
                  </div>
                </div>

                {/* Supplier Info */}
                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                  <p className="text-[11px] text-emerald-600 uppercase tracking-wider mb-1">Supplier Name</p>
                  <p className="text-[16px] font-semibold text-neutral-900">{viewingInvoice.supplier_name || "Unknown Supplier"}</p>
                </div>

                {/* Items and Amounts */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-neutral-50 rounded-xl p-4">
                    <p className="text-[11px] text-neutral-500 uppercase tracking-wider mb-1">Total Items</p>
                    <p className="text-[14px] font-medium text-neutral-900">{viewingInvoice.item_count || 0} items</p>
                  </div>
                  <div className="bg-neutral-50 rounded-xl p-4">
                    <p className="text-[11px] text-neutral-500 uppercase tracking-wider mb-1">Payment Status</p>
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider ${getPaymentStatusStyle(getPaymentStatus(viewingInvoice))}`}>
                      {getPaymentStatus(viewingInvoice)}
                    </span>
                  </div>
                </div>

                {/* Payment Summary */}
                <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-xl p-5 text-white">
                  <p className="text-[11px] text-neutral-400 uppercase tracking-wider mb-3">Payment Summary</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[13px]">
                      <span className="text-neutral-400">Grand Total</span>
                      <span className="font-semibold">{formatCurrency(viewingInvoice.total)}</span>
                    </div>
                    <div className="flex justify-between text-[13px]">
                      <span className="text-neutral-400">Paid Amount</span>
                      <span className="text-emerald-400 font-semibold">{formatCurrency(viewingInvoice.paid || 0)}</span>
                    </div>
                    <div className="flex justify-between text-[16px] font-bold pt-2 border-t border-neutral-700">
                      <span>Remaining Balance</span>
                      <span className={Number(viewingInvoice.total || 0) - Number(viewingInvoice.paid || 0) > 0 ? 'text-red-400' : 'text-emerald-400'}>
                        {formatCurrency(Number(viewingInvoice.total || 0) - Number(viewingInvoice.paid || 0))}
                      </span>
                    </div>
                  </div>
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
                  handleEditInvoice(viewingInvoice);
                  setViewModalOpen(false);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-white text-[13px] font-medium hover:bg-amber-600 transition-colors"
              >
                <Edit className="w-4 h-4" />
                Edit Invoice
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
