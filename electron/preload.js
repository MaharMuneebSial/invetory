const { contextBridge, ipcRenderer } = require("electron");

// Expose database API to renderer process
contextBridge.exposeInMainWorld("electronAPI", {
  // ===== USERS =====
  login: (email, password) => ipcRenderer.invoke("db:users:login", email, password),
  getUsers: () => ipcRenderer.invoke("db:users:getAll"),

  // ===== PRODUCTS =====
  getProducts: () => ipcRenderer.invoke("db:products:getAll"),
  getProductById: (id) => ipcRenderer.invoke("db:products:getById", id),
  createProduct: (product) => ipcRenderer.invoke("db:products:create", product),
  updateProduct: (id, product) => ipcRenderer.invoke("db:products:update", id, product),
  deleteProduct: (id) => ipcRenderer.invoke("db:products:delete", id),
  updateProductStock: (id, quantity) => ipcRenderer.invoke("db:products:updateStock", id, quantity),
  getOutOfStockProducts: () => ipcRenderer.invoke("db:products:getOutOfStock"),
  getLowStockProducts: () => ipcRenderer.invoke("db:products:getLowStock"),

  // ===== CUSTOMERS =====
  getCustomers: () => ipcRenderer.invoke("db:customers:getAll"),
  createCustomer: (customer) => ipcRenderer.invoke("db:customers:create", customer),
  updateCustomer: (id, customer) => ipcRenderer.invoke("db:customers:update", id, customer),
  updateCustomerBalance: (id, amount) => ipcRenderer.invoke("db:customers:updateBalance", id, amount),

  // ===== SUPPLIERS =====
  getSuppliers: () => ipcRenderer.invoke("db:suppliers:getAll"),
  createSupplier: (supplier) => ipcRenderer.invoke("db:suppliers:create", supplier),

  // ===== SALE INVOICES =====
  getSaleInvoices: () => ipcRenderer.invoke("db:saleInvoices:getAll"),
  getSaleInvoiceById: (id) => ipcRenderer.invoke("db:saleInvoices:getById", id),
  getSaleInvoiceStats: () => ipcRenderer.invoke("db:saleInvoices:getStats"),
  createSaleInvoice: (invoice, items) => ipcRenderer.invoke("db:saleInvoices:create", invoice, items),

  // ===== PURCHASE INVOICES =====
  getPurchaseInvoices: () => ipcRenderer.invoke("db:purchaseInvoices:getAll"),
  getPurchaseInvoiceById: (id) => ipcRenderer.invoke("db:purchaseInvoices:getById", id),
  getPurchaseInvoiceStats: () => ipcRenderer.invoke("db:purchaseInvoices:getStats"),
  createPurchaseInvoice: (invoice, items) => ipcRenderer.invoke("db:purchaseInvoices:create", invoice, items),

  // ===== PURCHASE RETURNS =====
  getPurchaseReturns: () => ipcRenderer.invoke("db:purchaseReturns:getAll"),
  createPurchaseReturn: (returnData) => ipcRenderer.invoke("db:purchaseReturns:create", returnData),

  // ===== SALE RETURNS =====
  getSaleReturns: () => ipcRenderer.invoke("db:saleReturns:getAll"),
  getSaleReturnById: (id) => ipcRenderer.invoke("db:saleReturns:getById", id),
  getSaleReturnStats: () => ipcRenderer.invoke("db:saleReturns:getStats"),
  createSaleReturn: (returnData) => ipcRenderer.invoke("db:saleReturns:create", returnData),

  // ===== PAYMENTS =====
  getPayments: () => ipcRenderer.invoke("db:payments:getAll"),
  getRecentPayments: (limit) => ipcRenderer.invoke("db:payments:getRecent", limit),
  createPayment: (payment) => ipcRenderer.invoke("db:payments:create", payment),

  // ===== EXPENSES =====
  getExpenses: () => ipcRenderer.invoke("db:expenses:getAll"),
  createExpense: (expense) => ipcRenderer.invoke("db:expenses:create", expense),

  // ===== DASHBOARD =====
  getDashboardStats: () => ipcRenderer.invoke("db:dashboard:getStats"),

  // ===== SETTINGS =====
  getSetting: (key) => ipcRenderer.invoke("db:settings:get", key),
  setSetting: (key, value) => ipcRenderer.invoke("db:settings:set", key, value),
});
