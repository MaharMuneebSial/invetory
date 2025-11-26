"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, X, Image as ImageIcon, Upload, RefreshCw, Truck } from "lucide-react";
import { createProduct, getSuppliers } from "@/lib/db";
import { useToast, ToastContainer } from "@/components/Toast";

// Categories with sub-categories
const CATEGORIES = {
  "Kiryana": ["General", "Spices", "Pulses", "Rice", "Flour", "Oil & Ghee", "Sugar", "Salt"],
  "Snacks": ["Chips", "Biscuits", "Namkeen", "Chocolates", "Candies", "Nuts & Dry Fruits"],
  "Beverages": ["Soft Drinks", "Juices", "Energy Drinks", "Water", "Milk & Dairy Drinks", "Tea & Coffee"],
  "Bakery": ["Bread", "Cakes", "Pastries", "Rusks", "Fresh Baked"],
  "Dairy": ["Milk", "Yogurt", "Cheese", "Butter", "Cream"],
  "Frozen": ["Ice Cream", "Frozen Foods", "Frozen Meat", "Frozen Vegetables"],
  "Personal Care": ["Shampoo", "Soap", "Toothpaste", "Skincare", "Hair Care"],
  "Cleaning": ["Detergent", "Dishwash", "Floor Cleaner", "Toilet Cleaner", "Air Freshener"],
  "Cosmetics": ["Makeup", "Perfumes", "Nail Care", "Face Care"],
  "Other": ["Miscellaneous"],
};

// Common brands
const BRANDS = ["Pepsi", "Coca Cola", "Nestle", "Unilever", "Dalda", "Shan", "National", "Knorr", "Lu", "Kashmir", "Tapal", "Lipton", "Olpers", "Nurpur", "Surf Excel", "Ariel", "Dettol", "Safeguard", "Other"];

// Unit types
const UNIT_TYPES = [
  { value: "Piece", label: "Piece", canConvert: false },
  { value: "Carton", label: "Carton", canConvert: true, convertTo: "Piece" },
  { value: "Dozen", label: "Dozen", canConvert: true, convertTo: "Piece", defaultRate: 12 },
  { value: "Packet", label: "Packet", canConvert: true, convertTo: "Piece" },
  { value: "Box", label: "Box", canConvert: true, convertTo: "Piece" },
  { value: "Kg", label: "Kg", canConvert: true, convertTo: "Gram", defaultRate: 1000 },
  { value: "Gram", label: "Gram", canConvert: false },
  { value: "Litre", label: "Litre", canConvert: true, convertTo: "ML", defaultRate: 1000 },
  { value: "ML", label: "ML", canConvert: false },
];

