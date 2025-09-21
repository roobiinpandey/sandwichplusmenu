const mongoose = require('mongoose');
const CategorySchema = new mongoose.Schema({
  name_en: { type: String, required: true, unique: true },
  name_ar: { type: String, default: '' }
});
module.exports = mongoose.models.Category || mongoose.model('Category', CategorySchema);
