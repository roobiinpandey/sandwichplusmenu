const mongoose = require('mongoose');
require('dotenv').config();

// Import models to ensure schemas are registered
require('../models/Order');
require('../models/MenuItem');
require('../models/User');
require('../models/Category');

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/swpdb';

async function createIndexes() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });
    
    console.log('Connected to MongoDB successfully');
    
    // Get models
    const Order = mongoose.model('Order');
    const MenuItem = mongoose.model('MenuItem');
    
    console.log('\n📊 Creating indexes for Order collection...');
    
    // Order indexes - these will improve dashboard performance significantly
    await Order.collection.createIndex({ orderDate: 1, status: 1 });
    console.log('✅ Created index: orderDate + status');
    
    await Order.collection.createIndex({ time: -1 });
    console.log('✅ Created index: time (descending)');
    
    await Order.collection.createIndex({ status: 1, time: -1 });
    console.log('✅ Created index: status + time');
    
    await Order.collection.createIndex({ customer: 1 });
    console.log('✅ Created index: customer');
    
    await Order.collection.createIndex({ orderSeq: 1 });
    console.log('✅ Created index: orderSeq');
    
    await Order.collection.createIndex({ orderNumber: 1 });
    console.log('✅ Created index: orderNumber');
    
    // Compound index for dashboard queries
    await Order.collection.createIndex({ orderDate: 1, status: 1, time: -1 });
    console.log('✅ Created compound index: orderDate + status + time');
    
    console.log('\n🍽️ Creating indexes for MenuItem collection...');
    
    // MenuItem indexes - these will improve menu loading performance
    await MenuItem.collection.createIndex({ category: 1, isActive: 1 });
    console.log('✅ Created index: category + isActive');
    
    await MenuItem.collection.createIndex({ id: 1 });
    console.log('✅ Created index: id (unique)');
    
    await MenuItem.collection.createIndex({ category: 1, subcategory: 1, isActive: 1 });
    console.log('✅ Created index: category + subcategory + isActive');
    
    await MenuItem.collection.createIndex({ name_en: 1 });
    console.log('✅ Created index: name_en');
    
    await MenuItem.collection.createIndex({ name_ar: 1 });
    console.log('✅ Created index: name_ar');
    
    await MenuItem.collection.createIndex({ isActive: 1, category: 1 });
    console.log('✅ Created index: isActive + category');
    
    // Text search index for menu search functionality
    try {
      await MenuItem.collection.createIndex({ 
        name_en: 'text', 
        name_ar: 'text', 
        description_en: 'text', 
        description_ar: 'text' 
      });
      console.log('✅ Created text search index: names + descriptions');
    } catch (textIndexError) {
      console.log('⚠️ Text index creation failed (may already exist):', textIndexError.message);
    }
    
    console.log('\n📈 Analyzing index usage...');
    
    // Get index information
    const orderIndexes = await Order.collection.indexes();
    const menuIndexes = await MenuItem.collection.indexes();
    
    console.log(`\n📊 Order Collection Indexes (${orderIndexes.length}):`);
    orderIndexes.forEach(idx => {
      const keys = Object.keys(idx.key).map(k => `${k}: ${idx.key[k]}`).join(', ');
      console.log(`   • ${idx.name}: { ${keys} }`);
    });
    
    console.log(`\n🍽️ MenuItem Collection Indexes (${menuIndexes.length}):`);
    menuIndexes.forEach(idx => {
      const keys = Object.keys(idx.key).map(k => `${k}: ${idx.key[k]}`).join(', ');
      console.log(`   • ${idx.name}: { ${keys} }`);
    });
    
    console.log('\n✅ Index creation completed successfully!');
    console.log('\n💡 Performance Tips:');
    console.log('   • Dashboard queries will now be much faster');
    console.log('   • Menu loading will be optimized');
    console.log('   • Text search is enabled for menu items');
    console.log('   • Run this script again after major schema changes');
    
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the script
createIndexes();