export default function NewProductPage() {
  const router = useRouter();
  const { toasts, showToast, removeToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [showConversion, setShowConversion] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "", brand: "", category: "", sub_category: "", sku: "",
    unit: "Piece", conversion_rate: "", conversion_unit: "",
    stock: "", reorder_level: "10",
    cost_price: "", sale_price: "", wholesale_price: "",
    expiry_date: "", manufacture_date: "", shelf_life: "",
    supplier_id: "", weight_per_item: "",
    status: "active", description: "", image_path: "",
  });

  // Load suppliers
  useEffect(() => {
    async function fetchSuppliers() {
      try {
        const data = await getSuppliers();
        setSuppliers(data || []);
      } catch (error) {
        console.error("Failed to fetch suppliers:", error);
      }
    }
    fetchSuppliers();
  }, []);

  // Update sub-categories
  useEffect(() => {
    if (formData.category && CATEGORIES[formData.category]) {
      setSubCategories(CATEGORIES[formData.category]);
    } else {
      setSubCategories([]);
    }
    setFormData(prev => ({ ...prev, sub_category: "" }));
  }, [formData.category]);

  // Handle unit change
  useEffect(() => {
    const unitInfo = UNIT_TYPES.find(u => u.value === formData.unit);
    if (unitInfo?.canConvert) {
      setShowConversion(true);
      setFormData(prev => ({ ...prev, conversion_unit: unitInfo.convertTo || "", conversion_rate: unitInfo.defaultRate?.toString() || "" }));
    } else {
      setShowConversion(false);
      setFormData(prev => ({ ...prev, conversion_unit: "", conversion_rate: "" }));
    }
  }, [formData.unit]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const generateSKU = () => {
    const prefix = formData.category ? formData.category.substring(0, 3).toUpperCase() : "PRD";
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
    return `${prefix}-${random}`;
  };

  const handleAutoGenerateSKU = () => {
    setFormData(prev => ({ ...prev, sku: generateSKU() }));
  };

  const calculateProfitMargin = () => {
    const cost = parseFloat(formData.cost_price) || 0;
    const sale = parseFloat(formData.sale_price) || 0;
    if (cost === 0) return { margin: 0, profit: 0 };
    const profit = sale - cost;
    const margin = (profit / cost) * 100;
    return { margin: margin.toFixed(1), profit: profit.toFixed(0) };
  };

  const handleSaveProduct = async () => {
    if (!formData.name.trim()) { showToast("Product Name is required", "error"); return; }
    if (!formData.category) { showToast("Category is required", "error"); return; }
    if (!formData.cost_price) { showToast("Purchase Price is required", "error"); return; }
    if (!formData.sale_price) { showToast("Sale Price is required", "error"); return; }

    setSaving(true);
    try {
      const product = {
        name: formData.name.trim(),
        sku: formData.sku || generateSKU(),
        category: formData.category,
        sub_category: formData.sub_category || null,
        brand: formData.brand || null,
        unit: formData.unit,
        conversion_rate: parseInt(formData.conversion_rate) || 1,
        conversion_unit: formData.conversion_unit || null,
        cost_price: parseFloat(formData.cost_price) || 0,
        sale_price: parseFloat(formData.sale_price) || 0,
        wholesale_price: parseFloat(formData.wholesale_price) || 0,
        stock: parseInt(formData.stock) || 0,
        reorder_level: parseInt(formData.reorder_level) || 10,
        expiry_date: formData.expiry_date || null,
        manufacture_date: formData.manufacture_date || null,
        shelf_life: parseInt(formData.shelf_life) || null,
        weight_per_item: parseFloat(formData.weight_per_item) || null,
        supplier_id: formData.supplier_id ? parseInt(formData.supplier_id) : null,
        status: formData.status,
        description: formData.description || null,
        image_path: formData.image_path || null,
      };

      const result = await createProduct(product);
      showToast(`Product "${result.name}" created successfully!`, "success");

      // Reset form
      setFormData({
        name: "", brand: "", category: "", sub_category: "", sku: "",
        unit: "Piece", conversion_rate: "", conversion_unit: "",
        stock: "", reorder_level: "10",
        cost_price: "", sale_price: "", wholesale_price: "",
        expiry_date: "", manufacture_date: "", shelf_life: "",
        supplier_id: "", weight_per_item: "",
        status: "active", description: "", image_path: "",
      });
    } catch (error) {
      console.error("Failed to save product:", error);
      showToast("Failed to save product", "error");
    } finally {
      setSaving(false);
    }
  };

  const { margin } = calculateProfitMargin();

  return (
    <div className="h-[calc(100vh-130px)] flex flex-col overflow-hidden">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Header Row */}
      <div className="flex items-center justify-between mb-2 flex-shrink-0">
        <div>
          <h1 className="text-lg font-bold text-neutral-900">Add New Product</h1>
          <p className="text-[10px] text-neutral-500">Fields marked with * are mandatory</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => router.back()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-100 text-neutral-700 text-[11px] font-medium hover:bg-neutral-200 transition-colors">
            <X className="w-3.5 h-3.5" /> Cancel
          </button>
          <button onClick={handleSaveProduct} disabled={saving} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-neutral-900 text-white text-[11px] font-medium hover:bg-neutral-800 disabled:opacity-50 transition-colors">
            <Save className="w-3.5 h-3.5" /> {saving ? "Saving..." : "Save Product"}
          </button>
        </div>
      </div>

      {/* Main Content - Two Panels */}
      <div className="flex-1 flex gap-3 min-h-0 overflow-hidden">
        {/* Left Panel - Form Fields */}
        <div className="flex-1 flex flex-col gap-2 min-h-0">
          {/* Row 1: Basic Info */}
          <div className="bg-white rounded-lg border border-neutral-200 px-4 py-3 shadow-sm flex-1">
            <div className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wide mb-2">1. Basic Information</div>
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-3">
                <label className="block text-[9px] font-medium text-neutral-500 mb-1">Product Name *</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g., Pepsi 1.5L" className="w-full px-2.5 py-2 rounded-md bg-neutral-50 border border-neutral-200 text-[11px] focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all" />
              </div>
              <div className="col-span-2">
                <label className="block text-[9px] font-medium text-neutral-500 mb-1">Brand</label>
                <select name="brand" value={formData.brand} onChange={handleInputChange} className="w-full px-2 py-2 rounded-md bg-neutral-50 border border-neutral-200 text-[11px] focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all">
                  <option value="">Select</option>
                  {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-[9px] font-medium text-neutral-500 mb-1">Category *</label>
                <select name="category" value={formData.category} onChange={handleInputChange} className="w-full px-2 py-2 rounded-md bg-neutral-50 border border-neutral-200 text-[11px] focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all">
                  <option value="">Select</option>
                  {Object.keys(CATEGORIES).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-[9px] font-medium text-neutral-500 mb-1">Sub-Category</label>
                <select name="sub_category" value={formData.sub_category} onChange={handleInputChange} disabled={!formData.category} className="w-full px-2 py-2 rounded-md bg-neutral-50 border border-neutral-200 text-[11px] disabled:opacity-50 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all">
                  <option value="">Select</option>
                  {subCategories.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="col-span-3">
                <label className="block text-[9px] font-medium text-neutral-500 mb-1">SKU / Barcode</label>
                <div className="flex gap-1.5">
                  <input type="text" name="sku" value={formData.sku} onChange={handleInputChange} placeholder="Auto-generate" className="w-full min-w-0 px-2.5 py-2 rounded-md bg-neutral-50 border border-neutral-200 text-[11px] focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all" />
                  <button onClick={handleAutoGenerateSKU} className="px-2.5 py-2 bg-indigo-100 text-indigo-600 rounded-md hover:bg-indigo-200 flex-shrink-0 transition-colors">
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Units & Pricing */}
          <div className="bg-white rounded-lg border border-neutral-200 px-4 py-3 shadow-sm flex-1">
            <div className="grid grid-cols-2 gap-6">
              {/* Units Section */}
              <div>
                <div className="text-[10px] font-semibold text-amber-600 uppercase tracking-wide mb-2">2. Units & Stock</div>
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[9px] font-medium text-neutral-500 mb-1">Unit Type *</label>
                    <select name="unit" value={formData.unit} onChange={handleInputChange} className="w-full px-2 py-2 rounded-md bg-neutral-50 border border-neutral-200 text-[11px] focus:ring-2 focus:ring-amber-100 focus:border-amber-300 transition-all">
                      {UNIT_TYPES.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                    </select>
                  </div>
                  {showConversion && (
                    <div>
                      <label className="block text-[9px] font-medium text-neutral-500 mb-1">1 {formData.unit} =</label>
                      <div className="flex items-center gap-1.5">
                        <input type="number" name="conversion_rate" value={formData.conversion_rate} onChange={handleInputChange} className="w-14 px-2 py-2 rounded-md bg-neutral-50 border border-neutral-200 text-[11px] text-center" />
                        <span className="text-[10px] text-neutral-500 font-medium">{formData.conversion_unit}</span>
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="block text-[9px] font-medium text-neutral-500 mb-1">Opening Stock</label>
                    <input type="number" name="stock" value={formData.stock} onChange={handleInputChange} placeholder="0" className="w-full px-2.5 py-2 rounded-md bg-neutral-50 border border-neutral-200 text-[11px] focus:ring-2 focus:ring-amber-100 focus:border-amber-300 transition-all" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-medium text-neutral-500 mb-1">Min Stock Alert</label>
                    <input type="number" name="reorder_level" value={formData.reorder_level} onChange={handleInputChange} placeholder="10" className="w-full px-2.5 py-2 rounded-md bg-neutral-50 border border-neutral-200 text-[11px] focus:ring-2 focus:ring-amber-100 focus:border-amber-300 transition-all" />
                  </div>
                </div>
              </div>

              {/* Pricing Section */}
              <div>
                <div className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wide mb-2">3. Pricing</div>
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[9px] font-medium text-neutral-500 mb-1">Purchase *</label>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-neutral-400">Rs</span>
                      <input type="number" name="cost_price" value={formData.cost_price} onChange={handleInputChange} placeholder="0" className="w-full pl-7 pr-2 py-2 rounded-md bg-neutral-50 border border-neutral-200 text-[11px] focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 transition-all" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-medium text-neutral-500 mb-1">Sale *</label>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-neutral-400">Rs</span>
                      <input type="number" name="sale_price" value={formData.sale_price} onChange={handleInputChange} placeholder="0" className="w-full pl-7 pr-2 py-2 rounded-md bg-neutral-50 border border-neutral-200 text-[11px] focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 transition-all" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-medium text-neutral-500 mb-1">Wholesale</label>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-neutral-400">Rs</span>
                      <input type="number" name="wholesale_price" value={formData.wholesale_price} onChange={handleInputChange} placeholder="0" className="w-full pl-7 pr-2 py-2 rounded-md bg-neutral-50 border border-neutral-200 text-[11px] focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 transition-all" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-medium text-neutral-500 mb-1">Margin</label>
                    <div className={`px-2 py-2 rounded-md text-[11px] font-bold text-center ${parseFloat(margin) >= 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                      {margin}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Row 3: Dates & Additional */}
          <div className="bg-white rounded-lg border border-neutral-200 px-4 py-3 shadow-sm flex-1">
            <div className="grid grid-cols-2 gap-6">
              {/* Dates Section */}
              <div>
                <div className="text-[10px] font-semibold text-rose-600 uppercase tracking-wide mb-2">4. Expiry & Dates</div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[9px] font-medium text-neutral-500 mb-1">Manufacture Date</label>
                    <input type="date" name="manufacture_date" value={formData.manufacture_date} onChange={handleInputChange} className="w-full px-2 py-2 rounded-md bg-neutral-50 border border-neutral-200 text-[11px] focus:ring-2 focus:ring-rose-100 focus:border-rose-300 transition-all" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-medium text-neutral-500 mb-1">Expiry Date</label>
                    <input type="date" name="expiry_date" value={formData.expiry_date} onChange={handleInputChange} className="w-full px-2 py-2 rounded-md bg-neutral-50 border border-neutral-200 text-[11px] focus:ring-2 focus:ring-rose-100 focus:border-rose-300 transition-all" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-medium text-neutral-500 mb-1">Shelf Life (Days)</label>
                    <input type="number" name="shelf_life" value={formData.shelf_life} onChange={handleInputChange} placeholder="30" className="w-full px-2.5 py-2 rounded-md bg-neutral-50 border border-neutral-200 text-[11px] focus:ring-2 focus:ring-rose-100 focus:border-rose-300 transition-all" />
                  </div>
                </div>
              </div>

              {/* Additional Section */}
              <div>
                <div className="text-[10px] font-semibold text-purple-600 uppercase tracking-wide mb-2">5. Additional Info</div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[9px] font-medium text-neutral-500 mb-1">Weight (grams)</label>
                    <input type="number" name="weight_per_item" value={formData.weight_per_item} onChange={handleInputChange} placeholder="250" className="w-full px-2.5 py-2 rounded-md bg-neutral-50 border border-neutral-200 text-[11px] focus:ring-2 focus:ring-purple-100 focus:border-purple-300 transition-all" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[9px] font-medium text-neutral-500 mb-1">Description</label>
                    <input type="text" name="description" value={formData.description} onChange={handleInputChange} placeholder="Additional notes..." className="w-full px-2.5 py-2 rounded-md bg-neutral-50 border border-neutral-200 text-[11px] focus:ring-2 focus:ring-purple-100 focus:border-purple-300 transition-all" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Row 4: Supplier & Status */}
          <div className="bg-white rounded-lg border border-neutral-200 px-4 py-3 shadow-sm flex-1">
            <div className="grid grid-cols-12 gap-6">
              {/* Supplier */}
              <div className="col-span-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Truck className="w-3.5 h-3.5 text-neutral-500" />
                  <span className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wide">Supplier</span>
                </div>
                <select name="supplier_id" value={formData.supplier_id} onChange={handleInputChange} className="w-full px-2 py-2 rounded-md bg-neutral-50 border border-neutral-200 text-[11px] focus:ring-2 focus:ring-neutral-100 focus:border-neutral-300 transition-all">
                  <option value="">Select supplier</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              {/* Status */}
              <div className="col-span-9">
                <div className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wide mb-2">Product Status</div>
                <div className="flex gap-3">
                  <label className={`flex-1 flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 cursor-pointer transition-all ${formData.status === "active" ? 'bg-emerald-50 border-emerald-300' : 'bg-neutral-50 border-neutral-200 hover:bg-neutral-100'}`}>
                    <input type="radio" name="status" value="active" checked={formData.status === "active"} onChange={handleInputChange} className="w-3.5 h-3.5 text-emerald-600" />
                    <span className={`text-[11px] font-medium ${formData.status === "active" ? 'text-emerald-700' : 'text-neutral-700'}`}>Active</span>
                  </label>
                  <label className={`flex-1 flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 cursor-pointer transition-all ${formData.status === "short_in_market" ? 'bg-amber-50 border-amber-300' : 'bg-neutral-50 border-neutral-200 hover:bg-neutral-100'}`}>
                    <input type="radio" name="status" value="short_in_market" checked={formData.status === "short_in_market"} onChange={handleInputChange} className="w-3.5 h-3.5 text-amber-600" />
                    <span className={`text-[11px] font-medium ${formData.status === "short_in_market" ? 'text-amber-700' : 'text-neutral-700'}`}>Short in Market</span>
                  </label>
                  <label className={`flex-1 flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 cursor-pointer transition-all ${formData.status === "discontinued" ? 'bg-red-50 border-red-300' : 'bg-neutral-50 border-neutral-200 hover:bg-neutral-100'}`}>
                    <input type="radio" name="status" value="discontinued" checked={formData.status === "discontinued"} onChange={handleInputChange} className="w-3.5 h-3.5 text-red-600" />
                    <span className={`text-[11px] font-medium ${formData.status === "discontinued" ? 'text-red-700' : 'text-neutral-700'}`}>Discontinued</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Image & Summary */}
        <div className="w-[200px] flex flex-col gap-2 flex-shrink-0 overflow-hidden">
          {/* Product Image */}
          <div className="bg-white rounded-lg border border-neutral-200 p-2.5 shadow-sm flex-shrink-0">
            <div className="text-[9px] font-semibold text-neutral-600 uppercase tracking-wide mb-1.5">Product Image</div>
            <div className="relative border-2 border-dashed rounded-lg p-3 text-center border-neutral-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all cursor-pointer">
              <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center mx-auto mb-1.5">
                <ImageIcon className="w-5 h-5 text-neutral-400" />
              </div>
              <p className="text-[9px] text-neutral-600 font-medium">Drop image here</p>
              <p className="text-[7px] text-neutral-400">PNG, JPG up to 5MB</p>
              <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
            </div>
            <button className="w-full mt-1.5 flex items-center justify-center gap-1 py-1.5 rounded-md bg-neutral-100 text-neutral-700 text-[9px] font-medium hover:bg-neutral-200 transition-colors">
              <Upload className="w-2.5 h-2.5" /> Browse Files
            </button>
          </div>

          {/* Quick Summary */}
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg p-2.5 text-white flex-1 min-h-0 overflow-hidden flex flex-col">
            <div className="text-[9px] font-semibold uppercase tracking-wide mb-2 opacity-90 flex-shrink-0">Quick Summary</div>
            <div className="space-y-1.5 text-[9px] flex-1 overflow-auto">
              <div className="flex justify-between items-center">
                <span className="opacity-70">Product:</span>
                <span className="font-medium truncate max-w-[85px]">{formData.name || "—"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="opacity-70">Category:</span>
                <span className="font-medium">{formData.category || "—"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="opacity-70">Brand:</span>
                <span className="font-medium">{formData.brand || "—"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="opacity-70">Unit:</span>
                <span className="font-medium">{formData.unit}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="opacity-70">Stock:</span>
                <span className="font-medium">{formData.stock || "0"}</span>
              </div>
              <div className="h-px bg-white/20 my-1.5"></div>
              <div className="flex justify-between items-center">
                <span className="opacity-70">Purchase:</span>
                <span className="font-medium">Rs {formData.cost_price || "0"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="opacity-70">Sale:</span>
                <span className="font-medium">Rs {formData.sale_price || "0"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="opacity-70">Margin:</span>
                <span className="font-bold text-emerald-300">{margin}%</span>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSaveProduct}
            disabled={saving}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-neutral-900 text-white text-[10px] font-semibold hover:bg-neutral-800 shadow-lg disabled:opacity-50 flex-shrink-0 transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? "Saving..." : "Add Product"}
          </button>
        </div>
      </div>
    </div>
  );
}
