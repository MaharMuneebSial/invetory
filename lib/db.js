// Database helper for renderer process
// This file provides a unified API that works in both Electron and browser environments

const isElectron = typeof window !== "undefined" && window.electronAPI;

// ===== USERS =====
export async function login(email, password) {
  if (isElectron) {
    return window.electronAPI.login(email, password);
  }
  // Fallback for browser/development
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  return data.user || null;
}

// ===== PRODUCTS =====
export async function getProducts() {
  if (isElectron) {
    return window.electronAPI.getProducts();
  }
  const res = await fetch("/api/products");
  return res.json();
}

export async function getProductById(id) {
  if (isElectron) {
    return window.electronAPI.getProductById(id);
  }
  const res = await fetch(`/api/products/${id}`);
  return res.json();
}

export async function createProduct(product) {
  if (isElectron) {
    return window.electronAPI.createProduct(product);
  }
  const res = await fetch("/api/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(product),
  });
  return res.json();
}

export async function updateProduct(id, product) {
  if (isElectron) {
    return window.electronAPI.updateProduct(id, product);
  }
  const res = await fetch(`/api/products/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(product),
  });
  return res.json();
}

export async function deleteProduct(id) {
  if (isElectron) {
    return window.electronAPI.deleteProduct(id);
  }
  const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
  return res.json();
}

export async function getOutOfStockProducts() {
  if (isElectron) {
    return window.electronAPI.getOutOfStockProducts();
  }
  const res = await fetch("/api/products/out-of-stock");
  return res.json();
}

export async function getLowStockProducts() {
  if (isElectron) {
    return window.electronAPI.getLowStockProducts();
  }
  const res = await fetch("/api/products/low-stock");
  return res.json();
}

// ===== CUSTOMERS =====
export async function getCustomers() {
  if (isElectron) {
    return window.electronAPI.getCustomers();
  }
  const res = await fetch("/api/customers");
  return res.json();
}

export async function createCustomer(customer) {
  if (isElectron) {
    return window.electronAPI.createCustomer(customer);
  }
  const res = await fetch("/api/customers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(customer),
  });
  return res.json();
}

// ===== SUPPLIERS =====
export async function getSuppliers() {
  if (isElectron) {
    return window.electronAPI.getSuppliers();
  }
  const res = await fetch("/api/suppliers");
  return res.json();
}

export async function createSupplier(supplier) {
  if (isElectron) {
    return window.electronAPI.createSupplier(supplier);
  }
  const res = await fetch("/api/suppliers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(supplier),
  });
  return res.json();
}

// ===== SALE INVOICES =====
export async function getSaleInvoices() {
  if (isElectron) {
    return window.electronAPI.getSaleInvoices();
  }
  const res = await fetch("/api/sale-invoices");
  return res.json();
}

export async function getSaleInvoiceById(id) {
  if (isElectron) {
    return window.electronAPI.getSaleInvoiceById(id);
  }
  const res = await fetch(`/api/sale-invoices/${id}`);
  return res.json();
}

export async function getSaleInvoiceStats() {
  if (isElectron) {
    return window.electronAPI.getSaleInvoiceStats();
  }
  const res = await fetch("/api/sale-invoices/stats");
  return res.json();
}

export async function createSaleInvoice(invoice, items) {
  if (isElectron) {
    return window.electronAPI.createSaleInvoice(invoice, items);
  }
  const res = await fetch("/api/sale-invoices", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ invoice, items }),
  });
  return res.json();
}

// ===== PURCHASE INVOICES =====
export async function getPurchaseInvoices() {
  if (isElectron) {
    return window.electronAPI.getPurchaseInvoices();
  }
  const res = await fetch("/api/purchase-invoices");
  return res.json();
}

export async function getPurchaseInvoiceById(id) {
  if (isElectron) {
    return window.electronAPI.getPurchaseInvoiceById(id);
  }
  const res = await fetch(`/api/purchase-invoices/${id}`);
  return res.json();
}

export async function getPurchaseInvoiceStats() {
  if (isElectron) {
    return window.electronAPI.getPurchaseInvoiceStats();
  }
  const res = await fetch("/api/purchase-invoices/stats");
  return res.json();
}

export async function createPurchaseInvoice(invoice, items) {
  if (isElectron) {
    return window.electronAPI.createPurchaseInvoice(invoice, items);
  }
  const res = await fetch("/api/purchase-invoices", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ invoice, items }),
  });
  return res.json();
}

// ===== PURCHASE RETURNS =====
export async function getPurchaseReturns() {
  if (isElectron) {
    return window.electronAPI.getPurchaseReturns();
  }
  const res = await fetch("/api/purchase-returns");
  return res.json();
}

export async function createPurchaseReturn(returnData) {
  if (isElectron) {
    return window.electronAPI.createPurchaseReturn(returnData);
  }
  const res = await fetch("/api/purchase-returns", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(returnData),
  });
  return res.json();
}

// ===== SALE RETURNS =====
export async function getSaleReturns() {
  if (isElectron) {
    return window.electronAPI.getSaleReturns();
  }
  const res = await fetch("/api/sale-returns");
  return res.json();
}

export async function getSaleReturnById(id) {
  if (isElectron) {
    return window.electronAPI.getSaleReturnById(id);
  }
  const res = await fetch(`/api/sale-returns/${id}`);
  return res.json();
}

export async function getSaleReturnStats() {
  if (isElectron) {
    return window.electronAPI.getSaleReturnStats();
  }
  const res = await fetch("/api/sale-returns/stats");
  return res.json();
}

export async function createSaleReturn(returnData) {
  if (isElectron) {
    return window.electronAPI.createSaleReturn(returnData);
  }
  const res = await fetch("/api/sale-returns", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(returnData),
  });
  return res.json();
}

// ===== PAYMENTS =====
export async function getPayments() {
  if (isElectron) {
    return window.electronAPI.getPayments();
  }
  const res = await fetch("/api/payments");
  return res.json();
}

export async function getRecentPayments(limit = 5) {
  if (isElectron) {
    return window.electronAPI.getRecentPayments(limit);
  }
  const res = await fetch(`/api/payments/recent?limit=${limit}`);
  return res.json();
}

export async function createPayment(payment) {
  if (isElectron) {
    return window.electronAPI.createPayment(payment);
  }
  const res = await fetch("/api/payments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payment),
  });
  return res.json();
}

// ===== EXPENSES =====
export async function getExpenses() {
  if (isElectron) {
    return window.electronAPI.getExpenses();
  }
  const res = await fetch("/api/expenses");
  return res.json();
}

export async function createExpense(expense) {
  if (isElectron) {
    return window.electronAPI.createExpense(expense);
  }
  const res = await fetch("/api/expenses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(expense),
  });
  return res.json();
}

// ===== DASHBOARD =====
export async function getDashboardStats() {
  if (isElectron) {
    return window.electronAPI.getDashboardStats();
  }
  const res = await fetch("/api/dashboard/stats");
  return res.json();
}

// ===== SETTINGS =====
export async function getSetting(key) {
  if (isElectron) {
    return window.electronAPI.getSetting(key);
  }
  const res = await fetch(`/api/settings/${key}`);
  const data = await res.json();
  return data.value;
}

export async function setSetting(key, value) {
  if (isElectron) {
    return window.electronAPI.setSetting(key, value);
  }
  const res = await fetch(`/api/settings/${key}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ value }),
  });
  return res.json();
}
