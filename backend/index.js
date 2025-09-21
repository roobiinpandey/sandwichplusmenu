// ...existing code...

// ...existing code...

// ...existing code...

// Import security and performance middleware
const applySecurity = require('./middleware/security');
// Import models (for mongoose connection)
require('./models/Order');
require('./models/MenuItem');
require('./models/Counter');
require('./models/User');
// Import routes
const ordersRoutes = require('./routes/orders');
const menuRoutes = require('./routes/menu');
const authRoutes = require('./routes/auth');
const healthRoutes = require('./health');

const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const logger = require('./logger');
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const multer = require('multer');


const app = express();
// Trust proxy for correct client IP detection (required for express-rate-limit)
app.set('trust proxy', 1);
app.use(cookieParser());
// Simple request logger to trace incoming requests
app.use((req, res, next) => {
  console.log('Incoming request:', req.method, req.path);
  next();
});

// CORS and JSON body parsing must be applied before route definitions
const allowedOrigins = [
  'http://localhost:3000', 
  'http://localhost:3001',
  'https://swp-frontend.onrender.com',
  'https://sandwichplusmenu.onrender.com'  // In case you use a custom domain
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
    return callback(new Error(msg), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());

// lightweight health check
app.get('/ping', (req, res) => res.json({ ok: true }));
app.get('/health', async (req, res) => {
  try {
    // Optionally check DB connection
    const dbStatus = (mongoose.connection.readyState === 1) ? 'connected' : 'disconnected';
    res.json({ status: 'ok', db: dbStatus });
  } catch (e) {
    res.status(500).json({ status: 'error', error: e.message });
  }
});

// Use User model compiled in ./models/User.js (required at top)
const User = mongoose.model('User');

// JWT middleware
const { authenticateToken } = require('./middleware/authenticate');

// API key middleware: checks x-api-key header or ADMIN_API_KEY env var
function checkApiKey(req, res, next) {
  const headerKey = req.headers['x-api-key'];
  const envKey = process.env.ADMIN_API_KEY;
  const key = headerKey || envKey;
  if (!key) return res.status(401).json({ error: 'No API key provided' });
  // if env key is set, require it; otherwise accept headerKey as valid (convenience)
  if (envKey && headerKey !== envKey) return res.status(403).json({ error: 'Invalid API key' });
  next();
}

// Register endpoint with validation
app.post('/auth/register',
  [
    body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  ],
  async (req, res) => {
  console.log('Register endpoint called. headers:', req.headers);
  console.log('Register endpoint body payload:', JSON.stringify(req.body));
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { username, password } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({ username, password: hashedPassword });
      await user.save();
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Registration failed' });
    }
  }
);


// Apply security and performance middleware
applySecurity(app);
// Use modular routes
app.use('/orders', ordersRoutes);
// Mount legacy menu item router on a different path to avoid conflict with the curated /menu endpoint
app.use('/menu', menuRoutes);
app.use('/auth', authRoutes);
app.use(healthRoutes);

// MongoDB connection using environment variable
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/swpdb';
console.log('Connecting to MongoDB at', mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@')); // Hide password in logs

// Connect to MongoDB with modern connection options
mongoose.connect(mongoUri)
  .then(() => {
    console.log('Connected to MongoDB successfully');
    // Ensure counters collection has a TTL index on expireAt for automatic cleanup
    try {
      const adminDb = mongoose.connection.db;
      adminDb.collection('counters').createIndex({ expireAt: 1 }, { expireAfterSeconds: 0 });
      console.log('Ensured TTL index on counters.expireAt');
    } catch (e) {
      console.log('Failed to ensure TTL index on counters:', e.message);
    }
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1); // Exit if cannot connect to database
  });

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.on('disconnected', () => {
  console.log('MongoDB disconnected');
});
db.on('reconnected', () => {
  console.log('MongoDB reconnected');
});

const imagesDir = path.join(__dirname, 'images');
const fs = require('fs');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir);
}

