"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Search,
  Save,
  X,
  Undo2,
  AlertCircle,
  User,
  Printer,
  Package,
  CheckCircle,
} from "lucide-react";
import {
  getSaleInvoices,
  getSaleInvoiceById,
  getProducts,
  createSaleReturn,
} from "@/lib/db";

export default function SaleReturnPage() {
  // Return Invoice Info
  const [returnInvoiceNo, setReturnInvoiceNo] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [returnTime, setReturnTime] = useState("");

  // Original Sale Invoice
  const [saleInvoices, setSaleInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [showInvoiceDropdown, setShowInvoiceDropdown] = useState(false);

  // Customer Info (optional)
  const [customerName, setCustomerName] = useState("");
  const [customerContact, setCustomerContact] = useState("");

  // Products
  const [products, setProducts] = useState([]);

  // Return Items
  const [items, setItems] = useState([
    {
      id: 1,
      product_id: "",
      product_name: "",
      product_sku: "",
      company_name: "",
      batch_no: "",
      expiry_date: "",
      returned_quantity: 1,
      unit_price: 0,
      subtotal: 0,
      return_reason: "",
    },
  ]);

  // Calculations
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [taxPercentage, setTaxPercentage] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [extraChargesDeduction, setExtraChargesDeduction] = useState(0);
  const [roundOff, setRoundOff] = useState(0);

  // Refund Info
  const [refundMethod, setRefundMethod] = useState("Cash");
  const [refundAmount, setRefundAmount] = useState(0);
  const [refundStatus, setRefundStatus] = useState("Pending");

  // Notes and Meta
  const [returnReason, setReturnReason] = useState("");
  const [notes, setNotes] = useState("");
  const [createdBy, setCreatedBy] = useState("");
  const [stockAdjustmentStatus, setStockAdjustmentStatus] = useState("Added back to stock");

  // Loading
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Generate return invoice number
  const generateReturnInvoiceNo = () => {
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0].replace(/-/g, "");
    const sequence = String(Math.floor(Math.random() * 9999) + 1).padStart(4, "0");
    return `SR-${dateStr}-${sequence}`;
  };

  // Initialize
  useEffect(() => {
    const now = new Date();
    setReturnInvoiceNo(generateReturnInvoiceNo());
    setReturnDate(now.toISOString().split("T")[0]);
    setReturnTime(now.toLocaleTimeString("en-US", { hour12: false }));

    // Update time every second
    const timer = setInterval(() => {
      setReturnTime(new Date().toLocaleTimeString("en-US", { hour12: false }));
    }, 1000);

    loadData();

    return () => clearInterval(timer);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [invoicesData, productsData] = await Promise.all([
        getSaleInvoices(),
        getProducts(),
      ]);
      setSaleInvoices(invoicesData || []);
      setProducts(productsData || []);
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setLoading(false);
  };

  // Filter invoices based on search
  const filteredInvoices = saleInvoices.filter(
    (inv) =>
      inv.invoice_no?.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
      inv.customer_name?.toLowerCase().includes(invoiceSearch.toLowerCase())
  );

  // Select original invoice
  const handleSelectInvoice = async (invoice) => {
    setSelectedInvoice(invoice);
    setInvoiceSearch(invoice.invoice_no);
    setShowInvoiceDropdown(false);
    setCustomerName(invoice.customer_name || "");
    setCustomerContact(invoice.customer_contact || invoice.customer_phone || "");

    // Try to load invoice items
    try {
      const fullInvoice = await getSaleInvoiceById(invoice.id);
      if (fullInvoice && fullInvoice.items && fullInvoice.items.length > 0) {
        // Pre-populate items from invoice
        const invoiceItems = fullInvoice.items.map((item, index) => ({
          id: index + 1,
          product_id: item.product_id || "",
          product_name: item.product_name || item.name || "",
          product_sku: item.sku || item.product_sku || "",
          company_name: item.company_name || item.brand || "",
          batch_no: item.batch_no || "",
          expiry_date: item.expiry_date || "",
          returned_quantity: 0,
          max_quantity: item.quantity || 0,
          unit_price: item.price || item.unit_price || 0,
          subtotal: 0,
          return_reason: "",
        }));
        setItems(invoiceItems);
      }
    } catch (error) {
      console.error("Error loading invoice details:", error);
    }
  };

  // Add item
  const addItem = () => {
    setItems([
      ...items,
      {
        id: items.length + 1,
        product_id: "",
        product_name: "",
        product_sku: "",
        company_name: "",
        batch_no: "",
        expiry_date: "",
        returned_quantity: 1,
        unit_price: 0,
        subtotal: 0,
        return_reason: "",
      },
    ]);
  };

  // Remove item
  const removeItem = (id) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  // Update item
  const updateItem = (id, field, value) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          // Recalculate subtotal
          if (field === "returned_quantity" || field === "unit_price") {
            updated.subtotal = Number(updated.returned_quantity) * Number(updated.unit_price);
          }
          return updated;
        }
        return item;
      })
    );
  };

  // Select product for item
  const handleSelectProduct = (itemId, product) => {
    setItems(
      items.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            product_id: product.id,
            product_name: product.name,
            product_sku: product.sku || "",
            company_name: product.company_name || product.brand || "",
            batch_no: product.batch_no || "",
            expiry_date: product.expiry_date || "",
            unit_price: product.sale_price || product.price || 0,
            subtotal: Number(item.returned_quantity) * Number(product.sale_price || product.price || 0),
          };
        }
        return item;
      })
    );
  };

  // Calculate totals
  const itemsSubtotal = items.reduce((acc, item) => acc + Number(item.subtotal || 0), 0);

  useEffect(() => {
    // Calculate discount amount
    const discAmt = (itemsSubtotal * Number(discountPercentage)) / 100;
    setDiscountAmount(discAmt);

    // Calculate after discount
    const afterDiscount = itemsSubtotal - discAmt;

    // Calculate tax amount
    const taxAmt = (afterDiscount * Number(taxPercentage)) / 100;
    setTaxAmount(taxAmt);

    // Calculate refund total
    const total = afterDiscount + taxAmt - Number(extraChargesDeduction) + Number(roundOff);
    setRefundAmount(Math.max(0, total));
  }, [itemsSubtotal, discountPercentage, taxPercentage, extraChargesDeduction, roundOff]);

  // Save return
  const handleSave = async () => {
    if (!selectedInvoice) {
      alert("Please select an original sale invoice");
      return;
    }

    if (items.every((item) => !item.returned_quantity || item.returned_quantity <= 0)) {
      alert("Please add at least one item to return");
      return;
    }

    setSaving(true);
    try {
      const returnData = {
        return_invoice_no: returnInvoiceNo,
        return_date: returnDate,
        return_time: returnTime,
        original_sale_invoice_id: selectedInvoice.id,
        original_sale_invoice_no: selectedInvoice.invoice_no,
        customer_name: customerName,
        customer_contact: customerContact,
        items_subtotal: itemsSubtotal,
        discount_percentage: discountPercentage,
        discount_amount: discountAmount,
        tax_percentage: taxPercentage,
        tax_amount: taxAmount,
        extra_charges_deduction: extraChargesDeduction,
        round_off: roundOff,
        refund_total: refundAmount,
        refund_method: refundMethod,
        refund_amount: refundAmount,
        refund_status: refundStatus,
        return_reason: returnReason,
        notes: notes,
        created_by: createdBy,
        stock_adjustment_status: stockAdjustmentStatus,
        items: items.filter((item) => item.returned_quantity > 0).map((item) => ({
          product_id: item.product_id,
          product_name: item.product_name,
          product_sku: item.product_sku,
          company_name: item.company_name,
          batch_no: item.batch_no,
          expiry_date: item.expiry_date,
          returned_quantity: item.returned_quantity,
          unit_price: item.unit_price,
          subtotal: item.subtotal,
          return_reason: item.return_reason,
        })),
      };

      await createSaleReturn(returnData);
      alert("Sale return saved successfully!");

      // Reset form
      setReturnInvoiceNo(generateReturnInvoiceNo());
      setSelectedInvoice(null);
      setInvoiceSearch("");
      setCustomerName("");
      setCustomerContact("");
      setItems([
        {
          id: 1,
          product_id: "",
          product_name: "",
          product_sku: "",
          company_name: "",
          batch_no: "",
          expiry_date: "",
          returned_quantity: 1,
          unit_price: 0,
          subtotal: 0,
          return_reason: "",
        },
      ]);
      setDiscountPercentage(0);
      setTaxPercentage(0);
      setExtraChargesDeduction(0);
      setRoundOff(0);
      setRefundMethod("Cash");
      setRefundStatus("Pending");
      setReturnReason("");
      setNotes("");
      setCreatedBy("");
    } catch (error) {
      console.error("Error saving return:", error);
      alert("Error saving sale return");
    }
    setSaving(false);
  };

  // Print receipt
  const handlePrint = () => {
    const printContent = `
      <html>
        <head>
          <title>Sale Return - ${returnInvoiceNo}</title>
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
            <div>${returnInvoiceNo}</div>
          </div>
          <div class="info">
            <div class="info-row"><span>Date:</span><span>${returnDate}</span></div>
            <div class="info-row"><span>Time:</span><span>${returnTime}</span></div>
            <div class="info-row"><span>Original Invoice:</span><span>${selectedInvoice?.invoice_no || '-'}</span></div>
            ${customerName ? `<div class="info-row"><span>Customer:</span><span>${customerName}</span></div>` : ''}
            ${customerContact ? `<div class="info-row"><span>Contact:</span><span>${customerContact}</span></div>` : ''}
          </div>
          <div class="items">
            <div style="font-weight: bold; margin-bottom: 5px;">Returned Items:</div>
            ${items
              .filter((item) => item.returned_quantity > 0)
              .map(
                (item) => `
              <div class="item">
                <div>${item.product_name}</div>
                <div style="display: flex; justify-content: space-between;">
                  <span>${item.returned_quantity} x Rs.${Number(item.unit_price).toFixed(2)}</span>
                  <span>Rs.${Number(item.subtotal).toFixed(2)}</span>
                </div>
                ${item.return_reason ? `<div style="font-size: 10px; color: #666;">Reason: ${item.return_reason}</div>` : ''}
              </div>
            `
              )
              .join("")}
          </div>
          <div class="totals">
            <div class="total-row"><span>Subtotal:</span><span>Rs.${itemsSubtotal.toFixed(2)}</span></div>
            ${discountAmount > 0 ? `<div class="total-row"><span>Discount (${discountPercentage}%):</span><span>-Rs.${discountAmount.toFixed(2)}</span></div>` : ''}
            ${taxAmount > 0 ? `<div class="total-row"><span>Tax (${taxPercentage}%):</span><span>Rs.${taxAmount.toFixed(2)}</span></div>` : ''}
            ${extraChargesDeduction > 0 ? `<div class="total-row"><span>Deduction:</span><span>-Rs.${extraChargesDeduction.toFixed(2)}</span></div>` : ''}
            ${roundOff !== 0 ? `<div class="total-row"><span>Round Off:</span><span>Rs.${roundOff.toFixed(2)}</span></div>` : ''}
            <div class="total-row grand-total"><span>REFUND TOTAL:</span><span>Rs.${refundAmount.toFixed(2)}</span></div>
          </div>
          <div class="info" style="margin-top: 10px;">
            <div class="info-row"><span>Refund Method:</span><span>${refundMethod}</span></div>
            <div class="info-row"><span>Status:</span><span>${refundStatus}</span></div>
            <div class="info-row"><span>Stock:</span><span>${stockAdjustmentStatus}</span></div>
          </div>
          ${notes ? `<div style="margin-top: 10px; font-size: 10px;">Notes: ${notes}</div>` : ''}
          <div class="footer">
            <p>Thank you!</p>
            ${createdBy ? `<p>Processed by: ${createdBy}</p>` : ''}
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

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      {/* Header Row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-neutral-900">Sale Return Invoice</h1>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="text-neutral-500">Return #: <span className="font-semibold text-indigo-600">{returnInvoiceNo}</span></span>
            <span className="text-neutral-500">Date: <span className="font-medium text-neutral-700">{returnDate}</span></span>
            <span className="text-neutral-500">Time: <span className="font-medium text-neutral-700">{returnTime}</span></span>
            <span className="flex items-center gap-1 text-emerald-600">
              <CheckCircle className="w-3.5 h-3.5" />
              <span className="font-medium">{stockAdjustmentStatus}</span>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-100 text-neutral-700 text-[11px] font-medium hover:bg-neutral-200 transition-colors">
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-100 text-neutral-700 text-[11px] font-medium hover:bg-neutral-200 transition-colors">
            <X className="w-3.5 h-3.5" />
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 text-white text-[11px] font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50">
            <Save className="w-3.5 h-3.5" />
            {saving ? "Saving..." : "Process Return"}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-3 min-h-0">
        {/* Left Panel - Details & Items */}
        <div className="flex-1 flex flex-col min-h-0 gap-2">
          {/* Return Details Row - 4 columns */}
          <div className="bg-white rounded-lg border border-neutral-200 p-2.5 shadow-sm">
            <div className="grid grid-cols-4 gap-3">
              {/* Original Invoice Search */}
              <div className="relative">
                <label className="block text-[10px] font-medium text-neutral-500 mb-1">Original Sale Invoice *</label>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                  <input
                    type="text"
                    value={invoiceSearch}
                    onChange={(e) => { setInvoiceSearch(e.target.value); setShowInvoiceDropdown(true); }}
                    onFocus={() => setShowInvoiceDropdown(true)}
                    placeholder="Search invoice..."
                    className="w-full pl-7 pr-2 py-1.5 rounded-md bg-neutral-50 border border-neutral-200 text-[11px] focus:outline-none focus:border-indigo-300"
                  />
                </div>
                {showInvoiceDropdown && filteredInvoices.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-32 overflow-y-auto">
                    {filteredInvoices.slice(0, 5).map((inv) => (
                      <div key={inv.id} onClick={() => handleSelectInvoice(inv)} className="px-2 py-1.5 hover:bg-neutral-50 cursor-pointer text-[11px]">
                        <span className="font-medium">{inv.invoice_no}</span>
                        {inv.customer_name && <span className="text-neutral-500 ml-1">- {inv.customer_name}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* Customer Name */}
              <div>
                <label className="block text-[10px] font-medium text-neutral-500 mb-1">Customer Name</label>
                <div className="relative">
                  <User className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                  <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer name" className="w-full pl-7 pr-2 py-1.5 rounded-md bg-neutral-50 border border-neutral-200 text-[11px] focus:outline-none focus:border-indigo-300" />
                </div>
              </div>
              {/* Customer Contact */}
              <div>
                <label className="block text-[10px] font-medium text-neutral-500 mb-1">Contact</label>
                <input type="text" value={customerContact} onChange={(e) => setCustomerContact(e.target.value)} placeholder="Phone number" className="w-full px-2 py-1.5 rounded-md bg-neutral-50 border border-neutral-200 text-[11px] focus:outline-none focus:border-indigo-300" />
              </div>
              {/* Created By */}
              <div>
                <label className="block text-[10px] font-medium text-neutral-500 mb-1">Created By</label>
                <input type="text" value={createdBy} onChange={(e) => setCreatedBy(e.target.value)} placeholder="Staff name" className="w-full px-2 py-1.5 rounded-md bg-neutral-50 border border-neutral-200 text-[11px] focus:outline-none focus:border-indigo-300" />
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="flex-1 bg-white rounded-lg border border-neutral-200 shadow-sm overflow-hidden flex flex-col min-h-0">
            <div className="px-3 py-2 border-b border-neutral-100 bg-neutral-50 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-neutral-700 flex items-center gap-2">
                <Package className="w-3.5 h-3.5" />
                Return Items
                {items.length > 0 && <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-[9px] font-semibold rounded-full">{items.length}</span>}
              </span>
              <button onClick={addItem} className="flex items-center gap-1 px-2 py-1 rounded-md bg-indigo-50 text-indigo-600 text-[10px] font-medium hover:bg-indigo-100 transition-colors">
                <Plus className="w-3 h-3" />
                Add Item
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-neutral-50 border-b border-neutral-100">
                  <tr>
                    <th className="px-2 py-1.5 text-left text-[9px] font-semibold text-neutral-500 uppercase">#</th>
                    <th className="px-2 py-1.5 text-left text-[9px] font-semibold text-neutral-500 uppercase">Product</th>
                    <th className="px-2 py-1.5 text-left text-[9px] font-semibold text-neutral-500 uppercase">SKU</th>
                    <th className="px-2 py-1.5 text-left text-[9px] font-semibold text-neutral-500 uppercase">Company</th>
                    <th className="px-2 py-1.5 text-left text-[9px] font-semibold text-neutral-500 uppercase">Batch</th>
                    <th className="px-2 py-1.5 text-left text-[9px] font-semibold text-neutral-500 uppercase">Expiry</th>
                    <th className="px-2 py-1.5 text-left text-[9px] font-semibold text-neutral-500 uppercase">Qty</th>
                    <th className="px-2 py-1.5 text-left text-[9px] font-semibold text-neutral-500 uppercase">Price</th>
                    <th className="px-2 py-1.5 text-left text-[9px] font-semibold text-neutral-500 uppercase">Subtotal</th>
                    <th className="px-2 py-1.5 text-left text-[9px] font-semibold text-neutral-500 uppercase">Reason</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {items.map((item, index) => (
                    <tr key={item.id} className="hover:bg-neutral-50/50">
                      <td className="px-2 py-1.5 text-[10px] text-neutral-600">{index + 1}</td>
                      <td className="px-2 py-1.5">
                        <input type="text" value={item.product_name} onChange={(e) => updateItem(item.id, "product_name", e.target.value)} placeholder="Product..." className="w-28 px-2 py-1 rounded bg-neutral-50 border border-neutral-200 text-[10px] focus:outline-none focus:border-indigo-300" list={`products-${item.id}`} />
                        <datalist id={`products-${item.id}`}>{products.map((p) => (<option key={p.id} value={p.name}>{p.sku} - {p.name}</option>))}</datalist>
                      </td>
                      <td className="px-2 py-1.5"><input type="text" value={item.product_sku} onChange={(e) => updateItem(item.id, "product_sku", e.target.value)} placeholder="SKU" className="w-16 px-2 py-1 rounded bg-neutral-50 border border-neutral-200 text-[10px] focus:outline-none focus:border-indigo-300" /></td>
                      <td className="px-2 py-1.5"><input type="text" value={item.company_name} onChange={(e) => updateItem(item.id, "company_name", e.target.value)} placeholder="Company" className="w-16 px-2 py-1 rounded bg-neutral-50 border border-neutral-200 text-[10px] focus:outline-none focus:border-indigo-300" /></td>
                      <td className="px-2 py-1.5"><input type="text" value={item.batch_no} onChange={(e) => updateItem(item.id, "batch_no", e.target.value)} placeholder="Batch" className="w-14 px-2 py-1 rounded bg-neutral-50 border border-neutral-200 text-[10px] focus:outline-none focus:border-indigo-300" /></td>
                      <td className="px-2 py-1.5"><input type="date" value={item.expiry_date} onChange={(e) => updateItem(item.id, "expiry_date", e.target.value)} className="w-24 px-1 py-1 rounded bg-neutral-50 border border-neutral-200 text-[10px] focus:outline-none focus:border-indigo-300" /></td>
                      <td className="px-2 py-1.5"><input type="number" min="0" max={item.max_quantity || 9999} value={item.returned_quantity} onChange={(e) => updateItem(item.id, "returned_quantity", e.target.value)} className="w-12 px-1 py-1 rounded bg-neutral-50 border border-neutral-200 text-[10px] text-center focus:outline-none focus:border-indigo-300" /></td>
                      <td className="px-2 py-1.5"><input type="number" min="0" step="0.01" value={item.unit_price} onChange={(e) => updateItem(item.id, "unit_price", e.target.value)} className="w-14 px-1 py-1 rounded bg-neutral-50 border border-neutral-200 text-[10px] focus:outline-none focus:border-indigo-300" /></td>
                      <td className="px-2 py-1.5 text-[10px] font-semibold text-neutral-900">Rs.{Number(item.subtotal).toFixed(0)}</td>
                      <td className="px-2 py-1.5">
                        <select value={item.return_reason} onChange={(e) => updateItem(item.id, "return_reason", e.target.value)} className="w-20 px-1 py-1 rounded bg-neutral-50 border border-neutral-200 text-[10px] focus:outline-none focus:border-indigo-300">
                          <option value="">Select</option>
                          <option value="Defective">Defective</option>
                          <option value="Wrong Item">Wrong</option>
                          <option value="Damaged">Damaged</option>
                          <option value="Expired">Expired</option>
                          <option value="Changed Mind">Changed</option>
                          <option value="Other">Other</option>
                        </select>
                      </td>
                      <td className="px-1 py-1.5"><button onClick={() => removeItem(item.id)} className="p-1 rounded text-red-500 hover:bg-red-50 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button></td>
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
                <label className="block text-[10px] font-medium text-neutral-500 mb-1">Return Reason</label>
                <select value={returnReason} onChange={(e) => setReturnReason(e.target.value)} className="w-full px-2 py-1.5 rounded-md bg-neutral-50 border border-neutral-200 text-[11px] focus:outline-none focus:border-indigo-300">
                  <option value="">Select reason</option>
                  <option value="Product Defect">Product Defect</option>
                  <option value="Wrong Product Delivered">Wrong Product</option>
                  <option value="Product Damaged">Damaged</option>
                  <option value="Product Expired">Expired</option>
                  <option value="Customer Changed Mind">Changed Mind</option>
                  <option value="Quality Issue">Quality Issue</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-medium text-neutral-500 mb-1">Stock Adjustment</label>
                <select value={stockAdjustmentStatus} onChange={(e) => setStockAdjustmentStatus(e.target.value)} className="w-full px-2 py-1.5 rounded-md bg-neutral-50 border border-neutral-200 text-[11px] focus:outline-none focus:border-indigo-300">
                  <option value="Added back to stock">Added back to stock</option>
                  <option value="Marked as damaged">Marked as damaged</option>
                  <option value="Pending inspection">Pending inspection</option>
                  <option value="Discarded">Discarded</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-medium text-neutral-500 mb-1">Notes</label>
                <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional notes..." className="w-full px-2 py-1.5 rounded-md bg-neutral-50 border border-neutral-200 text-[11px] focus:outline-none focus:border-indigo-300" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Summary (280px) */}
        <div className="w-[280px] flex flex-col gap-2">
          {/* Refund Calculations */}
          <div className="bg-white rounded-lg border border-neutral-200 p-3 shadow-sm">
            <h3 className="text-[11px] font-semibold text-neutral-800 mb-2 pb-2 border-b border-neutral-100">Refund Calculations</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-neutral-500">Subtotal</span>
                <span className="font-semibold text-neutral-900">Rs.{itemsSubtotal.toFixed(0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-neutral-500">Discount %</span>
                <input type="number" min="0" max="100" value={discountPercentage} onChange={(e) => setDiscountPercentage(Number(e.target.value))} className="w-14 px-2 py-1 rounded bg-neutral-50 border border-neutral-200 text-[10px] text-right focus:outline-none" />
              </div>
              {discountAmount > 0 && (
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-neutral-500">Discount</span>
                  <span className="font-medium text-red-500">-Rs.{discountAmount.toFixed(0)}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-neutral-500">Tax %</span>
                <input type="number" min="0" max="100" value={taxPercentage} onChange={(e) => setTaxPercentage(Number(e.target.value))} className="w-14 px-2 py-1 rounded bg-neutral-50 border border-neutral-200 text-[10px] text-right focus:outline-none" />
              </div>
              {taxAmount > 0 && (
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-neutral-500">Tax</span>
                  <span className="font-medium">Rs.{taxAmount.toFixed(0)}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-neutral-500">Deduction</span>
                <input type="number" min="0" value={extraChargesDeduction} onChange={(e) => setExtraChargesDeduction(Number(e.target.value))} className="w-14 px-2 py-1 rounded bg-neutral-50 border border-neutral-200 text-[10px] text-right focus:outline-none" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-neutral-500">Round Off</span>
                <input type="number" step="0.01" value={roundOff} onChange={(e) => setRoundOff(Number(e.target.value))} className="w-14 px-2 py-1 rounded bg-neutral-50 border border-neutral-200 text-[10px] text-right focus:outline-none" />
              </div>
            </div>
          </div>

          {/* Refund Method & Status */}
          <div className="bg-white rounded-lg border border-neutral-200 p-3 shadow-sm">
            <h3 className="text-[11px] font-semibold text-neutral-800 mb-2 pb-2 border-b border-neutral-100">Refund Details</h3>
            <div className="space-y-2">
              <div>
                <label className="block text-[10px] font-medium text-neutral-500 mb-1">Refund Method</label>
                <select value={refundMethod} onChange={(e) => setRefundMethod(e.target.value)} className="w-full px-2 py-1.5 rounded-md bg-neutral-50 border border-neutral-200 text-[11px] focus:outline-none">
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Credit Note">Credit Note</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-medium text-neutral-500 mb-1">Refund Amount</label>
                <input type="number" min="0" step="0.01" value={refundAmount} onChange={(e) => setRefundAmount(Number(e.target.value))} className="w-full px-2 py-1.5 rounded-md bg-neutral-50 border border-neutral-200 text-[11px] focus:outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-neutral-500 mb-1">Status</label>
                <select value={refundStatus} onChange={(e) => setRefundStatus(e.target.value)} className="w-full px-2 py-1.5 rounded-md bg-neutral-50 border border-neutral-200 text-[11px] focus:outline-none">
                  <option value="Pending">Pending</option>
                  <option value="Refunded">Refunded</option>
                </select>
              </div>
            </div>
          </div>

          {/* Summary Card */}
          <div className="bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-lg p-3 text-white shadow-lg">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[9px] text-neutral-400 uppercase tracking-wide mb-0.5">Subtotal</p>
                <p className="text-[13px] font-semibold">Rs.{itemsSubtotal.toFixed(0)}</p>
              </div>
              <div>
                <p className="text-[9px] text-neutral-400 uppercase tracking-wide mb-0.5">Refund Total</p>
                <p className="text-[16px] font-bold text-indigo-400">Rs.{refundAmount.toFixed(0)}</p>
              </div>
            </div>
            {(discountAmount > 0 || taxAmount > 0) && (
              <div className="mt-2 pt-2 border-t border-white/10 flex gap-3 text-[10px]">
                {discountAmount > 0 && <span className="text-amber-400">Disc: -Rs.{discountAmount.toFixed(0)}</span>}
                {taxAmount > 0 && <span className="text-neutral-300">Tax: +Rs.{taxAmount.toFixed(0)}</span>}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button onClick={() => handleSave()} disabled={saving} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-indigo-600 text-white text-[11px] font-semibold hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/20">
              <Undo2 className="w-4 h-4" />
              {saving ? "Processing..." : "Process Refund"}
            </button>
            <button onClick={handlePrint} className="px-3 py-2.5 rounded-lg bg-neutral-200 text-neutral-700 hover:bg-neutral-300 transition-colors">
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
