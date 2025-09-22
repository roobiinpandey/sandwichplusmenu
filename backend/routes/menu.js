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

// GET /menu - EMERGENCY FAST VERSION - return all menu items quickly
router.get('/', async (req, res) => {
  try {
    console.log('[FAST-MENU] Starting fast menu fetch...');
    const startTime = Date.now();
    
    // Simple fast query - get all items directly
    const items = await MenuItem.find().lean().limit(100);
    console.log(`[FAST-MENU] Found ${items.length} items in ${Date.now() - startTime}ms`);
    
    // Simple category grouping without complex lookups
    const categoriesMap = {};
    const categories = ['Hot Drinks', 'Cold Drinks', 'Breakfast Plus', 'Sandwiches', 'Salads', 'Sweets', 'Healthy', 'Pasta'];
    
    // Initialize categories
    categories.forEach(cat => {
      categoriesMap[cat] = { name_en: cat, name_ar: cat, items: [] };
    });
    
    // Group items by category
    items.forEach(item => {
      const cat = item.category || 'Uncategorized';
      if (!categoriesMap[cat]) {
        categoriesMap[cat] = { name_en: cat, name_ar: cat, items: [] };
      }
      categoriesMap[cat].items.push(item);
    });
    
    // Convert to array and filter out empty categories
    const result = Object.entries(categoriesMap)
      .filter(([_, catData]) => catData.items.length > 0)
      .map(([catName, catData]) => catData);
    
    console.log(`[FAST-MENU] Completed in ${Date.now() - startTime}ms`);
    res.json({ categories: result });
    
  } catch (error) {
    console.error('[FAST-MENU] Error:', error);
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