// Mongoose Schemas
// Category Schema
const CategorySchema = new mongoose.Schema({
  name_en: String,
  name_ar: String
});
const Category = mongoose.model('Category', CategorySchema);
// Order model is defined in ./models/Order.js
const Order = mongoose.model('Order');

// MenuItem model is defined in ./models/MenuItem.js
const MenuItem = mongoose.model('MenuItem');

// Multer setup for image upload (max 1MB)
const upload = multer({
  dest: imagesDir,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed!'));
    }
    cb(null, true);
  }
});

// Secure menu/category endpoints
app.get('/menu', async (req, res) => {
  try {
    const categories = await Category.find().lean();
    for (const cat of categories) {
      cat.items = await MenuItem.find({ category: cat.name_en }).lean();
    }
    res.json({ categories });
  } catch (err) {
    res.status(500).json({ error: 'Menu not found' });
  }
});


// Use categories router
app.use('/categories', require('./routes/categories'));

// POST /menu - add new menu item (admin only)

// GET /orders (protected)
// GET /orders - default to today's orders, newest-first; optional ?date=YYYYMMDD to fetch specific day
app.get('/orders', async (req, res) => {
  try {
    const qdate = req.query.date; // expected YYYYMMDD
    const targetDate = qdate || (() => {
      const d = new Date();
      return d.toISOString().slice(0,10).replace(/-/g,'');
    })();
    const orders = await Order.find({ orderDate: targetDate }).sort({ time: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Orders not found' });
  }
});

// GET single order by id (supports both /orders/:id and /order/:id)
app.get(['/orders/:id', '/order/:id'], async (req, res) => {
  try {
    const id = req.params.id;
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch order', details: err.message });
  }
});

// Counter model is defined in ./models/Counter.js
const Counter = mongoose.model('Counter');

// POST /orders (add new order) - public during development (no auth)
app.post('/orders',
  [
    body('customer').isLength({ min: 1 }).withMessage('Customer name is required'),
    body('items').isArray({ min: 1 }).withMessage('Items must be a non-empty array'),
    body('total').isNumeric().withMessage('Total must be a number')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
  console.log('Received new order POST:', JSON.stringify(req.body).slice(0, 2000));
  // Full debug log for diagnosis
  try { console.log('Received new order RAW BODY:', req.body); } catch (e) {}
  // compute orderDate YYYYMMDD for dashboard compatibility
  const now = new Date();
  const orderDate = now.toISOString().slice(0,10).replace(/-/g,''); // YYYYMMDD
      // Use an atomic counter in the 'counters' collection to generate a per-day sequence
      // This avoids race conditions under concurrent order creation.
      const adminDb = mongoose.connection.db;
      const counterId = `orders-${orderDate}`;
      // Set counters to expire after 90 days from creation to avoid unbounded growth
      const retentionMs = 90 * 24 * 60 * 60 * 1000; // 90 days
      const expireAt = new Date(Date.now() + retentionMs);
      // Try to atomically increment the per-day counter. Different MongoDB driver versions
      // return different shapes from findOneAndUpdate, so handle both cases and fall back to
      // reading the document after the update if necessary.
      // Helper: attempt to atomically increment and return the incremented seq.
      // Different driver versions return different shapes; be defensive and
      // fall back to updateOne+findOne when necessary.
      let seqNum;
      try {
        const seqDoc = await Counter.findOneAndUpdate(
          { _id: counterId },
          { $inc: { seq: 1 }, $setOnInsert: { createdAt: new Date(), expireAt } },
          { new: true, upsert: true }
        );
        // Log raw return shape for diagnosis
        console.log('findOneAndUpdate raw result for', counterId, seqDoc);
        seqNum = seqDoc ? seqDoc.seq : null;
      } catch (errFind) {
        console.warn('findOneAndUpdate failed for counters:', errFind && errFind.message);
      }

      // Fallback robust path: ensure we have an incremented seq by using updateOne then read
      if (typeof seqNum !== 'number') {
        try {
          // attempt a plain updateOne (atomic $inc) with upsert, then read the document
          await Counter.updateOne(
            { _id: counterId },
            { $inc: { seq: 1 }, $setOnInsert: { createdAt: new Date(), expireAt } },
            { upsert: true }
          );
          const fetched = await Counter.findOne({ _id: counterId });
          seqNum = (fetched && typeof fetched.seq === 'number') ? fetched.seq : 1;
          console.log('Fallback fetched seq for', counterId, seqNum);
        } catch (errFallback) {
          console.error('Failed to increment/fetch counter in fallback path:', errFallback && errFallback.message);
          seqNum = 1; // safe default so order can still be created (but will risk duplicates)
        }
      }
      console.log('Generated seqNum for', counterId, seqNum);
  // Use 4 digits to allow up to 9999 orders per day without format break
  // Use numeric seq and padded display string
  const orderSeq = seqNum;
  const seq = String(orderSeq).padStart(3, '0');
  const orderNumber = `${seq}-${orderDate}`;
      // Explicitly pick phone and notes to ensure they are persisted
      const newOrderData = {
        customer: req.body.customer,
        phone: req.body.phone || '',
        notes: req.body.notes || '',
        items: req.body.items,
        total: req.body.total,
        time: new Date(),
        orderDate,
        orderNumber,
        orderSeq,
        status: req.body.status || 'pending'
      };
      // Save order with simple retry on duplicate-key (E11000) which may happen under high contention
      const MAX_SAVE_RETRIES = 3;
      let saveErr = null;
      let savedOrder = null;
      for (let attempt = 1; attempt <= MAX_SAVE_RETRIES; attempt++) {
        try {
          const order = new Order(newOrderData);
          savedOrder = await order.save();
          break; // success
        } catch (err) {
          saveErr = err;
          // Duplicate key (race) - retry a few times
          if (err && err.code === 11000 && attempt < MAX_SAVE_RETRIES) {
            console.warn('Duplicate key when saving order, retrying...', attempt);
            await new Promise(r => setTimeout(r, 50 * attempt));
            continue;
          }
          // non-retryable or out of attempts
          console.error('Failed to save order:', err && err.message);
          return res.status(500).json({ error: 'Failed to save order', details: err && err.message });
        }
      }
      if (!savedOrder) {
        return res.status(500).json({ error: 'Failed to save order', details: saveErr && saveErr.message });
      }
      return res.json({ success: true, id: savedOrder._id, orderNumber: savedOrder.orderNumber });
    } catch (err) {
      console.error('Unhandled error in POST /orders:', err && err.message);
      return res.status(500).json({ error: 'Failed to create order', details: err && err.message });
    }
  }
);

// PUT /menu/:id (update menu item)
app.put('/menu/:id', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const itemId = req.params.id;
    let item = await MenuItem.findOne({ id: itemId });
    if (!item) return res.status(404).json({ error: 'Menu item not found' });

    // Parse fields from form-data
    const hasSizes = req.body.has_sizes === 'true' || req.body.has_sizes === true;
    let sizes = [];
    if (req.body.sizes) {
      try {
        sizes = typeof req.body.sizes === 'string' ? JSON.parse(req.body.sizes) : req.body.sizes;
      } catch (e) {
        return res.status(400).json({ error: 'Invalid sizes format' });
      }
    }
    const name_en = req.body.name_en;
    const name_ar = req.body.name_ar;
    const price = req.body.price;
    const mainCategory = req.body.category;
    const subcategory = req.body.subcategory;
    const description_en = req.body.description_en;
    const description_ar = req.body.description_ar;

    // Handle image upload
    let images = item.images || [];
    if (req.file) {
      images = ['/images/' + req.file.filename];
    }

    // Update fields
    item.name_en = name_en;
    item.name_ar = name_ar;
    item.price = price || null;
    item.images = images;
    item.has_sizes = hasSizes;
    item.sizes = sizes;
    item.category = mainCategory;
    item.subcategory = subcategory;
    item.description_en = description_en;
    item.description_ar = description_ar;

    // If category changed, ensure it exists
    if (mainCategory && mainCategory !== item.category) {
      let newCategory = await Category.findOne({ name_en: mainCategory });
      if (!newCategory) {
        newCategory = new Category({ name_en: mainCategory, name_ar: mainCategory });
        await newCategory.save();
      }
    }

    await item.save();
    res.json({ success: true, item });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update item', details: err.message });
  }
});

