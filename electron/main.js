const { app, BrowserWindow, ipcMain, Menu } = require("electron");
const path = require("path");
const Database = require("better-sqlite3");

// Database setup
let db;

function createDatabase() {
  const isDev = !app.isPackaged;
  const dbPath = isDev
    ? path.join(__dirname, "../database.db")
    : path.join(app.getPath("userData"), "database.db");

  db = new Database(dbPath);

  // Create tables
  db.exec(`
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT UNIQUE,
      password TEXT,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Products table
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      sku TEXT UNIQUE,
      category TEXT,
      sub_category TEXT,
      brand TEXT,
      unit TEXT DEFAULT 'Piece',
      conversion_rate INTEGER DEFAULT 1,
      conversion_unit TEXT,
      cost_price REAL DEFAULT 0,
      sale_price REAL DEFAULT 0,
      wholesale_price REAL DEFAULT 0,
      stock INTEGER DEFAULT 0,
      reorder_level INTEGER DEFAULT 10,
      expiry_date TEXT,
      manufacture_date TEXT,
      shelf_life INTEGER,
      weight_per_item REAL,
      supplier_id INTEGER,
      status TEXT DEFAULT 'active',
      description TEXT,
      image_path TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
    );

    -- Customers table
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      address TEXT,
      balance REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Suppliers table
    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      address TEXT,
      balance REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Sale Invoices table
    CREATE TABLE IF NOT EXISTS sale_invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number TEXT UNIQUE,
      customer_id INTEGER,
      subtotal REAL DEFAULT 0,
      tax REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      total REAL DEFAULT 0,
      paid REAL DEFAULT 0,
      balance REAL DEFAULT 0,
      payment_method TEXT DEFAULT 'Cash',
      status TEXT DEFAULT 'pending',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    -- Sale Invoice Items table
    CREATE TABLE IF NOT EXISTS sale_invoice_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER,
      product_id INTEGER,
      quantity INTEGER DEFAULT 1,
      price REAL DEFAULT 0,
      total REAL DEFAULT 0,
      FOREIGN KEY (invoice_id) REFERENCES sale_invoices(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    -- Purchase Invoices table
    CREATE TABLE IF NOT EXISTS purchase_invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number TEXT UNIQUE,
      supplier_id INTEGER,
      subtotal REAL DEFAULT 0,
      tax REAL DEFAULT 0,
      shipping REAL DEFAULT 0,
      total REAL DEFAULT 0,
      paid REAL DEFAULT 0,
      balance REAL DEFAULT 0,
      status TEXT DEFAULT 'pending',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
    );

    -- Purchase Invoice Items table
    CREATE TABLE IF NOT EXISTS purchase_invoice_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER,
      product_id INTEGER,
      quantity INTEGER DEFAULT 1,
      cost REAL DEFAULT 0,
      total REAL DEFAULT 0,
      FOREIGN KEY (invoice_id) REFERENCES purchase_invoices(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    -- Payments table
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT CHECK(type IN ('received', 'made')),
      reference_type TEXT,
      reference_id INTEGER,
      customer_id INTEGER,
      supplier_id INTEGER,
      amount REAL DEFAULT 0,
      payment_method TEXT DEFAULT 'Cash',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Expenses table
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT,
      description TEXT,
      amount REAL DEFAULT 0,
      payment_method TEXT DEFAULT 'Cash',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Sale Returns table
    CREATE TABLE IF NOT EXISTS sale_returns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      return_invoice_no TEXT UNIQUE,
      return_date TEXT,
      return_time TEXT,
      original_sale_invoice_id INTEGER,
      original_sale_invoice_no TEXT,
      customer_name TEXT,
      customer_contact TEXT,
      items_subtotal REAL DEFAULT 0,
      discount_percentage REAL DEFAULT 0,
      discount_amount REAL DEFAULT 0,
      tax_percentage REAL DEFAULT 0,
      tax_amount REAL DEFAULT 0,
      extra_charges_deduction REAL DEFAULT 0,
      round_off REAL DEFAULT 0,
      refund_total REAL DEFAULT 0,
      refund_method TEXT DEFAULT 'Cash',
      refund_amount REAL DEFAULT 0,
      refund_status TEXT DEFAULT 'Pending',
      return_reason TEXT,
      notes TEXT,
      created_by TEXT,
      stock_adjustment_status TEXT DEFAULT 'Added back to stock',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (original_sale_invoice_id) REFERENCES sale_invoices(id)
    );

    -- Sale Return Items table
    CREATE TABLE IF NOT EXISTS sale_return_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_return_id INTEGER,
      product_id INTEGER,
      product_name TEXT,
      product_sku TEXT,
      company_name TEXT,
      batch_no TEXT,
      expiry_date TEXT,
      returned_quantity INTEGER DEFAULT 1,
      unit_price REAL DEFAULT 0,
      subtotal REAL DEFAULT 0,
      return_reason TEXT,
      FOREIGN KEY (sale_return_id) REFERENCES sale_returns(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    -- Purchase Returns table
    CREATE TABLE IF NOT EXISTS purchase_returns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      return_invoice_no TEXT UNIQUE,
      return_date TEXT,
      return_time TEXT,
      original_purchase_invoice_id INTEGER,
      original_purchase_invoice_no TEXT,
      supplier_id INTEGER,
      supplier_name TEXT,
      supplier_contact TEXT,
      subtotal REAL DEFAULT 0,
      gst_percentage REAL DEFAULT 0,
      gst_amount REAL DEFAULT 0,
      return_total REAL DEFAULT 0,
      refund_method TEXT DEFAULT 'Cash',
      refund_amount REAL DEFAULT 0,
      refund_status TEXT DEFAULT 'Pending',
      return_reason TEXT,
      notes TEXT,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (original_purchase_invoice_id) REFERENCES purchase_invoices(id),
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
    );

    -- Purchase Return Items table
    CREATE TABLE IF NOT EXISTS purchase_return_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      purchase_return_id INTEGER,
      product_id INTEGER,
      product_name TEXT,
      returned_quantity INTEGER DEFAULT 1,
      unit_price REAL DEFAULT 0,
      total_amount REAL DEFAULT 0,
      return_reason TEXT,
      FOREIGN KEY (purchase_return_id) REFERENCES purchase_returns(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    -- Settings table
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE,
      value TEXT
    );
  `);

  // Insert default admin user if not exists
  const adminExists = db.prepare("SELECT id FROM users WHERE email = ?").get("admin@admin.com");
  if (!adminExists) {
    db.prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)").run(
      "Admin",
      "admin@admin.com",
      "admin123",
      "admin"
    );
  }

  // Insert default settings
  const settings = [
    ["company_name", "Nawab Cash and Carry"],
    ["company_address", "Main Branch"],
    ["currency", "Rs"],
    ["tax_rate", "5"],
  ];

  const insertSetting = db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)");
  settings.forEach(([key, value]) => insertSetting.run(key, value));

  // Run migrations to add missing columns to products table
  try {
    const tableInfo = db.prepare("PRAGMA table_info(products)").all();
    const existingColumns = tableInfo.map(col => col.name);

    // Define all columns that should exist in products table
    const requiredColumns = [
      { name: 'sub_category', definition: 'TEXT' },
      { name: 'brand', definition: 'TEXT' },
      { name: 'unit', definition: "TEXT DEFAULT 'Piece'" },
      { name: 'conversion_rate', definition: 'INTEGER DEFAULT 1' },
      { name: 'conversion_unit', definition: 'TEXT' },
      { name: 'cost_price', definition: 'REAL DEFAULT 0' },
      { name: 'sale_price', definition: 'REAL DEFAULT 0' },
      { name: 'wholesale_price', definition: 'REAL DEFAULT 0' },
      { name: 'stock', definition: 'INTEGER DEFAULT 0' },
      { name: 'reorder_level', definition: 'INTEGER DEFAULT 10' },
      { name: 'expiry_date', definition: 'TEXT' },
      { name: 'manufacture_date', definition: 'TEXT' },
      { name: 'shelf_life', definition: 'INTEGER' },
      { name: 'weight_per_item', definition: 'REAL' },
      { name: 'supplier_id', definition: 'INTEGER' },
      { name: 'status', definition: "TEXT DEFAULT 'active'" },
      { name: 'description', definition: 'TEXT' },
      { name: 'image_path', definition: 'TEXT' },
      { name: 'updated_at', definition: 'DATETIME DEFAULT CURRENT_TIMESTAMP' },
    ];

    // Add missing columns
    requiredColumns.forEach(({ name, definition }) => {
      if (!existingColumns.includes(name)) {
        try {
          db.exec(`ALTER TABLE products ADD COLUMN ${name} ${definition}`);
          console.log(`Added ${name} column to products table`);
        } catch (err) {
          console.error(`Failed to add ${name} column:`, err.message);
        }
      }
    });
  } catch (migrationError) {
    console.error("Migration error:", migrationError);
  }

  console.log("Database initialized successfully");
}

