"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Save,
  X,
  CreditCard,
  Banknote,
  Building,
  Wallet,
  Receipt,
} from "lucide-react";
import {
  getCustomers,
  getSuppliers,
  getSaleInvoices,
  getPurchaseInvoices,
  getRecentPayments,
  createPayment,
} from "@/lib/db";
import { useToast, ToastContainer } from "@/components/Toast";

export default function PaymentPage() {
  const router = useRouter();
  const { toasts, showToast, removeToast } = useToast();
  const [paymentType, setPaymentType] = useState("received");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [saleInvoices, setSaleInvoices] = useState([]);
  const [purchaseInvoices, setPurchaseInvoices] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    customer_id: "",
    supplier_id: "",
    reference_id: "",
    amount: "",
    payment_date: new Date().toISOString().split("T")[0],
    bank_name: "",
    transaction_id: "",
    notes: "",
  });

  const [selectedEntity, setSelectedEntity] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [entitySearch, setEntitySearch] = useState("");
  const [invoiceSearch, setInvoiceSearch] = useState("");

  const paymentMethods = [
    { id: "Cash", name: "Cash", icon: Banknote, color: "emerald" },
    { id: "Card", name: "Card", icon: CreditCard, color: "indigo" },
    { id: "Bank", name: "Bank", icon: Building, color: "blue" },
    { id: "Wallet", name: "E-Wallet", icon: Wallet, color: "purple" },
  ];

  useEffect(() => {
    async function fetchData() {
      try {
        const [customersData, suppliersData, saleInvoicesData, purchaseInvoicesData, recentData] = await Promise.all([
          getCustomers(),
          getSuppliers(),
          getSaleInvoices(),
          getPurchaseInvoices(),
          getRecentPayments(5),
        ]);
        setCustomers(customersData || []);
        setSuppliers(suppliersData || []);
        setSaleInvoices(saleInvoicesData || []);
        setPurchaseInvoices(purchaseInvoicesData || []);
        setRecentPayments(recentData || []);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const entities = paymentType === "received" ? customers : suppliers;
  const filteredEntities = entities.filter((e) =>
    e.name?.toLowerCase().includes(entitySearch.toLowerCase())
  );

  const invoices = paymentType === "received" ? saleInvoices : purchaseInvoices;
  const filteredInvoices = invoices.filter((inv) =>
    inv.invoice_number?.toLowerCase().includes(invoiceSearch.toLowerCase()) &&
    (paymentType === "received"
      ? inv.customer_id === selectedEntity?.id
      : inv.supplier_id === selectedEntity?.id) &&
    inv.status !== "paid"
  );

  const handleEntitySelect = (entity) => {
    setSelectedEntity(entity);
    setEntitySearch(entity.name);
    if (paymentType === "received") {
      setFormData({ ...formData, customer_id: entity.id, supplier_id: "" });
    } else {
      setFormData({ ...formData, supplier_id: entity.id, customer_id: "" });
    }
  };

  const handleInvoiceSelect = (invoice) => {
    setSelectedInvoice(invoice);
    setInvoiceSearch(invoice.invoice_number);
    setFormData({
      ...formData,
      reference_id: invoice.id,
      amount: invoice.balance || invoice.total
    });
  };

  const handlePaymentTypeChange = (type) => {
    setPaymentType(type);
    setSelectedEntity(null);
    setSelectedInvoice(null);
    setEntitySearch("");
    setInvoiceSearch("");
    setFormData({
      ...formData,
      customer_id: "",
      supplier_id: "",
      reference_id: "",
      amount: "",
    });
  };

  const handleSavePayment = async () => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      showToast("Please enter a valid amount", "error");
      return;
    }

    setSaving(true);
    try {
      const paymentData = {
        type: paymentType,
        reference_type: paymentType === "received" ? "sale_invoice" : "purchase_invoice",
        reference_id: formData.reference_id || null,
        customer_id: formData.customer_id || null,
        supplier_id: formData.supplier_id || null,
        amount: parseFloat(formData.amount),
        payment_method: paymentMethod,
        notes: formData.notes || "",
      };

      await createPayment(paymentData);
      showToast("Payment recorded successfully!", "success");

      setFormData({
        customer_id: "",
        supplier_id: "",
        reference_id: "",
        amount: "",
        payment_date: new Date().toISOString().split("T")[0],
        bank_name: "",
        transaction_id: "",
        notes: "",
      });
      setSelectedEntity(null);
      setSelectedInvoice(null);
      setEntitySearch("");
      setInvoiceSearch("");

      const recentData = await getRecentPayments(5);
      setRecentPayments(recentData || []);
    } catch (error) {
      console.error("Failed to save payment:", error);
      showToast("Failed to save payment", "error");
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount) => `Rs. ${Number(amount || 0).toLocaleString()}`;

  const formatTimeAgo = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-PK");
  };

  return (
    <div className="h-[calc(100vh-130px)] flex flex-col overflow-hidden">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Header */}
      <div className="flex items-center justify-between mb-2 flex-shrink-0">
        <div>
          <h1 className="text-lg font-bold text-neutral-900">Record Payment</h1>
          <p className="text-[10px] text-neutral-500">Record customer or supplier payments</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => router.back()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-100 text-neutral-700 text-[11px] font-medium hover:bg-neutral-200 transition-colors">
            <X className="w-3.5 h-3.5" /> Cancel
          </button>
          <button onClick={handleSavePayment} disabled={saving} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-neutral-900 text-white text-[11px] font-medium hover:bg-neutral-800 disabled:opacity-50 transition-colors">
            <Save className="w-3.5 h-3.5" /> {saving ? "Saving..." : "Save Payment"}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-3 min-h-0 overflow-hidden">
        {/* Left Panel */}
        <div className="flex-1 flex flex-col gap-2 min-h-0">
          {/* Payment Type */}
          <div className="bg-white rounded-lg border border-neutral-200 px-4 py-3 shadow-sm">
            <div className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wide mb-2">Payment Type</div>
            <div className="flex gap-3">
              <label className="flex-1 cursor-pointer">
                <input type="radio" name="paymentType" value="received" checked={paymentType === "received"} onChange={() => handlePaymentTypeChange("received")} className="peer sr-only" />
                <div className="p-3 rounded-lg border-2 border-neutral-200 peer-checked:border-emerald-500 peer-checked:bg-emerald-50 transition-all">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-md bg-emerald-100 flex items-center justify-center">
                      <Receipt className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-neutral-900">Payment Received</p>
                      <p className="text-[9px] text-neutral-500">From customer</p>
                    </div>
                  </div>
                </div>
              </label>
              <label className="flex-1 cursor-pointer">
                <input type="radio" name="paymentType" value="made" checked={paymentType === "made"} onChange={() => handlePaymentTypeChange("made")} className="peer sr-only" />
                <div className="p-3 rounded-lg border-2 border-neutral-200 peer-checked:border-red-500 peer-checked:bg-red-50 transition-all">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-md bg-red-100 flex items-center justify-center">
                      <CreditCard className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-neutral-900">Payment Made</p>
                      <p className="text-[9px] text-neutral-500">To supplier</p>
                    </div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Payment Details */}
          <div className="bg-white rounded-lg border border-neutral-200 px-4 py-3 shadow-sm flex-1">
            <div className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wide mb-2">Payment Details</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <label className="block text-[9px] font-medium text-neutral-500 mb-1">{paymentType === "received" ? "Customer" : "Supplier"}</label>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                  <input type="text" placeholder="Search..." value={entitySearch} onChange={(e) => { setEntitySearch(e.target.value); setSelectedEntity(null); }} className="w-full pl-8 pr-3 py-2 rounded-md bg-neutral-50 border border-neutral-200 text-[11px] focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all" />
                </div>
                {entitySearch && !selectedEntity && filteredEntities.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-32 overflow-y-auto">
                    {filteredEntities.map((entity) => (
                      <button key={entity.id} onClick={() => handleEntitySelect(entity)} className="w-full px-3 py-1.5 text-left hover:bg-neutral-50 text-[10px]">{entity.name}</button>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative">
                <label className="block text-[9px] font-medium text-neutral-500 mb-1">Invoice Reference</label>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                  <input type="text" placeholder="Search invoice..." value={invoiceSearch} onChange={(e) => { setInvoiceSearch(e.target.value); setSelectedInvoice(null); }} disabled={!selectedEntity} className="w-full pl-8 pr-3 py-2 rounded-md bg-neutral-50 border border-neutral-200 text-[11px] focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all disabled:opacity-50" />
                </div>
                {invoiceSearch && !selectedInvoice && selectedEntity && filteredInvoices.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-32 overflow-y-auto">
                    {filteredInvoices.map((inv) => (
                      <button key={inv.id} onClick={() => handleInvoiceSelect(inv)} className="w-full px-3 py-1.5 text-left hover:bg-neutral-50 text-[10px] flex justify-between">
                        <span>{inv.invoice_number}</span>
                        <span className="text-neutral-500">{formatCurrency(inv.balance || inv.total)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-[9px] font-medium text-neutral-500 mb-1">Payment Date</label>
                <input type="date" value={formData.payment_date} onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })} className="w-full px-3 py-2 rounded-md bg-neutral-50 border border-neutral-200 text-[11px] focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all" />
              </div>
              <div>
                <label className="block text-[9px] font-medium text-neutral-500 mb-1">Amount</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-neutral-400">Rs.</span>
                  <input type="number" placeholder="0.00" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="w-full pl-8 pr-3 py-2 rounded-md bg-neutral-50 border border-neutral-200 text-[11px] focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all" />
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-lg border border-neutral-200 px-4 py-3 shadow-sm flex-1">
            <div className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wide mb-2">Payment Method</div>
            <div className="grid grid-cols-4 gap-2">
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                const isActive = paymentMethod === method.id;
                return (
                  <button key={method.id} onClick={() => setPaymentMethod(method.id)} className={`p-2.5 rounded-lg border-2 transition-all ${isActive ? method.color === "emerald" ? "border-emerald-500 bg-emerald-50" : method.color === "indigo" ? "border-indigo-500 bg-indigo-50" : method.color === "blue" ? "border-blue-500 bg-blue-50" : "border-purple-500 bg-purple-50" : "border-neutral-200 hover:border-neutral-300"}`}>
                    <div className={`w-8 h-8 rounded-md mx-auto mb-1.5 flex items-center justify-center ${isActive ? method.color === "emerald" ? "bg-emerald-100" : method.color === "indigo" ? "bg-indigo-100" : method.color === "blue" ? "bg-blue-100" : "bg-purple-100" : "bg-neutral-100"}`}>
                      <Icon className={`w-4 h-4 ${isActive ? method.color === "emerald" ? "text-emerald-600" : method.color === "indigo" ? "text-indigo-600" : method.color === "blue" ? "text-blue-600" : "text-purple-600" : "text-neutral-500"}`} />
                    </div>
                    <p className={`text-[10px] font-medium text-center ${isActive ? "text-neutral-900" : "text-neutral-600"}`}>{method.name}</p>
                  </button>
                );
              })}
            </div>
            {paymentMethod === "Bank" && (
              <div className="mt-2 p-2.5 rounded-lg bg-blue-50 border border-blue-100">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] font-medium text-neutral-500 mb-1">Bank Name</label>
                    <input type="text" placeholder="Enter bank name" value={formData.bank_name} onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })} className="w-full px-2.5 py-1.5 rounded-md bg-white border border-neutral-200 text-[10px]" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-medium text-neutral-500 mb-1">Transaction ID</label>
                    <input type="text" placeholder="Enter transaction ID" value={formData.transaction_id} onChange={(e) => setFormData({ ...formData, transaction_id: e.target.value })} className="w-full px-2.5 py-1.5 rounded-md bg-white border border-neutral-200 text-[10px]" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-[220px] flex flex-col gap-2 flex-shrink-0 overflow-hidden">
          {/* Payment Summary */}
          <div className="bg-white rounded-lg border border-neutral-200 p-3 shadow-sm flex-shrink-0">
            <div className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wide mb-2">Payment Summary</div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-neutral-500">Invoice Amount</span>
                <span className="font-medium text-neutral-900">{selectedInvoice ? formatCurrency(selectedInvoice.total) : "Rs. 0.00"}</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-neutral-500">Previous Payments</span>
                <span className="font-medium text-neutral-900">{selectedInvoice ? formatCurrency(selectedInvoice.paid || 0) : "Rs. 0.00"}</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-neutral-500">Balance Due</span>
                <span className="font-medium text-red-600">{selectedInvoice ? formatCurrency(selectedInvoice.balance || selectedInvoice.total) : "Rs. 0.00"}</span>
              </div>
              <div className="h-px bg-neutral-200 my-2"></div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-neutral-900">This Payment</span>
                <span className="text-lg font-bold text-emerald-600">{formatCurrency(formData.amount || 0)}</span>
              </div>
            </div>
            <button onClick={handleSavePayment} disabled={saving} className="w-full mt-3 flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-[10px] font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all shadow-md disabled:opacity-50">
              <CreditCard className="w-3.5 h-3.5" />
              {saving ? "Recording..." : "Record Payment"}
            </button>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-lg border border-neutral-200 p-3 shadow-sm flex-shrink-0">
            <div className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wide mb-2">Payment Notes</div>
            <textarea placeholder="Add notes..." rows={2} value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="w-full px-2.5 py-2 rounded-md bg-neutral-50 border border-neutral-200 text-[10px] resize-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"></textarea>
          </div>

          {/* Recent Payments */}
          <div className="bg-white rounded-lg border border-neutral-200 p-3 shadow-sm flex-1 min-h-0 overflow-hidden flex flex-col">
            <div className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wide mb-2 flex-shrink-0">Recent Payments</div>
            <div className="space-y-1.5 flex-1 overflow-auto">
              {loading ? (
                <p className="text-[10px] text-neutral-500 text-center py-2">Loading...</p>
              ) : recentPayments.length === 0 ? (
                <p className="text-[10px] text-neutral-500 text-center py-2">No recent payments</p>
              ) : (
                recentPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-2 rounded-md bg-neutral-50">
                    <div>
                      <p className="text-[10px] font-medium text-neutral-900 truncate max-w-[100px]">{payment.customer_name || payment.supplier_name || "Unknown"}</p>
                      <p className="text-[8px] text-neutral-500">{formatTimeAgo(payment.created_at)}</p>
                    </div>
                    <span className={`text-[10px] font-semibold ${payment.type === "received" ? "text-emerald-600" : "text-red-600"}`}>
                      {payment.type === "received" ? "+" : "-"}{formatCurrency(payment.amount)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