// Serve images statically
app.use('/images', express.static(imagesDir));

// Debug endpoint to show all categories and menu items (moved here so models exist)
app.get('/debug-menu', async (req, res) => {
  try {
    const categories = await Category.find().lean();
    const items = await MenuItem.find().lean();
    try {
      const adminDb = mongoose.connection.db;
      const catCount = await adminDb.collection('categories').countDocuments();
      const itemCount = await adminDb.collection('menuitems').countDocuments();
      console.log(`/debug-menu called: Category model returned ${categories.length}, raw categories ${catCount}; MenuItem model returned ${items.length}, raw menuitems ${itemCount}`);
    } catch (e) {
      console.log('Error checking raw collections in /debug-menu:', e.message);
    }
    res.json({ categories, items });
  } catch (err) {
    res.status(500).json({ error: 'Debug menu fetch failed', details: err.message });
  }
});

// Native driver endpoints to bypass Mongoose and inspect raw collections
app.get('/raw-categories', async (req, res) => {
  try {
    const adminDb = mongoose.connection.db;
    const docs = await adminDb.collection('categories').find({}).toArray();
    res.json({ count: docs.length, docs });
  } catch (err) {
    res.status(500).json({ error: 'raw-categories failed', details: err.message });
  }
});

app.get('/raw-menuitems', async (req, res) => {
  try {
    const adminDb = mongoose.connection.db;
    const docs = await adminDb.collection('menuitems').find({}).toArray();
    res.json({ count: docs.length, docs });
  } catch (err) {
    res.status(500).json({ error: 'raw-menuitems failed', details: err.message });
  }
});

