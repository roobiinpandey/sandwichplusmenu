const mongoose = require('mongoose');
const Order = require('./models/Order');
const MenuItem = require('./models/MenuItem');

async function testPerformance() {
  try {
    console.log('🚀 Starting Database Performance Test...\n');
    
    await mongoose.connect('mongodb://localhost:27017/swpdb', {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxIdleTimeMS: 30000,
      waitQueueTimeoutMS: 5000,
      readPreference: 'primary',
      retryWrites: true,
      retryReads: true,
      compressors: 'zlib'
    });
    
    console.log('✅ Connected to MongoDB\n');
    
    // Test 1: Paginated Orders Query (with indexes)
    console.log('📊 Test 1: Paginated Orders Query');
    const startTime1 = Date.now();
    
    const pipeline = [
      { $sort: { orderDate: -1, time: -1 } },
      {
        $facet: {
          orders: [
            { $skip: 0 },
            { $limit: 25 }
          ],
          totalCount: [
            { $count: 'count' }
          ]
        }
      },
      {
        $project: {
          orders: 1,
          total: { $arrayElemAt: ['$totalCount.count', 0] }
        }
      }
    ];
    
    const result = await Order.aggregate(pipeline);
    const queryTime1 = Date.now() - startTime1;
    
    console.log(`⏱️  Query Time: ${queryTime1}ms`);
    console.log(`📄 Orders Retrieved: ${result[0]?.orders?.length || 0}`);
    console.log(`🎯 Total Orders: ${result[0]?.total || 0}\n`);
    
    // Test 2: Menu Items by Category (with indexes)
    console.log('📊 Test 2: Menu Items by Category');
    const startTime2 = Date.now();
    
    const menuItems = await MenuItem.find({ 
      category: 'Breakfast',
      isActive: true 
    }).limit(20);
    
    const queryTime2 = Date.now() - startTime2;
    console.log(`⏱️  Query Time: ${queryTime2}ms`);
    console.log(`📄 Menu Items Retrieved: ${menuItems.length}\n`);
    
    // Test 3: Order Status Filter (with indexes)
    console.log('📊 Test 3: Order Status Filter');
    const startTime3 = Date.now();
    
    const pendingOrders = await Order.find({ status: 'pending' })
      .sort({ time: -1 })
      .limit(10);
    
    const queryTime3 = Date.now() - startTime3;
    console.log(`⏱️  Query Time: ${queryTime3}ms`);
    console.log(`📄 Pending Orders: ${pendingOrders.length}\n`);
    
    // Test 4: Text Search on Menu Items
    console.log('📊 Test 4: Text Search on Menu Items');
    const startTime4 = Date.now();
    
    const searchResults = await MenuItem.find({
      $text: { $search: 'egg' }
    }).limit(10);
    
    const queryTime4 = Date.now() - startTime4;
    console.log(`⏱️  Search Time: ${queryTime4}ms`);
    console.log(`🔍 Search Results: ${searchResults.length}\n`);
    
    // Performance Summary
    console.log('🎉 Performance Test Complete!');
    console.log('================================');
    console.log(`📊 Paginated Orders: ${queryTime1}ms`);
    console.log(`🍽️  Menu by Category: ${queryTime2}ms`);
    console.log(`📋 Status Filter: ${queryTime3}ms`);
    console.log(`🔍 Text Search: ${queryTime4}ms`);
    console.log('================================');
    
    const avgTime = (queryTime1 + queryTime2 + queryTime3 + queryTime4) / 4;
    console.log(`⚡ Average Query Time: ${avgTime.toFixed(2)}ms`);
    
    if (avgTime < 50) {
      console.log('🚀 EXCELLENT: Database is optimized for high traffic!');
    } else if (avgTime < 100) {
      console.log('✅ GOOD: Database performance is acceptable');
    } else {
      console.log('⚠️  NEEDS IMPROVEMENT: Consider additional optimization');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testPerformance();
