const express = require('express');
const router = express.Router();
const MenuItem = require('../models/MenuItem');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { verifyToken } = require('../controllers/authController');

// Setup multer for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../images'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// GET /menu - return all menu items
router.get('/', async (req, res) => {
  try {
    console.log('[MENU] Starting menu fetch...');
    const startTime = Date.now();
    
    // Get all categories from Category collection
    const allCategories = await require('../models/Category').find();
    console.log(`[MENU] Found ${allCategories.length} categories`);
    
    // Get all menu items  
    const items = await MenuItem.find();
    console.log(`[MENU] Found ${items.length} items in ${Date.now() - startTime}ms`);
    
    // Group items by category, include both name_en and name_ar
    const categoriesMap = {};
    items.forEach(item => {
      const cat = item.category || 'Uncategorized';
      // Find matching category object for name_en
      const catObj = allCategories.find(c => c.name_en === cat);
      if (!categoriesMap[cat]) {
        categoriesMap[cat] = {
          name_en: cat,
          name_ar: catObj ? catObj.name_ar : '',
          items: []
        };
      }
      categoriesMap[cat].items.push(item);
    });
    // Ensure all categories are present, even if empty
    allCategories.forEach(catObj => {
      const cat = catObj.name_en;
      if (!categoriesMap[cat]) {
        categoriesMap[cat] = {
          name_en: cat,
          name_ar: catObj.name_ar,
          items: []
        };
      }
    });
    let categories = Object.values(categoriesMap);
    // Guarantee 'HOT & COLD DRINKS' is last
    const hotCold = categories.filter(cat => cat.name_en === 'HOT & COLD DRINKS');
    categories = categories.filter(cat => cat.name_en !== 'HOT & COLD DRINKS');
    if (hotCold.length) categories.push(...hotCold);
    
    console.log(`[MENU] Returning ${categories.length} categories with ${categories.reduce((sum, cat) => sum + cat.items.length, 0)} total items`);
    res.json({ categories });
  } catch (err) {
    console.error('[MENU] Error:', err);
    res.status(500).json({ error: 'Failed to load menu', details: err.message });
  }
});

// GET /menu-basic - lightweight version for performance testing
router.get('/menu-basic', async (req, res) => {
  try {
    console.log('[MENU-BASIC] Starting basic menu fetch...');
    const startTime = Date.now();
    
    // Get all categories from Category collection
    const allCategories = await require('../models/Category').find();
    
    // Get limited fields for performance
    const items = await MenuItem.find({}, 'id name_en name_ar price category').lean();
    console.log(`[MENU-BASIC] Found ${items.length} items in ${Date.now() - startTime}ms`);
    
    // Group items by category
    const categoriesMap = {};
    items.forEach(item => {
      const cat = item.category || 'Uncategorized';
      const catObj = allCategories.find(c => c.name_en === cat);
      if (!categoriesMap[cat]) {
        categoriesMap[cat] = {
          name_en: cat,
          name_ar: catObj ? catObj.name_ar : '',
          items: []
        };
      }
      categoriesMap[cat].items.push(item);
    });
    
    // Ensure all categories are present
    allCategories.forEach(catObj => {
      const cat = catObj.name_en;
      if (!categoriesMap[cat]) {
        categoriesMap[cat] = {
          name_en: cat,
          name_ar: catObj.name_ar,
          items: []
        };
      }
    });
    
    let categories = Object.values(categoriesMap);
    res.json({ categories });
  } catch (err) {
    console.error('[MENU-BASIC] Error:', err);
    res.status(500).json({ error: 'Failed to load basic menu', details: err.message });
  }
});

