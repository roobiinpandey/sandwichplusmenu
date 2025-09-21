// Script to import menu_simple.json categories and items into MongoDB
const mongoose = require('mongoose');
const fs = require('fs');

mongoose.connect('mongodb://localhost:27017/swpdb', { useNewUrlParser: true, useUnifiedTopology: true });

const CategorySchema = new mongoose.Schema({
  name_en: String,
  name_ar: String
});
const Category = mongoose.model('Category', CategorySchema);

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
const MenuItem = mongoose.model('MenuItem', MenuItemSchema);

async function importMenu() {
  try {
    // Clean import: remove all existing data first
    await Category.deleteMany({});
    await MenuItem.deleteMany({});
    let menu = JSON.parse(fs.readFileSync('menu_simple.json', 'utf8'));
    let categoryCount = 0;
    let itemCount = 0;
    // Support both array and object format
    if (Array.isArray(menu)) {
      for (const cat of menu) {
        await Category.updateOne(
          { name_en: cat.name_en },
          { name_en: cat.name_en, name_ar: cat.name_ar },
          { upsert: true }
        );
        console.log('Inserted category:', cat.name_en);
        categoryCount++;
        for (const item of cat.items) {
          await MenuItem.updateOne(
            { id: item.id },
            item,
            { upsert: true }
          );
          console.log('Inserted item:', item.name_en);
          itemCount++;
        }
      }
    } else if (menu.categories) {
      for (const cat of menu.categories) {
        await Category.updateOne(
          { name_en: cat.name_en },
          { name_en: cat.name_en, name_ar: cat.name_ar },
          { upsert: true }
        );
        console.log('Inserted category:', cat.name_en);
        categoryCount++;
        for (const item of cat.items) {
          await MenuItem.updateOne(
            { id: item.id },
            item,
            { upsert: true }
          );
          console.log('Inserted item:', item.name_en);
          itemCount++;
        }
      }
    }
    console.log(`Menu import complete: ${categoryCount} categories, ${itemCount} items imported.`);
  } catch (err) {
    console.error('Menu import failed:', err);
  } finally {
    mongoose.disconnect();
  }
}

importMenu();
