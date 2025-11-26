"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  Printer,
  Save,
  X,
  Search,
  Package,
  AlertTriangle,
  Minus,
} from "lucide-react";
import { getProducts, createSaleInvoice, getSaleInvoices } from "@/lib/db";
import { useToast, ToastContainer } from "@/components/Toast";

// Payment methods
const PAYMENT_METHODS = ["Cash", "Card", "Bank Transfer", "Credit", "Mobile Wallet"];

// Extra charge types
const EXTRA_CHARGE_TYPES = [
  { id: "packing", label: "Packing Charges", default: 0 },
  { id: "service", label: "Service Charges", default: 0 },
  { id: "bag", label: "Bag/Carry Charges", default: 0 },
  { id: "delivery", label: "Delivery Charges", default: 0 },
];

export default function SaleInvoicePage() {
  const router = useRouter();
  const { toasts, showToast, removeToast } = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const searchInputRef = useRef(null);

  // Invoice details
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [invoiceTime, setInvoiceTime] = useState("");

  // Product search
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const searchDropdownRef = useRef(null);

  // Invoice items
  const [items, setItems] = useState([]);

  // Pricing
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState("amount"); // "amount" or "percent"
  const [extraCharges, setExtraCharges] = useState({
    packing: 0,
    service: 0,
    bag: 0,
    delivery: 0,
  });
  const [taxEnabled, setTaxEnabled] = useState(false);
  const [taxRate, setTaxRate] = useState(5);
  const [roundOff, setRoundOff] = useState(true);

  // Payment
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paidAmount, setPaidAmount] = useState(0);
  const [notes, setNotes] = useState("");

  // Load data on mount
  useEffect(() => {
    async function fetchData() {
      try {
        const [productsData, invoicesData] = await Promise.all([
          getProducts(),
          getSaleInvoices(),
        ]);
        setProducts(productsData || []);

        // Generate invoice number
        generateInvoiceNumber(invoicesData?.length || 0);

        // Set current date and time
        updateDateTime();
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();

    // Update time every second
    const timeInterval = setInterval(updateDateTime, 1000);
    return () => clearInterval(timeInterval);
  }, []);

  // Close search dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(event.target)) {
        setShowSearchDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search products when search term changes
  useEffect(() => {
    if (searchTerm.trim()) {
      const results = products.filter((product) => {
        const term = searchTerm.toLowerCase();
        return (
          product.name?.toLowerCase().includes(term) ||
          product.sku?.toLowerCase().includes(term) ||
          product.brand?.toLowerCase().includes(term) ||
          product.category?.toLowerCase().includes(term)
        );
      });
      setSearchResults(results.slice(0, 10));
      setShowSearchDropdown(true);
    } else {
      setSearchResults([]);
      setShowSearchDropdown(false);
    }
  }, [searchTerm, products]);

  const updateDateTime = () => {
    const now = new Date();
    setInvoiceDate(now.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }));
    setInvoiceTime(now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }));
  };

  const generateInvoiceNumber = (existingCount) => {
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0].replace(/-/g, "");
    const sequence = String(existingCount + 1).padStart(4, "0");
    setInvoiceNumber(`INV-${dateStr}-${sequence}`);
  };

  const addProductToInvoice = (product) => {
    // Check if product already exists in items
    const existingItem = items.find((item) => item.product_id === product.id);

    if (existingItem) {
      // Increment quantity if stock allows
      if (existingItem.quantity < product.stock) {
        updateItemQuantity(existingItem.id, existingItem.quantity + 1);
      } else {
        showToast(`Maximum stock (${product.stock}) reached for ${product.name}`, "warning");
      }
    } else {
      // Check if product has stock
      if (product.stock <= 0) {
        showToast(`${product.name} is out of stock`, "warning");
        return;
      }

      // Add new item
      const newItem = {
        id: Date.now(),
        product_id: product.id,
        product: product,
        quantity: 1,
        price: product.sale_price || 0,
        discount: 0,
        total: product.sale_price || 0,
      };
      setItems([...items, newItem]);
    }

    // Clear search
    setSearchTerm("");
    setShowSearchDropdown(false);
    searchInputRef.current?.focus();
  };

  const removeItem = (itemId) => {
    setItems(items.filter((item) => item.id !== itemId));
  };

  const updateItemQuantity = (itemId, quantity) => {
    const qty = Math.max(1, parseInt(quantity) || 1);
    setItems(
      items.map((item) => {
        if (item.id === itemId) {
          const maxQty = item.product?.stock || qty;
          const finalQty = Math.min(qty, maxQty);
          const itemTotal = finalQty * item.price - item.discount;
          return { ...item, quantity: finalQty, total: itemTotal };
        }
        return item;
      })
    );
  };

  const updateItemDiscount = (itemId, discountValue) => {
    const disc = Math.max(0, parseFloat(discountValue) || 0);
    setItems(
      items.map((item) => {
        if (item.id === itemId) {
          const itemTotal = item.quantity * item.price - disc;
          return { ...item, discount: disc, total: Math.max(0, itemTotal) };
        }
        return item;
      })
    );
  };

  const updateItemPrice = (itemId, price) => {
    const p = Math.max(0, parseFloat(price) || 0);
    setItems(
      items.map((item) => {
        if (item.id === itemId) {
          const itemTotal = item.quantity * p - item.discount;
          return { ...item, price: p, total: Math.max(0, itemTotal) };
        }
        return item;
      })
    );
  };

  // Check if product is expiring soon (within 30 days)
  const isExpiringSoon = (product) => {
    if (!product?.expiry_date) return false;
    const expiryDate = new Date(product.expiry_date);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  const isExpired = (product) => {
    if (!product?.expiry_date) return false;
    const expiryDate = new Date(product.expiry_date);
    return expiryDate < new Date();
  };

  // Calculations
  const subtotal = items.reduce((acc, item) => acc + item.total, 0);
  const totalExtraCharges = Object.values(extraCharges).reduce((acc, val) => acc + (parseFloat(val) || 0), 0);
  const discountAmount = discountType === "percent" ? (subtotal * discount) / 100 : discount;
  const afterDiscount = subtotal - discountAmount + totalExtraCharges;
  const taxAmount = taxEnabled ? (afterDiscount * taxRate) / 100 : 0;
  const beforeRoundOff = afterDiscount + taxAmount;
  const roundOffAmount = roundOff ? Math.round(beforeRoundOff) - beforeRoundOff : 0;
  const grandTotal = beforeRoundOff + roundOffAmount;
  const balance = grandTotal - paidAmount;

  const formatCurrency = (amount) => {
    return `Rs. ${Number(amount || 0).toLocaleString("en-PK", { minimumFractionDigits: 2 })}`;
  };

  const handleSaveInvoice = async (shouldPrint = false) => {
    if (items.length === 0) {
      showToast("Please add at least one product to the invoice", "warning");
      return;
    }

    // Check for expired products
    const expiredItems = items.filter((item) => isExpired(item.product));
    if (expiredItems.length > 0) {
      const proceed = confirm(
        `Warning: ${expiredItems.length} item(s) have expired. Do you want to proceed?`
      );
      if (!proceed) return;
    }

    // Check stock availability
    for (const item of items) {
      if (item.quantity > (item.product?.stock || 0)) {
        showToast(`Insufficient stock for ${item.product?.name}. Available: ${item.product?.stock}`, "error");
        return;
      }
    }

    setSaving(true);
    try {
      const invoice = {
        customer_id: null,
        subtotal: subtotal,
        tax: taxAmount,
        discount: discountAmount,
        extra_charges: totalExtraCharges,
        total: grandTotal,
        paid: paidAmount,
        balance: balance,
        payment_method: paymentMethod,
        status: balance <= 0 ? "paid" : "pending",
        notes: notes,
      };

      const invoiceItems = items.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        discount: item.discount,
        total: item.total,
      }));

      const result = await createSaleInvoice(invoice, invoiceItems);

      if (shouldPrint) {
        // Print functionality
        printReceipt(result.invoice_number);
      }

      showToast(`Invoice ${result.invoice_number} saved successfully!`, "success");
      resetForm();

      // Refresh products to get updated stock
      const productsData = await getProducts();
      setProducts(productsData || []);

    } catch (error) {
      console.error("Failed to save invoice:", error);
      showToast("Failed to save invoice. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const printReceipt = (invoiceNum) => {
    // Create print content
    const printContent = `
      <html>
        <head>
          <title>Invoice ${invoiceNum}</title>
          <style>
            body { font-family: 'Courier New', monospace; font-size: 12px; width: 80mm; margin: 0 auto; }
            .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
            .header h2 { margin: 0; font-size: 16px; }
            .info { margin-bottom: 10px; }
            .info p { margin: 2px 0; }
            table { width: 100%; border-collapse: collapse; }
            th, td { text-align: left; padding: 4px 2px; }
            th { border-bottom: 1px dashed #000; }
            .total-section { border-top: 1px dashed #000; margin-top: 10px; padding-top: 10px; }
            .total-row { display: flex; justify-content: space-between; margin: 4px 0; }
            .grand-total { font-size: 14px; font-weight: bold; border-top: 1px dashed #000; padding-top: 5px; }
            .footer { text-align: center; margin-top: 20px; border-top: 1px dashed #000; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>SALE INVOICE</h2>
            <p>Your Store Name</p>
          </div>
          <div class="info">
            <p><strong>Invoice:</strong> ${invoiceNum}</p>
            <p><strong>Date:</strong> ${invoiceDate} ${invoiceTime}</p>
            <p><strong>Payment:</strong> ${paymentMethod}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${items.map((item) => `
                <tr>
                  <td>${item.product?.name}</td>
                  <td>${item.quantity}</td>
                  <td>${item.price}</td>
                  <td>${item.total}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
          <div class="total-section">
            <div class="total-row"><span>Subtotal:</span><span>${formatCurrency(subtotal)}</span></div>
            ${discountAmount > 0 ? `<div class="total-row"><span>Discount:</span><span>-${formatCurrency(discountAmount)}</span></div>` : ""}
            ${totalExtraCharges > 0 ? `<div class="total-row"><span>Extra Charges:</span><span>+${formatCurrency(totalExtraCharges)}</span></div>` : ""}
            ${taxEnabled ? `<div class="total-row"><span>Tax (${taxRate}%):</span><span>+${formatCurrency(taxAmount)}</span></div>` : ""}
            ${roundOff ? `<div class="total-row"><span>Round Off:</span><span>${roundOffAmount >= 0 ? "+" : ""}${formatCurrency(roundOffAmount)}</span></div>` : ""}
            <div class="total-row grand-total"><span>TOTAL:</span><span>${formatCurrency(grandTotal)}</span></div>
            <div class="total-row"><span>Paid:</span><span>${formatCurrency(paidAmount)}</span></div>
            ${balance > 0 ? `<div class="total-row"><span>Balance:</span><span>${formatCurrency(balance)}</span></div>` : ""}
          </div>
          <div class="footer">
            <p>Thank you for your purchase!</p>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  const resetForm = () => {
    setItems([]);
    setDiscount(0);
    setDiscountType("amount");
    setExtraCharges({ packing: 0, service: 0, bag: 0, delivery: 0 });
    setTaxEnabled(false);
    setPaidAmount(0);
    setNotes("");
    setSearchTerm("");

    // Generate new invoice number
    getSaleInvoices().then((invoices) => {
      generateInvoiceNumber(invoices?.length || 0);
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-neutral-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Header Row - Compact */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-bold text-neutral-900">Sale Invoice</h1>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="text-neutral-500">Invoice: <span className="font-semibold text-neutral-800">{invoiceNumber}</span></span>
            <span className="text-neutral-500">Date: <span className="font-medium text-neutral-700">{invoiceDate}</span></span>
            <span className="text-neutral-500">Time: <span className="font-medium text-neutral-700">{invoiceTime}</span></span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => router.back()} className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-neutral-100 text-neutral-700 text-[11px] font-medium hover:bg-neutral-200 transition-colors">
            <X className="w-3.5 h-3.5" />
            Cancel
          </button>
          <button onClick={() => handleSaveInvoice(true)} disabled={saving || items.length === 0} className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-emerald-500 text-white text-[11px] font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50">
            <Printer className="w-3.5 h-3.5" />
            Save & Print
          </button>
          <button onClick={() => handleSaveInvoice(false)} disabled={saving || items.length === 0} className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-neutral-700 text-white text-[11px] font-medium hover:bg-neutral-600 transition-colors disabled:opacity-50">
            <Save className="w-3.5 h-3.5" />
            {saving ? "Saving..." : "Save Invoice"}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Left Panel - Search & Items */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Search Bar */}
          <div ref={searchDropdownRef} className="relative mb-3">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search by SKU, product name, or brand..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-white border-2 border-neutral-200 text-[14px] focus:outline-none focus:border-emerald-400 transition-all shadow-sm"
              autoFocus
            />
            {showSearchDropdown && searchResults.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-neutral-200 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                {searchResults.map((product) => (
                  <div key={product.id} onClick={() => addProductToInvoice(product)} className={`px-4 py-3 hover:bg-emerald-50 cursor-pointer border-b border-neutral-100 last:border-b-0 flex items-center justify-between ${product.stock <= 0 ? "opacity-50" : ""}`}>
                    <div>
                      <p className="text-[13px] font-medium text-neutral-900">{product.name}</p>
                      <p className="text-[11px] text-neutral-500">SKU: {product.sku || "N/A"} | Stock: <span className={product.stock <= 10 ? "text-red-500 font-medium" : "text-emerald-600 font-medium"}>{product.stock}</span></p>
                    </div>
                    <p className="text-[14px] font-bold text-emerald-600">{formatCurrency(product.sale_price)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Items Table */}
          <div className="flex-1 bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden flex flex-col min-h-0">
            <div className="px-4 py-2.5 border-b border-neutral-100 bg-neutral-50 flex items-center justify-between">
              <span className="text-[13px] font-semibold text-neutral-700 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Invoice Items
                {items.length > 0 && <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[11px] font-semibold rounded-full">{items.length}</span>}
              </span>
            </div>
            <div className="flex-1 overflow-auto">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-neutral-400 py-8">
                  <Package className="w-12 h-12 mb-2 opacity-50" />
                  <p className="text-[13px] font-medium">No items added</p>
                  <p className="text-[11px]">Search products above to add</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="sticky top-0 bg-neutral-50 border-b border-neutral-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-[11px] font-semibold text-neutral-500 uppercase tracking-wide">Product</th>
                      <th className="px-3 py-2 text-center text-[11px] font-semibold text-neutral-500 uppercase tracking-wide w-28">Qty</th>
                      <th className="px-3 py-2 text-right text-[11px] font-semibold text-neutral-500 uppercase tracking-wide w-24">Price</th>
                      <th className="px-3 py-2 text-right text-[11px] font-semibold text-neutral-500 uppercase tracking-wide w-20">Disc</th>
                      <th className="px-3 py-2 text-right text-[11px] font-semibold text-neutral-500 uppercase tracking-wide w-28">Total</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {items.map((item) => (
                      <tr key={item.id} className="hover:bg-neutral-50/50">
                        <td className="px-4 py-2">
                          <p className="text-[13px] font-medium text-neutral-900">{item.product?.name}</p>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => updateItemQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1} className="w-6 h-6 rounded-md bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center disabled:opacity-40 transition-colors">
                              <Minus className="w-3 h-3" />
                            </button>
                            <input type="number" min="1" value={item.quantity} onChange={(e) => updateItemQuantity(item.id, e.target.value)} className="w-12 px-1 py-1 rounded-md bg-neutral-50 border border-neutral-200 text-[12px] text-center font-medium focus:outline-none focus:border-emerald-400" />
                            <button onClick={() => updateItemQuantity(item.id, item.quantity + 1)} disabled={item.quantity >= item.product?.stock} className="w-6 h-6 rounded-md bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center disabled:opacity-40 transition-colors">
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <input type="number" min="0" value={item.price} onChange={(e) => updateItemPrice(item.id, e.target.value)} className="w-full px-2 py-1 rounded-md bg-neutral-50 border border-neutral-200 text-[12px] text-right font-medium focus:outline-none focus:border-emerald-400" />
                        </td>
                        <td className="px-3 py-2">
                          <input type="number" min="0" value={item.discount} onChange={(e) => updateItemDiscount(item.id, e.target.value)} className="w-full px-2 py-1 rounded-md bg-neutral-50 border border-neutral-200 text-[12px] text-right focus:outline-none focus:border-emerald-400" />
                        </td>
                        <td className="px-3 py-2 text-[13px] font-bold text-neutral-900 text-right">{formatCurrency(item.total)}</td>
                        <td className="px-2 py-2">
                          <button onClick={() => removeItem(item.id)} className="p-1.5 rounded-md text-red-500 hover:bg-red-50 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Notes */}
          <input
            type="text"
            placeholder="Add notes (optional)..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-3 w-full px-4 py-2.5 rounded-xl bg-white border border-neutral-200 text-[13px] focus:outline-none focus:border-emerald-400 shadow-sm"
          />
        </div>

        {/* Right Panel - Charges, Summary & Actions */}
        <div className="w-[480px] flex flex-col gap-3">
          {/* Three Cards Row */}
          <div className="grid grid-cols-3 gap-3">
            {/* Extra Charges */}
            <div className="bg-white rounded-xl border border-neutral-200 p-3 shadow-sm">
              <h3 className="text-[12px] font-bold text-neutral-800 mb-3 pb-2 border-b border-neutral-100">Extra Charges</h3>
              <div className="space-y-2">
                {EXTRA_CHARGE_TYPES.map((charge) => (
                  <div key={charge.id} className="flex items-center justify-between">
                    <label className="text-[11px] text-neutral-600">{charge.label.replace(' Charges', '')}</label>
                    <input
                      type="number"
                      min="0"
                      value={extraCharges[charge.id]}
                      onChange={(e) => setExtraCharges({ ...extraCharges, [charge.id]: parseFloat(e.target.value) || 0 })}
                      className="w-16 px-2 py-1 rounded-md bg-neutral-50 border border-neutral-200 text-[11px] text-right font-medium focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Discount & Tax */}
            <div className="bg-white rounded-xl border border-neutral-200 p-3 shadow-sm">
              <h3 className="text-[12px] font-bold text-neutral-800 mb-3 pb-2 border-b border-neutral-100">Discount & Tax</h3>
              <div className="space-y-2">
                <div className="flex gap-1">
                  <input type="number" min="0" value={discount} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} placeholder="0" className="flex-1 px-2 py-1 rounded-md bg-neutral-50 border border-neutral-200 text-[11px] font-medium focus:outline-none focus:border-emerald-400" />
                  <select value={discountType} onChange={(e) => setDiscountType(e.target.value)} className="px-2 py-1 rounded-md bg-neutral-50 border border-neutral-200 text-[11px] font-medium focus:outline-none cursor-pointer">
                    <option value="amount">Rs</option>
                    <option value="percent">%</option>
                  </select>
                </div>
                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-neutral-600">Tax</span>
                    {taxEnabled && <input type="number" min="0" max="100" value={taxRate} onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)} className="w-10 px-1 py-0.5 rounded bg-neutral-50 border border-neutral-200 text-[10px] text-center font-medium focus:outline-none" />}
                  </div>
                  <button onClick={() => setTaxEnabled(!taxEnabled)} className={`w-9 h-5 rounded-full transition-colors ${taxEnabled ? "bg-emerald-500" : "bg-neutral-300"}`}>
                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${taxEnabled ? "translate-x-4" : "translate-x-0.5"}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-[11px] text-neutral-600">Round Off</span>
                  <button onClick={() => setRoundOff(!roundOff)} className={`w-9 h-5 rounded-full transition-colors ${roundOff ? "bg-emerald-500" : "bg-neutral-300"}`}>
                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${roundOff ? "translate-x-4" : "translate-x-0.5"}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className="bg-white rounded-xl border border-neutral-200 p-3 shadow-sm">
              <h3 className="text-[12px] font-bold text-neutral-800 mb-3 pb-2 border-b border-neutral-100">Payment</h3>
              <div className="space-y-2">
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full px-2 py-1.5 rounded-md bg-neutral-50 border border-neutral-200 text-[11px] font-medium focus:outline-none cursor-pointer">
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                </select>
                <div>
                  <label className="text-[11px] text-neutral-600 mb-1 block">Received Amount</label>
                  <input type="number" min="0" value={paidAmount} onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)} className="w-full px-2 py-1.5 rounded-md bg-neutral-50 border border-neutral-200 text-[12px] font-medium focus:outline-none focus:border-emerald-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Invoice Summary */}
          <div className="bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-xl p-4 text-white shadow-lg">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <p className="text-[10px] text-neutral-400 uppercase tracking-wide mb-1">Subtotal</p>
                <p className="text-[14px] font-semibold">{formatCurrency(subtotal)}</p>
              </div>
              <div>
                <p className="text-[10px] text-neutral-400 uppercase tracking-wide mb-1">Total</p>
                <p className="text-[18px] font-bold text-emerald-400">{formatCurrency(grandTotal)}</p>
              </div>
              <div>
                <p className="text-[10px] text-neutral-400 uppercase tracking-wide mb-1">Paid</p>
                <p className="text-[14px] font-semibold text-emerald-400">{formatCurrency(paidAmount)}</p>
              </div>
              <div>
                <p className="text-[10px] text-neutral-400 uppercase tracking-wide mb-1">Balance</p>
                <p className={`text-[14px] font-bold ${balance > 0 ? "text-red-400" : "text-emerald-400"}`}>{formatCurrency(balance)}</p>
              </div>
            </div>
            {(discountAmount > 0 || totalExtraCharges > 0 || taxEnabled) && (
              <div className="mt-3 pt-3 border-t border-white/10 flex gap-4 text-[11px]">
                {discountAmount > 0 && <span className="text-amber-400">Discount: -{formatCurrency(discountAmount)}</span>}
                {totalExtraCharges > 0 && <span className="text-neutral-300">Charges: +{formatCurrency(totalExtraCharges)}</span>}
                {taxEnabled && <span className="text-neutral-300">Tax ({taxRate}%): +{formatCurrency(taxAmount)}</span>}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => handleSaveInvoice(true)}
              disabled={saving || items.length === 0}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 text-white text-[13px] font-semibold hover:bg-emerald-600 transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20"
            >
              <Printer className="w-5 h-5" />
              Save & Print
            </button>
            <button
              onClick={() => handleSaveInvoice(false)}
              disabled={saving || items.length === 0}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-neutral-800 text-white text-[13px] font-semibold hover:bg-neutral-700 transition-all disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              Save Only
            </button>
            <button
              onClick={resetForm}
              className="px-4 py-3 rounded-xl bg-neutral-200 text-neutral-700 hover:bg-neutral-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