// POST /menu - add a new menu item (supports multipart/form-data)
router.post('/', verifyToken, upload.single('image'), async (req, res) => {
    // Robustly parse has_sizes and sizes
    const hasSizes = req.body.has_sizes === 'true' || req.body.has_sizes === true;
    let sizes = [];
    if (req.body.sizes) {
      try {
        sizes = typeof req.body.sizes === 'string' ? JSON.parse(req.body.sizes) : req.body.sizes;
      } catch (e) {
        console.log('Sizes parse error:', req.body.sizes, e);
        return res.status(400).json({ error: 'Invalid sizes format' });
      }
    }
    // Debug log all received fields and parsed values
    console.log('POST /menu received:', {
      name_en: req.body.name_en,
      name_ar: req.body.name_ar,
      mainCategory: req.body.category,
      subcategory: req.body.subcategory,
      price: req.body.price,
      has_sizes: hasSizes,
      sizes,
      image: req.file ? req.file.filename : null
    });
  try {
    // Parse fields from form-data
    const name_en = req.body.name_en;
    const name_ar = req.body.name_ar;
    const price = req.body.price;
    const mainCategory = req.body.category;
    const subcategory = req.body.subcategory;
    const description_en = req.body.description_en;
    const description_ar = req.body.description_ar;

    // Validate required fields
    if (!name_en || !mainCategory || (!hasSizes && !price) || (hasSizes && (!sizes || !sizes.length))) {
      console.log('Validation failed:', {
        name_en,
        mainCategory,
        price,
        hasSizes,
        sizes
      });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // If hasSizes, ensure sizes array is valid
    if (hasSizes && (!sizes || !Array.isArray(sizes) || sizes.some(sz => !sz.size || !sz.price))) {
      return res.status(400).json({ error: 'Missing or invalid sizes for item with sizes' });
    }

    // Handle image upload - convert to base64 for persistent storage
    let images = [];
    if (req.file) {
      try {
        // Read the uploaded file and convert to base64
        const imageBuffer = fs.readFileSync(req.file.path);
        const base64Image = `data:${req.file.mimetype};base64,${imageBuffer.toString('base64')}`;
        images.push(base64Image);
        
        // Clean up the temporary file
        fs.unlinkSync(req.file.path);
      } catch (error) {
        console.error('Error processing image:', error);
        return res.status(500).json({ error: 'Failed to process image' });
      }
    }

    // Generate a unique id if not provided
    const id = req.body.id || String(Date.now()) + Math.floor(Math.random() * 10000);

    const newItem = new MenuItem({
      id,
      name_en,
      name_ar,
      price: price || null,
      images,
      has_sizes: hasSizes,
      sizes,
      category: mainCategory,
      subcategory,
      description_en,
      description_ar
    });
    await newItem.save();
    res.status(201).json({ success: true, item: newItem });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add item', details: err.message });
  }
});

// PUT /menu/:id - update an existing menu item
router.put('/:id', verifyToken, upload.single('image'), async (req, res) => {
  try {
    const itemId = req.params.id;
    
    // Robustly parse has_sizes and sizes
    const hasSizes = req.body.has_sizes === 'true' || req.body.has_sizes === true;
    let sizes = [];
    if (req.body.sizes) {
      try {
        sizes = typeof req.body.sizes === 'string' ? JSON.parse(req.body.sizes) : req.body.sizes;
      } catch (e) {
        console.log('Sizes parse error:', req.body.sizes, e);
        return res.status(400).json({ error: 'Invalid sizes format' });
      }
    }

    console.log('PUT /menu/:id received:', {
      id: itemId,
      name_en: req.body.name_en,
      name_ar: req.body.name_ar,
      mainCategory: req.body.category,
      subcategory: req.body.subcategory,
      price: req.body.price,
      has_sizes: hasSizes,
      sizes,
      image: req.file ? req.file.filename : null
    });

    // Parse fields from form-data
    const name_en = req.body.name_en;
    const name_ar = req.body.name_ar;
    const price = req.body.price;
    const mainCategory = req.body.category;
    const subcategory = req.body.subcategory;
    const description_en = req.body.description_en;
    const description_ar = req.body.description_ar;

    // Validate required fields
    if (!name_en || !mainCategory || (!hasSizes && !price) || (hasSizes && (!sizes || !sizes.length))) {
      console.log('Update validation failed:', {
        name_en,
        mainCategory,
        price,
        hasSizes,
        sizes
      });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // If hasSizes, ensure sizes array is valid
    if (hasSizes && (!sizes || !Array.isArray(sizes) || sizes.some(sz => !sz.size || !sz.price))) {
      return res.status(400).json({ error: 'Missing or invalid sizes for item with sizes' });
    }

    // Find the existing item
    const existingItem = await MenuItem.findOne({ id: itemId });
    if (!existingItem) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    // Handle image upload - convert to base64 for persistent storage
    let images = existingItem.images || []; // Keep existing images by default
    if (req.file) {
      try {
        // Read the uploaded file and convert to base64
        const imageBuffer = fs.readFileSync(req.file.path);
        const base64Image = `data:${req.file.mimetype};base64,${imageBuffer.toString('base64')}`;
        images = [base64Image]; // Replace existing images with new one
        
        // Clean up the temporary file
        fs.unlinkSync(req.file.path);
      } catch (error) {
        console.error('Error processing image:', error);
        return res.status(500).json({ error: 'Failed to process image' });
      }
    }

    // Update the item
    const updatedItem = await MenuItem.findOneAndUpdate(
      { id: itemId },
      {
        name_en,
        name_ar,
        price: price || null,
        images,
        has_sizes: hasSizes,
        sizes,
        category: mainCategory,
        subcategory,
        description_en,
        description_ar
      },
      { new: true }
    );

    res.json({ success: true, item: updatedItem });
  } catch (err) {
    console.error('Update menu item error:', err);
    res.status(500).json({ error: 'Failed to update item', details: err.message });
  }
});

// DELETE /menu/:id - delete a menu item
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const itemId = req.params.id;
    
    console.log('DELETE /menu/:id received:', {
      id: itemId
    });

    // Find and delete the item
    const deletedItem = await MenuItem.findOneAndDelete({ id: itemId });
    
    if (!deletedItem) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    console.log('Successfully deleted menu item:', deletedItem.name_en);
    res.json({ success: true, message: 'Item deleted successfully', item: deletedItem });
  } catch (err) {
    console.error('Delete menu item error:', err);
    res.status(500).json({ error: 'Failed to delete item', details: err.message });
  }
});

module.exports = router;