function createWindow() {
  // Remove the default menu bar
  Menu.setApplicationMenu(null);

  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, "../public/icon.png"),
    title: "Inventory Management System - Airoxlab",
    show: false,
    autoHideMenuBar: true,
  });

  // Show window when ready
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  const isDev = !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL("http://localhost:3000");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../out/index.html"));
  }
}

// IPC Handlers for Database Operations
function setupIpcHandlers() {
  // ===== USERS =====
  ipcMain.handle("db:users:login", async (event, email, password) => {
    const user = db.prepare("SELECT id, name, email, role FROM users WHERE email = ? AND password = ?").get(email, password);
    return user || null;
  });

  ipcMain.handle("db:users:getAll", async () => {
    return db.prepare("SELECT id, name, email, role, created_at FROM users").all();
  });

  // ===== PRODUCTS =====
  ipcMain.handle("db:products:getAll", async () => {
    return db.prepare("SELECT * FROM products ORDER BY name").all();
  });

  ipcMain.handle("db:products:getById", async (event, id) => {
    return db.prepare("SELECT * FROM products WHERE id = ?").get(id);
  });

  ipcMain.handle("db:products:create", async (event, product) => {
    const stmt = db.prepare(`
      INSERT INTO products (
        name, sku, category, sub_category, brand, unit, conversion_rate, conversion_unit,
        cost_price, sale_price, wholesale_price, stock, reorder_level,
        expiry_date, manufacture_date, shelf_life, weight_per_item,
        supplier_id, status, description, image_path
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      product.name, product.sku, product.category, product.sub_category, product.brand,
      product.unit, product.conversion_rate || 1, product.conversion_unit,
      product.cost_price, product.sale_price, product.wholesale_price || 0,
      product.stock || 0, product.reorder_level || 10,
      product.expiry_date, product.manufacture_date, product.shelf_life,
      product.weight_per_item, product.supplier_id, product.status || 'active',
      product.description, product.image_path
    );
    return { id: result.lastInsertRowid, ...product };
  });

  ipcMain.handle("db:products:update", async (event, id, product) => {
    const stmt = db.prepare(`
      UPDATE products SET
        name=?, sku=?, category=?, sub_category=?, brand=?, unit=?, conversion_rate=?, conversion_unit=?,
        cost_price=?, sale_price=?, wholesale_price=?, stock=?, reorder_level=?,
        expiry_date=?, manufacture_date=?, shelf_life=?, weight_per_item=?,
        supplier_id=?, status=?, description=?, image_path=?, updated_at=CURRENT_TIMESTAMP
      WHERE id=?
    `);
    stmt.run(
      product.name, product.sku, product.category, product.sub_category, product.brand,
      product.unit, product.conversion_rate || 1, product.conversion_unit,
      product.cost_price, product.sale_price, product.wholesale_price || 0,
      product.stock || 0, product.reorder_level || 10,
      product.expiry_date, product.manufacture_date, product.shelf_life,
      product.weight_per_item, product.supplier_id, product.status || 'active',
      product.description, product.image_path, id
    );
    return { id, ...product };
  });

  ipcMain.handle("db:products:delete", async (event, id) => {
    db.prepare("DELETE FROM products WHERE id = ?").run(id);
    return { success: true };
  });

  ipcMain.handle("db:products:updateStock", async (event, id, quantity) => {
    db.prepare("UPDATE products SET stock = stock + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(quantity, id);
    return { success: true };
  });

  ipcMain.handle("db:products:getOutOfStock", async () => {
    return db.prepare("SELECT * FROM products WHERE stock <= 0 ORDER BY stock ASC").all();
  });

  ipcMain.handle("db:products:getLowStock", async () => {
    return db.prepare("SELECT * FROM products WHERE stock > 0 AND stock <= reorder_level ORDER BY stock ASC").all();
  });

  // ===== CUSTOMERS =====
  ipcMain.handle("db:customers:getAll", async () => {
    return db.prepare("SELECT * FROM customers ORDER BY name").all();
  });

  ipcMain.handle("db:customers:create", async (event, customer) => {
    const stmt = db.prepare("INSERT INTO customers (name, phone, email, address) VALUES (?, ?, ?, ?)");
    const result = stmt.run(customer.name, customer.phone, customer.email, customer.address);
    return { id: result.lastInsertRowid, ...customer };
  });

  ipcMain.handle("db:customers:update", async (event, id, customer) => {
    db.prepare("UPDATE customers SET name=?, phone=?, email=?, address=? WHERE id=?")
      .run(customer.name, customer.phone, customer.email, customer.address, id);
    return { id, ...customer };
  });

  ipcMain.handle("db:customers:updateBalance", async (event, id, amount) => {
    db.prepare("UPDATE customers SET balance = balance + ? WHERE id = ?").run(amount, id);
    return { success: true };
  });

  // ===== SUPPLIERS =====
  ipcMain.handle("db:suppliers:getAll", async () => {
    return db.prepare("SELECT * FROM suppliers ORDER BY name").all();
  });

  ipcMain.handle("db:suppliers:create", async (event, supplier) => {
    const stmt = db.prepare("INSERT INTO suppliers (name, phone, email, address) VALUES (?, ?, ?, ?)");
    const result = stmt.run(supplier.name, supplier.phone, supplier.email, supplier.address);
    return { id: result.lastInsertRowid, ...supplier };
  });

  // ===== SALE INVOICES =====
  ipcMain.handle("db:saleInvoices:getAll", async () => {
    return db.prepare(`
      SELECT si.*, c.name as customer_name,
        (SELECT COUNT(*) FROM sale_invoice_items WHERE invoice_id = si.id) as item_count
      FROM sale_invoices si
      LEFT JOIN customers c ON si.customer_id = c.id
      ORDER BY si.created_at DESC
    `).all();
  });

  ipcMain.handle("db:saleInvoices:getStats", async () => {
    const totalSales = db.prepare("SELECT COALESCE(SUM(total), 0) as total FROM sale_invoices").get();
    const paidInvoices = db.prepare("SELECT COUNT(*) as count FROM sale_invoices WHERE status = 'paid'").get();
    const pendingInvoices = db.prepare("SELECT COUNT(*) as count FROM sale_invoices WHERE status = 'pending'").get();
    const overdueInvoices = db.prepare("SELECT COUNT(*) as count FROM sale_invoices WHERE status = 'overdue'").get();
    const totalCustomers = db.prepare("SELECT COUNT(*) as count FROM customers").get();

    return {
      totalSales: totalSales.total,
      paidInvoices: paidInvoices.count,
      pendingInvoices: pendingInvoices.count,
      overdueInvoices: overdueInvoices.count,
      totalCustomers: totalCustomers.count,
    };
  });

  ipcMain.handle("db:saleInvoices:getById", async (event, id) => {
    const invoice = db.prepare(`
      SELECT si.*, c.name as customer_name
      FROM sale_invoices si
      LEFT JOIN customers c ON si.customer_id = c.id
      WHERE si.id = ?
    `).get(id);

    if (invoice) {
      invoice.items = db.prepare(`
        SELECT sii.*, p.name as product_name, p.sku
        FROM sale_invoice_items sii
        JOIN products p ON sii.product_id = p.id
        WHERE sii.invoice_id = ?
      `).all(id);
    }
    return invoice;
  });

  ipcMain.handle("db:saleInvoices:create", async (event, invoice, items) => {
    const invoiceNumber = `INV-${Date.now()}`;

    const insertInvoice = db.prepare(`
      INSERT INTO sale_invoices (invoice_number, customer_id, subtotal, tax, discount, total, paid, balance, payment_method, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertInvoice.run(
      invoiceNumber, invoice.customer_id, invoice.subtotal, invoice.tax, invoice.discount,
      invoice.total, invoice.paid, invoice.balance, invoice.payment_method, invoice.status, invoice.notes
    );

    const invoiceId = result.lastInsertRowid;

    const insertItem = db.prepare(`
      INSERT INTO sale_invoice_items (invoice_id, product_id, quantity, price, total)
      VALUES (?, ?, ?, ?, ?)
    `);

    const updateStock = db.prepare("UPDATE products SET stock = stock - ? WHERE id = ?");

    items.forEach(item => {
      insertItem.run(invoiceId, item.product_id, item.quantity, item.price, item.total);
      updateStock.run(item.quantity, item.product_id);
    });

    return { id: invoiceId, invoice_number: invoiceNumber };
  });

  // ===== PURCHASE INVOICES =====
  ipcMain.handle("db:purchaseInvoices:getAll", async () => {
    return db.prepare(`
      SELECT pi.*, s.name as supplier_name,
        (SELECT COUNT(*) FROM purchase_invoice_items WHERE invoice_id = pi.id) as item_count
      FROM purchase_invoices pi
      LEFT JOIN suppliers s ON pi.supplier_id = s.id
      ORDER BY pi.created_at DESC
    `).all();
  });

  ipcMain.handle("db:purchaseInvoices:getById", async (event, id) => {
    const invoice = db.prepare(`
      SELECT pi.*, s.name as supplier_name,
        (SELECT COUNT(*) FROM purchase_invoice_items WHERE invoice_id = pi.id) as item_count
      FROM purchase_invoices pi
      LEFT JOIN suppliers s ON pi.supplier_id = s.id
      WHERE pi.id = ?
    `).get(id);

    if (invoice) {
      const items = db.prepare(`
        SELECT pii.*, p.name as product_name, p.sku
        FROM purchase_invoice_items pii
        LEFT JOIN products p ON pii.product_id = p.id
        WHERE pii.invoice_id = ?
      `).all(id);
      invoice.items = items;
    }

    return invoice;
  });

  ipcMain.handle("db:purchaseInvoices:getStats", async () => {
    const totalPurchases = db.prepare("SELECT COALESCE(SUM(total), 0) as total FROM purchase_invoices").get();
    const pendingOrders = db.prepare("SELECT COUNT(*) as count FROM purchase_invoices WHERE status = 'pending'").get();
    const inTransitOrders = db.prepare("SELECT COUNT(*) as count FROM purchase_invoices WHERE status = 'in-transit'").get();
    const activeSuppliers = db.prepare("SELECT COUNT(*) as count FROM suppliers").get();

    return {
      totalPurchases: totalPurchases.total,
      pendingOrders: pendingOrders.count,
      inTransitOrders: inTransitOrders.count,
      activeSuppliers: activeSuppliers.count,
    };
  });

  ipcMain.handle("db:purchaseInvoices:create", async (event, invoice, items) => {
    const invoiceNumber = `PO-${Date.now()}`;

    const insertInvoice = db.prepare(`
      INSERT INTO purchase_invoices (invoice_number, supplier_id, subtotal, tax, shipping, total, paid, balance, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertInvoice.run(
      invoiceNumber, invoice.supplier_id, invoice.subtotal, invoice.tax, invoice.shipping,
      invoice.total, invoice.paid, invoice.balance, invoice.status, invoice.notes
    );

    const invoiceId = result.lastInsertRowid;

    const insertItem = db.prepare(`
      INSERT INTO purchase_invoice_items (invoice_id, product_id, quantity, cost, total)
      VALUES (?, ?, ?, ?, ?)
    `);

    const updateStock = db.prepare("UPDATE products SET stock = stock + ? WHERE id = ?");

    items.forEach(item => {
      insertItem.run(invoiceId, item.product_id, item.quantity, item.cost, item.total);
      updateStock.run(item.quantity, item.product_id);
    });

    return { id: invoiceId, invoice_number: invoiceNumber };
  });

  // ===== PAYMENTS =====
  ipcMain.handle("db:payments:getAll", async () => {
    return db.prepare(`
      SELECT p.*,
        c.name as customer_name,
        s.name as supplier_name,
        CASE
          WHEN p.reference_type = 'sale_invoice' THEN si.invoice_number
          WHEN p.reference_type = 'purchase_invoice' THEN pi.invoice_number
          ELSE NULL
        END as invoice_number
      FROM payments p
      LEFT JOIN customers c ON p.customer_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      LEFT JOIN sale_invoices si ON p.reference_type = 'sale_invoice' AND p.reference_id = si.id
      LEFT JOIN purchase_invoices pi ON p.reference_type = 'purchase_invoice' AND p.reference_id = pi.id
      ORDER BY p.created_at DESC
    `).all();
  });

  ipcMain.handle("db:payments:getRecent", async (event, limit = 5) => {
    return db.prepare(`
      SELECT p.*,
        c.name as customer_name,
        s.name as supplier_name
      FROM payments p
      LEFT JOIN customers c ON p.customer_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      ORDER BY p.created_at DESC
      LIMIT ?
    `).all(limit);
  });

  ipcMain.handle("db:payments:create", async (event, payment) => {
    const stmt = db.prepare(`
      INSERT INTO payments (type, reference_type, reference_id, customer_id, supplier_id, amount, payment_method, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      payment.type, payment.reference_type, payment.reference_id,
      payment.customer_id, payment.supplier_id, payment.amount, payment.payment_method, payment.notes
    );

    // Update invoice paid amount if reference exists
    if (payment.reference_type === 'sale_invoice' && payment.reference_id) {
      db.prepare(`
        UPDATE sale_invoices
        SET paid = paid + ?,
            balance = total - (paid + ?),
            status = CASE WHEN (paid + ?) >= total THEN 'paid' ELSE status END
        WHERE id = ?
      `).run(payment.amount, payment.amount, payment.amount, payment.reference_id);
    } else if (payment.reference_type === 'purchase_invoice' && payment.reference_id) {
      db.prepare(`
        UPDATE purchase_invoices
        SET paid = paid + ?,
            balance = total - (paid + ?),
            status = CASE WHEN (paid + ?) >= total THEN 'paid' ELSE status END
        WHERE id = ?
      `).run(payment.amount, payment.amount, payment.amount, payment.reference_id);
    }

    return { id: result.lastInsertRowid, ...payment };
  });

  // ===== EXPENSES =====
  ipcMain.handle("db:expenses:getAll", async () => {
    return db.prepare("SELECT * FROM expenses ORDER BY created_at DESC").all();
  });

  ipcMain.handle("db:expenses:create", async (event, expense) => {
    const stmt = db.prepare("INSERT INTO expenses (category, description, amount, payment_method) VALUES (?, ?, ?, ?)");
    const result = stmt.run(expense.category, expense.description, expense.amount, expense.payment_method);
    return { id: result.lastInsertRowid, ...expense };
  });

  // ===== DASHBOARD STATS =====
  ipcMain.handle("db:dashboard:getStats", async () => {
    const today = new Date().toISOString().split("T")[0];

    const totalSale = db.prepare("SELECT COALESCE(SUM(total), 0) as total FROM sale_invoices WHERE date(created_at) = ?").get(today);
    const totalPurchase = db.prepare("SELECT COALESCE(SUM(total), 0) as total FROM purchase_invoices WHERE date(created_at) = ?").get(today);
    const totalExpenses = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE date(created_at) = ?").get(today);
    const customerBalances = db.prepare("SELECT COALESCE(SUM(balance), 0) as total FROM customers").get();
    const cashInHand = db.prepare("SELECT COALESCE(SUM(CASE WHEN type='received' THEN amount ELSE -amount END), 0) as total FROM payments WHERE payment_method='Cash'").get();

    return {
      todaySale: totalSale.total,
      todayPurchase: totalPurchase.total,
      todayExpenses: totalExpenses.total,
      customerBalances: customerBalances.total,
      cashInHand: cashInHand.total,
    };
  });

  // ===== PURCHASE RETURNS =====
  ipcMain.handle("db:purchaseReturns:getAll", async () => {
    return db.prepare(`
      SELECT pr.*, s.name as supplier_name, pi.invoice_number as original_invoice
      FROM purchase_returns pr
      LEFT JOIN suppliers s ON pr.supplier_id = s.id
      LEFT JOIN purchase_invoices pi ON pr.original_purchase_invoice_id = pi.id
      ORDER BY pr.created_at DESC
    `).all();
  });

  ipcMain.handle("db:purchaseReturns:create", async (event, returnData) => {
    const stmt = db.prepare(`
      INSERT INTO purchase_returns (
        return_invoice_no, return_date, return_time,
        original_purchase_invoice_id, original_purchase_invoice_no,
        supplier_id, supplier_name, supplier_contact,
        subtotal, gst_percentage, gst_amount, return_total,
        refund_method, refund_amount, refund_status,
        return_reason, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      returnData.return_invoice_no,
      returnData.return_date,
      returnData.return_time,
      returnData.original_purchase_invoice_id,
      returnData.original_purchase_invoice_no,
      returnData.supplier_id,
      returnData.supplier_name,
      returnData.supplier_contact,
      returnData.subtotal,
      returnData.gst_percentage,
      returnData.gst_amount,
      returnData.return_total,
      returnData.refund_method,
      returnData.refund_amount,
      returnData.refund_status,
      returnData.return_reason,
      returnData.notes,
      returnData.created_by
    );

    const returnId = result.lastInsertRowid;

    // Insert return items
    if (returnData.items && returnData.items.length > 0) {
      const insertItem = db.prepare(`
        INSERT INTO purchase_return_items (
          purchase_return_id, product_id, product_name,
          returned_quantity, unit_price, total_amount, return_reason
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      returnData.items.forEach((item) => {
        insertItem.run(
          returnId,
          item.product_id,
          item.product_name,
          item.returned_quantity,
          item.unit_price,
          item.total_amount,
          item.return_reason
        );

        // Update product stock (add back to stock since it's being returned to supplier)
        // Actually for purchase return, we're returning to supplier so stock should decrease
        db.prepare("UPDATE products SET stock = stock - ? WHERE id = ?").run(
          item.returned_quantity,
          item.product_id
        );
      });
    }

    return { id: returnId, return_invoice_no: returnData.return_invoice_no };
  });

  // ===== SALE RETURNS =====
  ipcMain.handle("db:saleReturns:getAll", async () => {
    return db.prepare(`
      SELECT sr.*, si.invoice_number as original_invoice,
        (SELECT COUNT(*) FROM sale_return_items WHERE sale_return_id = sr.id) as total_items
      FROM sale_returns sr
      LEFT JOIN sale_invoices si ON sr.original_sale_invoice_id = si.id
      ORDER BY sr.created_at DESC
    `).all();
  });

  ipcMain.handle("db:saleReturns:getById", async (event, id) => {
    const saleReturn = db.prepare(`
      SELECT sr.*, si.invoice_number as original_invoice
      FROM sale_returns sr
      LEFT JOIN sale_invoices si ON sr.original_sale_invoice_id = si.id
      WHERE sr.id = ?
    `).get(id);

    if (saleReturn) {
      saleReturn.items = db.prepare(`
        SELECT * FROM sale_return_items WHERE sale_return_id = ?
      `).all(id);
    }

    return saleReturn;
  });

  ipcMain.handle("db:saleReturns:getStats", async () => {
    const totalReturns = db.prepare("SELECT COUNT(*) as count FROM sale_returns").get();
    const totalRefunded = db.prepare("SELECT COALESCE(SUM(refund_total), 0) as total FROM sale_returns").get();
    const pendingReturns = db.prepare("SELECT COUNT(*) as count FROM sale_returns WHERE refund_status = 'Pending'").get();
    const completedReturns = db.prepare("SELECT COUNT(*) as count FROM sale_returns WHERE refund_status = 'Refunded'").get();
    const totalSaleInvoices = db.prepare("SELECT COUNT(*) as count FROM sale_invoices").get();

    const returnRate = totalSaleInvoices.count > 0
      ? ((totalReturns.count / totalSaleInvoices.count) * 100).toFixed(1)
      : 0;

    return {
      totalReturns: totalReturns.count,
      totalRefunded: totalRefunded.total,
      pendingReturns: pendingReturns.count,
      completedReturns: completedReturns.count,
      returnRate: parseFloat(returnRate),
    };
  });

  ipcMain.handle("db:saleReturns:create", async (event, returnData) => {
    const stmt = db.prepare(`
      INSERT INTO sale_returns (
        return_invoice_no, return_date, return_time,
        original_sale_invoice_id, original_sale_invoice_no,
        customer_name, customer_contact,
        items_subtotal, discount_percentage, discount_amount,
        tax_percentage, tax_amount, extra_charges_deduction, round_off,
        refund_total, refund_method, refund_amount, refund_status,
        return_reason, notes, created_by, stock_adjustment_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      returnData.return_invoice_no,
      returnData.return_date,
      returnData.return_time,
      returnData.original_sale_invoice_id,
      returnData.original_sale_invoice_no,
      returnData.customer_name,
      returnData.customer_contact,
      returnData.items_subtotal,
      returnData.discount_percentage,
      returnData.discount_amount,
      returnData.tax_percentage,
      returnData.tax_amount,
      returnData.extra_charges_deduction,
      returnData.round_off,
      returnData.refund_total,
      returnData.refund_method,
      returnData.refund_amount,
      returnData.refund_status,
      returnData.return_reason,
      returnData.notes,
      returnData.created_by,
      returnData.stock_adjustment_status
    );

    const returnId = result.lastInsertRowid;

    // Insert return items
    if (returnData.items && returnData.items.length > 0) {
      const insertItem = db.prepare(`
        INSERT INTO sale_return_items (
          sale_return_id, product_id, product_name, product_sku,
          company_name, batch_no, expiry_date,
          returned_quantity, unit_price, subtotal, return_reason
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      returnData.items.forEach((item) => {
        insertItem.run(
          returnId,
          item.product_id,
          item.product_name,
          item.product_sku,
          item.company_name,
          item.batch_no,
          item.expiry_date,
          item.returned_quantity,
          item.unit_price,
          item.subtotal,
          item.return_reason
        );

        // Update product stock (add back to stock for sale returns)
        if (returnData.stock_adjustment_status === 'Added back to stock' && item.product_id) {
          db.prepare("UPDATE products SET stock = stock + ? WHERE id = ?").run(
            item.returned_quantity,
            item.product_id
          );
        }
      });
    }

    return { id: returnId, return_invoice_no: returnData.return_invoice_no };
  });

  // ===== SETTINGS =====
  ipcMain.handle("db:settings:get", async (event, key) => {
    const setting = db.prepare("SELECT value FROM settings WHERE key = ?").get(key);
    return setting ? setting.value : null;
  });

  ipcMain.handle("db:settings:set", async (event, key, value) => {
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run(key, value);
    return { success: true };
  });
}

// App lifecycle
app.whenReady().then(() => {
  createDatabase();
  setupIpcHandlers();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (db) {
    db.close();
  }
  if (process.platform !== "darwin") {
    app.quit();
  }
});
