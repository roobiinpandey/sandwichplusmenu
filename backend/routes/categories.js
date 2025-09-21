const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authenticate');
const Category = require('../models/Category');
const MenuItem = require('../models/MenuItem');

// GET all categories (public for admin UI listing)
router.get('/', async (req, res) => {
  try {
    const cats = await Category.find().lean();
    res.json({ categories: cats });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// POST create category (admin only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name_en, name_ar } = req.body;
    if (!name_en) return res.status(400).json({ error: 'name_en required' });
    const exists = await Category.findOne({ name_en });
    if (exists) return res.status(409).json({ error: 'Category already exists' });
    const c = new Category({ name_en, name_ar: name_ar || name_en });
    await c.save();
    res.json({ success: true, category: c });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// PUT update category name (admin only). If name_en changes, update MenuItem.category values.
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const id = req.params.id;
    const { name_en, name_ar } = req.body;
    const cat = await Category.findById(id);
    if (!cat) return res.status(404).json({ error: 'Category not found' });
    const oldName = cat.name_en;
    if (name_en) cat.name_en = name_en;
    if (name_ar) cat.name_ar = name_ar;
    await cat.save();
    if (name_en && name_en !== oldName) {
      // Update menu items that used the old category name
      await MenuItem.updateMany({ category: oldName }, { $set: { category: name_en } });
    }
    res.json({ success: true, category: cat });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// DELETE category (admin only). Option: remove category and set affected menu items to empty or a fallback.
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const id = req.params.id;
    const { reassignTo } = req.body || {};
    const cat = await Category.findByIdAndDelete(id);
    if (!cat) return res.status(404).json({ error: 'Category not found' });
    if (reassignTo && typeof reassignTo === 'string' && reassignTo.trim()) {
      // reassign affected items to new category name
      await MenuItem.updateMany({ category: cat.name_en }, { $set: { category: reassignTo } });
    } else {
      // default: clear category field
      await MenuItem.updateMany({ category: cat.name_en }, { $set: { category: '' } });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

module.exports = router;
