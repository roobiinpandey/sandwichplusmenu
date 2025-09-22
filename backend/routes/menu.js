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

// Cache for emergency performance
let menuCache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 60000; // 1 minute cache

// GET /menu - EMERGENCY ULTRA-FAST VERSION with caching
router.get('/', async (req, res) => {
  try {
    const now = Date.now();
    
    // Return cached data if available and fresh
    if (menuCache && (now - cacheTimestamp) < CACHE_DURATION) {
      console.log('[ULTRA-FAST-MENU] Serving from cache');
      return res.json(menuCache);
    }
    
    console.log('[ULTRA-FAST-MENU] Starting fresh fetch...');
    const startTime = Date.now();
    
    // Ultra-simple query with minimal data
    const items = await MenuItem.find({}, 'name_en name_ar price category').lean().limit(50);
    console.log(`[ULTRA-FAST-MENU] Query completed in ${Date.now() - startTime}ms`);
    
    // Minimal processing
    const categoriesMap = {};
    
    items.forEach(item => {
      const cat = item.category || 'Other';
      if (!categoriesMap[cat]) {
        categoriesMap[cat] = { name_en: cat, name_ar: cat, items: [] };
      }
      categoriesMap[cat].items.push(item);
    });
    
    const result = Object.values(categoriesMap).filter(cat => cat.items.length > 0);
    
    // Cache the result
    menuCache = { categories: result };
    cacheTimestamp = now;
    
    console.log(`[ULTRA-FAST-MENU] Total time: ${Date.now() - startTime}ms`);
    res.json(menuCache);
    
  } catch (error) {
    console.error('[ULTRA-FAST-MENU] Error:', error);
    res.status(500).json({ error: 'Failed to fetch menu', details: error.message });
  }
});

// POST /menu - add new menu item (admin only)
router.post('/', verifyToken, upload.single('image'), async (req, res) => {
  try {
    const { name_en, name_ar, price, category, subcategory, sizes } = req.body;
    
    if (!name_en || !name_ar || !price || !category) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let processedSizes = [];
    if (sizes && sizes !== 'undefined') {
      try {
        processedSizes = JSON.parse(sizes);
      } catch (e) {
        console.log('Failed to parse sizes, using empty array');
      }
    }

    const menuItem = new MenuItem({
      name_en,
      name_ar,
      price: Number(price),
      category,
      subcategory: subcategory || '',
      sizes: processedSizes
    });

    if (req.file) {
      const imageBuffer = fs.readFileSync(req.file.path);
      const base64Image = imageBuffer.toString('base64');
      const mimeType = req.file.mimetype || 'image/jpeg';
      menuItem.image = `data:${mimeType};base64,${base64Image}`;
      
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
    }

    await menuItem.save();
    res.status(201).json({ success: true, item: menuItem });
  } catch (error) {
    console.error('Error adding menu item:', error);
    res.status(500).json({ error: 'Failed to add menu item', details: error.message });
  }
});

// PUT /menu/:id - update menu item (admin only)
router.put('/:id', verifyToken, upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name_en, name_ar, price, category, subcategory, sizes } = req.body;
    
    const updateData = {
      name_en,
      name_ar,
      price: Number(price),
      category,
      subcategory: subcategory || ''
    };

    if (sizes && sizes !== 'undefined') {
      try {
        updateData.sizes = JSON.parse(sizes);
      } catch (e) {
        console.log('Failed to parse sizes, keeping existing');
      }
    }

    if (req.file) {
      const imageBuffer = fs.readFileSync(req.file.path);
      const base64Image = imageBuffer.toString('base64');
      const mimeType = req.file.mimetype || 'image/jpeg';
      updateData.image = `data:${mimeType};base64,${base64Image}`;
      
      fs.unlinkSync(req.file.path);
    }

    const updatedItem = await MenuItem.findByIdAndUpdate(id, updateData, { new: true });
    
    if (!updatedItem) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    res.json({ success: true, item: updatedItem });
  } catch (error) {
    console.error('Error updating menu item:', error);
    res.status(500).json({ error: 'Failed to update menu item', details: error.message });
  }
});

// DELETE /menu/:id - delete menu item (admin only)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const deletedItem = await MenuItem.findByIdAndDelete(id);
    
    if (!deletedItem) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    res.json({ success: true, message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    res.status(500).json({ error: 'Failed to delete menu item', details: error.message });
  }
});

module.exports = router;
