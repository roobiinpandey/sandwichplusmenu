const mongoose = require('mongoose');

const MenuItemSchema = new mongoose.Schema({
  id: String,
  name_en: String,
  name_ar: String,
  price: Number,
  images: Array,
  has_sizes: Boolean,
  sizes: Array,
  category: String,
  subcategory: String,
  description_en: String,
  description_ar: String
});

module.exports = mongoose.model('MenuItem', MenuItemSchema);
