"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  Search,
  Save,
  X,
  RotateCcw,
  AlertCircle,
  Package,
  Printer,
} from "lucide-react";
import { getPurchaseInvoices, getSuppliers, getProducts, createPurchaseReturn } from "@/lib/db";

// Return reasons
const RETURN_REASONS = ["Damaged", "Expired", "Wrong Item", "Quality Issue", "Excess Stock", "Defective", "Other"];

// Refund methods & statuses
const REFUND_METHODS = ["Cash", "Bank Transfer", "Credit Adjustment"];
const REFUND_STATUSES = ["Pending", "Refunded", "Adjusted"];

export default function PurchaseReturnPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [purchaseInvoices, setPurchaseInvoices] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [searchInvoice, setSearchInvoice] = useState("");
  const [showInvoiceDropdown, setShowInvoiceDropdown] = useState(false);

  // Return Invoice Info
  const [returnInvoiceNo, setReturnInvoiceNo] = useState("");
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split("T")[0]);
  const [returnTime, setReturnTime] = useState(
    new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })
  );

  // Original Purchase Invoice Reference
  const [selectedPurchaseInvoice, setSelectedPurchaseInvoice] = useState(null);

  // Supplier Info
  const [supplierName, setSupplierName] = useState("");
  const [supplierContact, setSupplierContact] = useState("");

  // Return Items
  const [returnItems, setReturnItems] = useState([
    { id: 1, product_id: "", product_name: "", returned_quantity: 1, unit_price: 0, total_amount: 0, return_reason: "" },
  ]);

  // Refund Info
  const [refundMethod, setRefundMethod] = useState("Cash");
  const [refundStatus, setRefundStatus] = useState("Pending");
  const [notes, setNotes] = useState("");

  // Generate return invoice number
  useEffect(() => {
    const date = new Date();
    const dateStr = date.toISOString().split("T")[0].replace(/-/g, "");
    const random = Math.floor(Math.random() * 9000) + 1000;
    setReturnInvoiceNo(`PR-${dateStr}-${random}`);
  }, []);

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      try {
        const [invoicesData, suppliersData, productsData] = await Promise.all([
          getPurchaseInvoices(),
          getSuppliers(),
          getProducts(),
        ]);
        setPurchaseInvoices(invoicesData || []);
        setSuppliers(suppliersData || []);
        setProducts(productsData || []);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    }
    fetchData();
  }, []);

  // Filter invoices
  const filteredInvoices = purchaseInvoices.filter(
    (inv) =>
      inv.invoice_number?.toLowerCase().includes(searchInvoice.toLowerCase()) ||
      inv.supplier_name?.toLowerCase().includes(searchInvoice.toLowerCase())
  );

  // Select invoice
  const handleSelectInvoice = (invoice) => {
    setSelectedPurchaseInvoice(invoice);
    setSearchInvoice(invoice.invoice_number);
    setShowInvoiceDropdown(false);
    setSupplierName(invoice.supplier_name || "");
    const supplier = suppliers.find((s) => s.id === invoice.supplier_id);
    setSupplierContact(supplier?.phone || "");
  };

  // Add/Remove/Update items
  const addReturnItem = () => {
    setReturnItems([...returnItems, { id: returnItems.length + 1, product_id: "", product_name: "", returned_quantity: 1, unit_price: 0, total_amount: 0, return_reason: "" }]);
  };

  const removeReturnItem = (id) => {
    if (returnItems.length > 1) setReturnItems(returnItems.filter((item) => item.id !== id));
  };

  const updateReturnItem = (id, field, value) => {
    setReturnItems(
      returnItems.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === "product_id") {
            const product = products.find((p) => p.id === Number(value));
            if (product) {
              updated.product_name = product.name;
              updated.unit_price = product.cost_price || 0;
              updated.total_amount = updated.returned_quantity * (product.cost_price || 0);
            }
          }
          if (field === "returned_quantity" || field === "unit_price") {
            updated.total_amount = Number(updated.returned_quantity) * Number(updated.unit_price);
          }
          return updated;
        }
        return item;
      })
    );
  };

  // Calculations
  const subtotal = returnItems.reduce((acc, item) => acc + Number(item.total_amount || 0), 0);
  const returnTotal = subtotal;
  const formatCurrency = (amount) => `Rs. ${Number(amount || 0).toFixed(2)}`;

  // Save
  const handleSaveReturn = async () => {
    if (!selectedPurchaseInvoice) { alert("Please select a purchase invoice"); return; }
    if (returnItems.some((item) => !item.product_id)) { alert("Please select products"); return; }

    setLoading(true);
    try {
      await createPurchaseReturn({
        return_invoice_no: returnInvoiceNo,
        return_date: returnDate,
        return_time: returnTime,
        original_purchase_invoice_id: selectedPurchaseInvoice.id,
        supplier_name: supplierName,
        items: returnItems,
        subtotal,
        return_total: returnTotal,
        refund_method: refundMethod,
        refund_status: refundStatus,
        notes,
      });
      alert("Purchase return saved!");
      router.push("/inventory");
    } catch (error) {
      alert("Failed to save return");
    } finally {
      setLoading(false);
    }
  };

  // Print
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      {/* Header Row */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-lg font-bold text-neutral-900">Purchase Return</h1>
          <p className="text-[10px] text-neutral-500">Return items to supplier</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => router.back()} className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-neutral-100 text-neutral-700 text-[11px] font-medium hover:bg-neutral-200">
            <X className="w-3.5 h-3.5" /> Cancel
          </button>
          <button onClick={handlePrint} className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-amber-100 text-amber-700 text-[11px] font-medium hover:bg-amber-200">
            <Printer className="w-3.5 h-3.5" /> Print
          </button>
          <button onClick={handleSaveReturn} disabled={loading} className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-neutral-900 text-white text-[11px] font-medium hover:bg-neutral-800 disabled:opacity-50">
            <Save className="w-3.5 h-3.5" /> {loading ? "Saving..." : "Process Return"}
          </button>
        </div>
      </div>

      {/* Alert Notice - Compact */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-center gap-2 mb-2">
        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
        <p className="text-[10px] text-amber-700">Ensure all items are in returnable condition. Damaged or opened items may not be accepted.</p>
      </div>

      {/* Main Content - Two Panels */}
      <div className="flex-1 flex gap-3 min-h-0">
        {/* Left Panel */}
        <div className="flex-1 flex flex-col min-h-0 gap-2">
          {/* Return Info + Invoice Search Row */}
          <div className="bg-white rounded-lg border border-neutral-200 p-2.5 shadow-sm">
            <div className="grid grid-cols-5 gap-3">
              {/* Return Invoice No */}
              <div>
                <label className="block text-[9px] font-medium text-neutral-500 mb-1">Return Invoice No *</label>
                <input type="text" value={returnInvoiceNo} readOnly className="w-full px-2 py-1.5 rounded-md bg-amber-50 border border-amber-200 text-[11px] font-semibold text-amber-600" />
              </div>
              {/* Return Date */}
              <div>
                <label className="block text-[9px] font-medium text-neutral-500 mb-1">Return Date *</label>
                <input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} className="w-full px-2 py-1.5 rounded-md bg-neutral-50 border border-neutral-200 text-[11px]" />
              </div>
              {/* Return Time */}
              <div>
                <label className="block text-[9px] font-medium text-neutral-500 mb-1">Return Time</label>
                <input type="text" value={returnTime} readOnly className="w-full px-2 py-1.5 rounded-md bg-neutral-50 border border-neutral-200 text-[11px]" />
              </div>
              {/* Original Invoice Search */}
              <div className="col-span-2 relative">
                <label className="block text-[9px] font-medium text-neutral-500 mb-1">Original Purchase Invoice *</label>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Search invoice..."
                    value={searchInvoice}
                    onChange={(e) => { setSearchInvoice(e.target.value); setShowInvoiceDropdown(true); }}
                    onFocus={() => setShowInvoiceDropdown(true)}
                    className="w-full pl-7 pr-2 py-1.5 rounded-md bg-neutral-50 border border-neutral-200 text-[11px]"
                  />
                </div>
                {showInvoiceDropdown && filteredInvoices.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-32 overflow-y-auto">
                    {filteredInvoices.slice(0, 5).map((inv) => (
                      <div key={inv.id} onClick={() => handleSelectInvoice(inv)} className="px-2 py-1.5 hover:bg-neutral-50 cursor-pointer text-[11px] border-b last:border-0">
                        <span className="font-medium text-indigo-600">{inv.invoice_number}</span>
                        <span className="text-neutral-500 ml-1">- {inv.supplier_name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="flex-1 bg-white rounded-lg border border-neutral-200 shadow-sm flex flex-col min-h-0 overflow-hidden">
            <div className="flex items-center justify-between px-2.5 py-2 border-b border-neutral-100 bg-neutral-50">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-neutral-500" />
                <span className="text-[11px] font-semibold text-neutral-700">Return Items</span>
                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-semibold rounded-full">{returnItems.length}</span>
              </div>
              <button onClick={addReturnItem} className="flex items-center gap-1 px-2 py-1 rounded-md bg-amber-50 text-amber-600 text-[10px] font-medium hover:bg-amber-100">
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-neutral-50 border-b border-neutral-100">
                  <tr>
                    <th className="px-2 py-1.5 text-left text-[9px] font-semibold text-neutral-500 uppercase w-8">#</th>
                    <th className="px-2 py-1.5 text-left text-[9px] font-semibold text-neutral-500 uppercase">Product</th>
                    <th className="px-2 py-1.5 text-center text-[9px] font-semibold text-neutral-500 uppercase w-16">Qty</th>
                    <th className="px-2 py-1.5 text-right text-[9px] font-semibold text-neutral-500 uppercase w-20">Price</th>
                    <th className="px-2 py-1.5 text-right text-[9px] font-semibold text-neutral-500 uppercase w-24">Total</th>
                    <th className="px-2 py-1.5 text-left text-[9px] font-semibold text-neutral-500 uppercase w-28">Reason</th>
                    <th className="px-2 py-1.5 w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {returnItems.map((item, index) => (
                    <tr key={item.id} className="hover:bg-neutral-50">
                      <td className="px-2 py-1.5 text-[10px] text-neutral-500">{index + 1}</td>
                      <td className="px-2 py-1.5">
                        <select value={item.product_id} onChange={(e) => updateReturnItem(item.id, "product_id", e.target.value)} className="w-full px-2 py-1 rounded bg-neutral-50 border border-neutral-200 text-[10px]">
                          <option value="">Select product</option>
                          {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="number" min="1" value={item.returned_quantity} onChange={(e) => updateReturnItem(item.id, "returned_quantity", e.target.value)} className="w-full px-2 py-1 rounded bg-neutral-50 border border-neutral-200 text-[10px] text-center" />
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="number" min="0" value={item.unit_price} onChange={(e) => updateReturnItem(item.id, "unit_price", e.target.value)} className="w-full px-2 py-1 rounded bg-neutral-50 border border-neutral-200 text-[10px] text-right" />
                      </td>
                      <td className="px-2 py-1.5 text-[10px] font-semibold text-neutral-900 text-right">{formatCurrency(item.total_amount)}</td>
                      <td className="px-2 py-1.5">
                        <select value={item.return_reason} onChange={(e) => updateReturnItem(item.id, "return_reason", e.target.value)} className="w-full px-2 py-1 rounded bg-neutral-50 border border-neutral-200 text-[10px]">
                          <option value="">Reason</option>
                          {RETURN_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-1.5">
                        <button onClick={() => removeReturnItem(item.id)} className="p-1 rounded text-red-500 hover:bg-red-50">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes Row */}
          <div className="bg-white rounded-lg border border-neutral-200 p-2.5 shadow-sm">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[9px] font-medium text-neutral-500 mb-1">Refund Method</label>
                <select value={refundMethod} onChange={(e) => setRefundMethod(e.target.value)} className="w-full px-2 py-1.5 rounded-md bg-neutral-50 border border-neutral-200 text-[11px]">
                  {REFUND_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-medium text-neutral-500 mb-1">Refund Status</label>
                <select value={refundStatus} onChange={(e) => setRefundStatus(e.target.value)} className="w-full px-2 py-1.5 rounded-md bg-neutral-50 border border-neutral-200 text-[11px]">
                  {REFUND_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-medium text-neutral-500 mb-1">Notes</label>
                <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add notes..." className="w-full px-2 py-1.5 rounded-md bg-neutral-50 border border-neutral-200 text-[11px]" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Summary */}
        <div className="w-[240px] flex flex-col gap-2">
          {/* Return Summary Card */}
          <div className="bg-white rounded-lg border border-neutral-200 p-3 shadow-sm">
            <h3 className="text-[12px] font-semibold text-neutral-900 mb-3">Return Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-[11px]">
                <span className="text-neutral-500">Total Items</span>
                <span className="font-medium text-neutral-900">{returnItems.length}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-neutral-500">Total Quantity</span>
                <span className="font-medium text-neutral-900">{returnItems.reduce((acc, item) => acc + Number(item.returned_quantity || 0), 0)}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-neutral-500">Subtotal</span>
                <span className="font-medium text-neutral-900">{formatCurrency(subtotal)}</span>
              </div>
              <div className="h-px bg-neutral-200 my-2"></div>
              <div className="flex justify-between">
                <span className="text-[12px] font-semibold text-neutral-900">Return Total</span>
                <span className="text-[14px] font-bold text-amber-600">{formatCurrency(returnTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[11px] text-neutral-500">Refund Amount</span>
                <span className="text-[12px] font-bold text-emerald-600">{formatCurrency(returnTotal)}</span>
              </div>
            </div>

            {/* Status Badge */}
            <div className="mt-3 p-2 rounded-lg bg-neutral-50 border border-neutral-200">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-neutral-500">Refund Status</span>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase ${
                  refundStatus === "Refunded" ? "bg-emerald-100 text-emerald-700" :
                  refundStatus === "Adjusted" ? "bg-blue-100 text-blue-700" :
                  "bg-amber-100 text-amber-700"
                }`}>
                  {refundStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleSaveReturn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white text-[11px] font-semibold hover:from-amber-600 hover:to-orange-700 shadow-lg shadow-amber-500/25 disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {loading ? "Processing..." : "Process Return"}
          </button>
        </div>
      </div>
    </div>
  );
}