// Debug: inspect a counter document
app.get('/counters/:id', async (req, res) => {
  try {
    const adminDb = mongoose.connection.db;
    const id = req.params.id;
    const doc = await adminDb.collection('counters').findOne({ _id: id });
    if (!doc) return res.status(404).json({ error: 'Counter not found' });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read counter', details: err.message });
  }
});

// Simple DB stats endpoint to list collections and counts
app.get('/db-stats', async (req, res) => {
  try {
    const admin = mongoose.connection.db;
    const collections = await admin.listCollections().toArray();
    const result = {};
    for (const c of collections) {
      const name = c.name;
      const count = await admin.collection(name).countDocuments();
      result[name] = count;
    }
    res.json({ mongoUri, collections: result });
  } catch (err) {
    res.status(500).json({ error: 'DB stats failed', details: err.message });
  }
});

app.delete('/menu/:id', authenticateToken, async (req, res) => {
  try {
    const itemId = req.params.id;
    const item = await MenuItem.findOneAndDelete({ id: itemId });
    if (!item) return res.status(404).json({ error: 'Menu item not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

// Example usage of logger
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Add sample menu item if none exist
MenuItem.countDocuments().then(count => {
  if (count === 0) {
    const sampleItem = new MenuItem({
      id: '1',
      name_en: 'Coffee',
      name_ar: 'قهوة',
      price: 5,
      images: [],
      has_sizes: false,
      sizes: [],
      category: 'Beverages',
      description_en: 'Hot coffee',
      description_ar: 'قهوة ساخنة'
    });
    sampleItem.save().then(() => console.log('Sample menu item added'));
  }
});

// Add sample admin user if none exist
User.countDocuments({ username: 'admin' }).then(count => {
  if (count === 0) {
    bcrypt.hash('mscoffee@123', 10).then(hashedPassword => {
      const adminUser = new User({
        username: 'admin',
        password: hashedPassword,
        role: 'admin'
      });
      adminUser.save().then(() => console.log('Sample admin user added'));
    });
  }
});

const PORT = process.env.PORT || 3001;

// Add error handling for server startup
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✅ Server ready to accept connections`);
});

server.on('error', (error) => {
  console.error('❌ Server startup error:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    mongoose.connection.close();
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    mongoose.connection.close();
    process.exit(0);
  });
});
