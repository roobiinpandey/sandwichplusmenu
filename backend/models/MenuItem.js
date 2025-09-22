const mongoose = require('mongoose');

const MenuItemSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name_en: { type: String, required: true, maxlength: 200 },
  name_ar: { type: String, required: true, maxlength: 200 },
  price: { type: Number, required: true, min: 0 },
  images: [{
    data: String, // Base64 data (consider moving to external storage)
    contentType: String
  }],
  has_sizes: { type: Boolean, default: false },
  sizes: [{
    size: String,
    price: Number,
    label_en: String,
    label_ar: String
  }],
  category: { type: String, required: true, maxlength: 100 },
  subcategory: { type: String, maxlength: 100 },
  description_en: { type: String, maxlength: 1000 },
  description_ar: { type: String, maxlength: 1000 },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

// Performance Indexes for MenuItem
MenuItemSchema.index({ category: 1, isActive: 1 }); // Menu page filtering
// Note: id field already has unique: true in schema, no need for separate index
MenuItemSchema.index({ category: 1, subcategory: 1, isActive: 1 }); // Advanced filtering
MenuItemSchema.index({ name_en: 1 }); // Search by English name
MenuItemSchema.index({ name_ar: 1 }); // Search by Arabic name
MenuItemSchema.index({ isActive: 1, category: 1 }); // Active items by category

// Text search index for menu search functionality
MenuItemSchema.index({ 
  name_en: 'text', 
  name_ar: 'text', 
  description_en: 'text', 
  description_ar: 'text' 
});

module.exports = mongoose.model('MenuItem', MenuItemSchema);
