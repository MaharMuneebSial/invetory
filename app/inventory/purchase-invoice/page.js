"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  Search,
  Save,
  X,
  Package,
  Minus,
  Printer,
} from "lucide-react";
import { getProducts, getSuppliers, createPurchaseInvoice } from "@/lib/db";

const PAYMENT_TERMS = ["Immediate", "Net 15", "Net 30", "Net 60"];

export default function PurchaseInvoicePage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Invoice details
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("Immediate");

  // Supplier
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [supplierSearch, setSupplierSearch] = useState("");
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const supplierRef = useRef(null);

  // Product search
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef(null);

  // Items
  const [items, setItems] = useState([]);

  // Summary
  const [shipping, setShipping] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState("amount");
  const [taxEnabled, setTaxEnabled] = useState(true);
  const [taxRate, setTaxRate] = useState(5);
  const [paidAmount, setPaidAmount] = useState(0);
  const [notes, setNotes] = useState("");

  // Generate invoice number
  useEffect(() => {
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0].replace(/-/g, "");
    const timeStr = now.toTimeString().slice(0, 5).replace(":", "");
    setInvoiceNumber(`PO-${dateStr}-${timeStr}`);
    setInvoiceDate(now.toISOString().split("T")[0]);
  }, []);

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      try {
        const [productsData, suppliersData] = await Promise.all([
          getProducts(),
          getSuppliers(),
        ]);
        setProducts(productsData || []);
        setSuppliers(suppliersData || []);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Search products
  useEffect(() => {
    if (searchTerm.length > 0) {
      const results = products.filter(
        (p) =>
          p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.brand?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setSearchResults(results.slice(0, 8));
      setShowSearchDropdown(true);
    } else {
      setSearchResults([]);
      setShowSearchDropdown(false);
    }
  }, [searchTerm, products]);

  // Filter suppliers
  const filteredSuppliers = suppliers.filter((s) =>
    s.name?.toLowerCase().includes(supplierSearch.toLowerCase())
  );

  // Click outside handlers
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchDropdown(false);
      }
      if (supplierRef.current && !supplierRef.current.contains(event.target)) {
        setShowSupplierDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Add product to invoice
  const addProductToInvoice = (product) => {
    const existingItem = items.find((item) => item.product_id === product.id);
    if (existingItem) {
      setItems(
        items.map((item) =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.cost }
            : item
        )
      );
    } else {
      setItems([
        ...items,
        {
          id: Date.now(),
          product_id: product.id,
          product: product,
          quantity: 1,
          cost: product.cost_price || 0,
          total: product.cost_price || 0,
        },
      ]);
    }
    setSearchTerm("");
    setShowSearchDropdown(false);
  };

  // Update item quantity
  const updateItemQuantity = (id, value) => {
    const qty = parseInt(value) || 1;
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, quantity: qty, total: qty * item.cost } : item
      )
    );
  };

  // Update item cost
  const updateItemCost = (id, value) => {
    const cost = parseFloat(value) || 0;
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, cost: cost, total: item.quantity * cost } : item
      )
    );
  };

  // Remove item
  const removeItem = (id) => {
    setItems(items.filter((item) => item.id !== id));
  };

  // Calculations
  const subtotal = items.reduce((acc, item) => acc + item.total, 0);
  const discountAmount = discountType === "percent" ? (subtotal * discount) / 100 : discount;
  const taxAmount = taxEnabled ? ((subtotal - discountAmount) * taxRate) / 100 : 0;
  const grandTotal = subtotal - discountAmount + taxAmount + shipping;
  const balance = grandTotal - paidAmount;

  const formatCurrency = (amount) => `Rs. ${Number(amount || 0).toLocaleString()}`;

  // Save invoice
  const handleSaveInvoice = async (print = false) => {
    if (!selectedSupplier) {
      alert("Please select a supplier");
      return;
    }
    if (items.length === 0) {
      alert("Please add at least one item");
      return;
    }

    setSaving(true);
    try {
      const invoiceData = {
        invoice_number: invoiceNumber,
        supplier_id: selectedSupplier.id,
        supplier_name: selectedSupplier.name,
        subtotal,
        discount: discountAmount,
        tax: taxAmount,
        shipping,
        total: grandTotal,
        paid: paidAmount,
        payment_terms: paymentTerms,
        notes,
        status: paidAmount >= grandTotal ? "paid" : paidAmount > 0 ? "partial" : "pending",
      };

      const invoiceItems = items.map((item) => ({
        product_id: item.product_id,
        product_name: item.product?.name,
        quantity: item.quantity,
        unit_cost: item.cost,
        total: item.total,
      }));

      await createPurchaseInvoice(invoiceData, invoiceItems);

      if (print) {
        // Print logic here
      }

      router.push("/inventory/purchase-invoices-list");
    } catch (error) {
      console.error("Failed to save invoice:", error);
      alert("Failed to save invoice");
    } finally {
      setSaving(false);
    }
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
      {/* Header Row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold text-neutral-900">Purchase Invoice</h1>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="text-neutral-500">PO#: <span className="font-semibold text-neutral-800">{invoiceNumber}</span></span>
            <span className="text-neutral-500">Date: <span className="font-medium text-neutral-700">{invoiceDate}</span></span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => router.back()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-100 text-neutral-700 text-[11px] font-medium hover:bg-neutral-200 transition-colors">
            <X className="w-3.5 h-3.5" />
            Cancel
          </button>
          <button onClick={() => handleSaveInvoice(true)} disabled={saving || items.length === 0} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-[11px] font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50">
            <Printer className="w-3.5 h-3.5" />
            Save & Print
          </button>
          <button onClick={() => handleSaveInvoice(false)} disabled={saving || items.length === 0} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 text-white text-[11px] font-medium hover:bg-neutral-700 transition-colors disabled:opacity-50">
            <Save className="w-3.5 h-3.5" />
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-3 min-h-0">
        {/* Left Panel - Supplier & Items */}
        <div className="flex-1 flex flex-col min-h-0 gap-2">
          {/* Supplier Row */}
          <div className="bg-white rounded-lg border border-neutral-200 p-2.5 shadow-sm">
            <div className="grid grid-cols-4 gap-3">
              {/* Supplier Search */}
              <div ref={supplierRef} className="relative">
                <label className="block text-[10px] font-medium text-neutral-500 mb-1">Supplier</label>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Search supplier..."
                    value={selectedSupplier ? selectedSupplier.name : supplierSearch}
                    onChange={(e) => {
                      setSupplierSearch(e.target.value);
                      setSelectedSupplier(null);
                      setShowSupplierDropdown(true);
                    }}
                    onFocus={() => setShowSupplierDropdown(true)}
                    className="w-full pl-7 pr-2 py-1.5 rounded-md bg-neutral-50 border border-neutral-200 text-[11px] focus:outline-none focus:border-emerald-400"
                  />
                </div>
                {showSupplierDropdown && filteredSuppliers.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-xl max-h-40 overflow-y-auto">
                    {filteredSuppliers.map((supplier) => (
                      <div
                        key={supplier.id}
                        onClick={() => {
                          setSelectedSupplier(supplier);
                          setSupplierSearch("");
                          setShowSupplierDropdown(false);
                        }}
                        className="px-3 py-2 hover:bg-emerald-50 cursor-pointer text-[11px] border-b border-neutral-100 last:border-0"
                      >
                        <p className="font-medium text-neutral-900">{supplier.name}</p>
                        {supplier.phone && <p className="text-neutral-500 text-[10px]">{supplier.phone}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Payment Terms */}
              <div>
                <label className="block text-[10px] font-medium text-neutral-500 mb-1">Payment Terms</label>
                <select
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-md bg-neutral-50 border border-neutral-200 text-[11px] focus:outline-none focus:border-emerald-400 cursor-pointer"
                >
                  {PAYMENT_TERMS.map((term) => (
                    <option key={term} value={term}>{term}</option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-[10px] font-medium text-neutral-500 mb-1">Date</label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-md bg-neutral-50 border border-neutral-200 text-[11px] focus:outline-none focus:border-emerald-400"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[10px] font-medium text-neutral-500 mb-1">Notes</label>
                <input
                  type="text"
                  placeholder="Add notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-md bg-neutral-50 border border-neutral-200 text-[11px] focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div ref={searchRef} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search product by name, SKU, or brand..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-white border border-neutral-200 text-[12px] focus:outline-none focus:border-emerald-400 shadow-sm"
            />
            {showSearchDropdown && searchResults.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                {searchResults.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => addProductToInvoice(product)}
                    className="px-3 py-2 hover:bg-emerald-50 cursor-pointer border-b border-neutral-100 last:border-0 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-[11px] font-medium text-neutral-900">{product.name}</p>
                      <p className="text-[10px] text-neutral-500">SKU: {product.sku || "N/A"}</p>
                    </div>
                    <p className="text-[11px] font-bold text-emerald-600">{formatCurrency(product.cost_price)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Items Table */}
          <div className="flex-1 bg-white rounded-lg border border-neutral-200 shadow-sm overflow-hidden flex flex-col min-h-0">
            <div className="px-3 py-2 border-b border-neutral-100 bg-neutral-50 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-neutral-700 flex items-center gap-2">
                <Package className="w-3.5 h-3.5" />
                Purchase Items
                {items.length > 0 && <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-semibold rounded-full">{items.length}</span>}
              </span>
              <button
                onClick={() => setItems([...items, { id: Date.now(), product_id: null, product: null, quantity: 1, cost: 0, total: 0 }])}
                className="flex items-center gap-1 px-2 py-1 rounded text-emerald-600 text-[10px] font-medium hover:bg-emerald-50"
              >
                <Plus className="w-3 h-3" />
                Add Row
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-neutral-400 py-6">
                  <Package className="w-10 h-10 mb-2 opacity-50" />
                  <p className="text-[12px] font-medium">No items added</p>
                  <p className="text-[10px]">Search products above to add</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="sticky top-0 bg-neutral-50 border-b border-neutral-100">
                    <tr>
                      <th className="px-3 py-1.5 text-left text-[10px] font-semibold text-neutral-500 uppercase w-8">#</th>
                      <th className="px-3 py-1.5 text-left text-[10px] font-semibold text-neutral-500 uppercase">Product</th>
                      <th className="px-3 py-1.5 text-center text-[10px] font-semibold text-neutral-500 uppercase w-24">Qty</th>
                      <th className="px-3 py-1.5 text-right text-[10px] font-semibold text-neutral-500 uppercase w-24">Cost</th>
                      <th className="px-3 py-1.5 text-right text-[10px] font-semibold text-neutral-500 uppercase w-24">Total</th>
                      <th className="w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {items.map((item, index) => (
                      <tr key={item.id} className="hover:bg-neutral-50/50">
                        <td className="px-3 py-1.5 text-[11px] text-neutral-500">{index + 1}</td>
                        <td className="px-3 py-1.5">
                          <p className="text-[11px] font-medium text-neutral-900">{item.product?.name || "—"}</p>
                        </td>
                        <td className="px-3 py-1.5">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => updateItemQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1} className="w-5 h-5 rounded bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center disabled:opacity-40">
                              <Minus className="w-2.5 h-2.5" />
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateItemQuantity(item.id, e.target.value)}
                              className="w-10 px-1 py-0.5 rounded bg-neutral-50 border border-neutral-200 text-[10px] text-center font-medium focus:outline-none focus:border-emerald-400"
                            />
                            <button onClick={() => updateItemQuantity(item.id, item.quantity + 1)} className="w-5 h-5 rounded bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center">
                              <Plus className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </td>
                        <td className="px-3 py-1.5">
                          <input
                            type="number"
                            min="0"
                            value={item.cost}
                            onChange={(e) => updateItemCost(item.id, e.target.value)}
                            className="w-full px-2 py-0.5 rounded bg-neutral-50 border border-neutral-200 text-[10px] text-right font-medium focus:outline-none focus:border-emerald-400"
                          />
                        </td>
                        <td className="px-3 py-1.5 text-[11px] font-bold text-neutral-900 text-right">{formatCurrency(item.total)}</td>
                        <td className="px-2 py-1.5">
                          <button onClick={() => removeItem(item.id)} className="p-1 rounded text-red-500 hover:bg-red-50">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Summary */}
        <div className="w-[320px] flex flex-col gap-2">
          {/* Charges Card */}
          <div className="bg-white rounded-lg border border-neutral-200 p-3 shadow-sm">
            <h3 className="text-[11px] font-bold text-neutral-800 mb-2 pb-1.5 border-b border-neutral-100">Charges & Discount</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] text-neutral-600">Shipping</label>
                <input
                  type="number"
                  min="0"
                  value={shipping}
                  onChange={(e) => setShipping(parseFloat(e.target.value) || 0)}
                  className="w-20 px-2 py-1 rounded bg-neutral-50 border border-neutral-200 text-[10px] text-right font-medium focus:outline-none focus:border-emerald-400"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-[10px] text-neutral-600">Discount</label>
                <div className="flex gap-1">
                  <input
                    type="number"
                    min="0"
                    value={discount}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    className="w-14 px-2 py-1 rounded bg-neutral-50 border border-neutral-200 text-[10px] text-right font-medium focus:outline-none focus:border-emerald-400"
                  />
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                    className="px-1 py-1 rounded bg-neutral-50 border border-neutral-200 text-[10px] font-medium focus:outline-none cursor-pointer"
                  >
                    <option value="amount">Rs</option>
                    <option value="percent">%</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-between py-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-neutral-600">Tax</span>
                  {taxEnabled && (
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={taxRate}
                      onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                      className="w-8 px-1 py-0.5 rounded bg-neutral-50 border border-neutral-200 text-[9px] text-center font-medium focus:outline-none"
                    />
                  )}
                </div>
                <button onClick={() => setTaxEnabled(!taxEnabled)} className={`w-8 h-4 rounded-full transition-colors ${taxEnabled ? "bg-emerald-500" : "bg-neutral-300"}`}>
                  <div className={`w-3 h-3 rounded-full bg-white shadow-sm transform transition-transform ${taxEnabled ? "translate-x-4" : "translate-x-0.5"}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Payment Card */}
          <div className="bg-white rounded-lg border border-neutral-200 p-3 shadow-sm">
            <h3 className="text-[11px] font-bold text-neutral-800 mb-2 pb-1.5 border-b border-neutral-100">Payment</h3>
            <div>
              <label className="text-[10px] text-neutral-600 mb-1 block">Paid Amount</label>
              <input
                type="number"
                min="0"
                value={paidAmount}
                onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-1.5 rounded bg-neutral-50 border border-neutral-200 text-[11px] font-medium focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>

          {/* Summary Card */}
          <div className="bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-lg p-3 text-white shadow-lg flex-1">
            <h3 className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wide mb-2">Purchase Summary</h3>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-neutral-400">Subtotal</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-neutral-400">Discount</span>
                  <span className="text-amber-400">-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              {taxEnabled && (
                <div className="flex justify-between">
                  <span className="text-neutral-400">Tax ({taxRate}%)</span>
                  <span className="font-medium">{formatCurrency(taxAmount)}</span>
                </div>
              )}
              {shipping > 0 && (
                <div className="flex justify-between">
                  <span className="text-neutral-400">Shipping</span>
                  <span className="font-medium">{formatCurrency(shipping)}</span>
                </div>
              )}
              <div className="h-px bg-white/10 my-2"></div>
              <div className="flex justify-between text-[14px] font-bold">
                <span>Grand Total</span>
                <span className="text-emerald-400">{formatCurrency(grandTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Paid</span>
                <span className="text-emerald-400 font-medium">{formatCurrency(paidAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Balance</span>
                <span className={`font-bold ${balance > 0 ? "text-red-400" : "text-emerald-400"}`}>{formatCurrency(balance)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => handleSaveInvoice(true)}
              disabled={saving || items.length === 0 || !selectedSupplier}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-emerald-500 text-white text-[11px] font-semibold hover:bg-emerald-600 transition-all disabled:opacity-50 shadow-md"
            >
              <Printer className="w-4 h-4" />
              Save & Print
            </button>
            <button
              onClick={() => handleSaveInvoice(false)}
              disabled={saving || items.length === 0 || !selectedSupplier}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-neutral-800 text-white text-[11px] font-semibold hover:bg-neutral-700 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              Save Only
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
