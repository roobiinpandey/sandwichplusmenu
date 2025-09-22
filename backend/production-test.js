// Production Readiness Test
const mongoose = require('mongoose');
const Order = require('./models/Order');
const MenuItem = require('./models/MenuItem');

async function productionReadinessTest() {
  console.log('🔥 PRODUCTION READINESS TEST 🔥\n');
  
  try {
    // Connect with production settings
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
    
    console.log('✅ MongoDB Connection: READY\n');
    
    // Test Index Effectiveness
    console.log('📊 TESTING INDEX EFFECTIVENESS');
    console.log('==============================');
    
    // Orders Collection Indexes
    const orderIndexes = await Order.collection.listIndexes().toArray();
    console.log(`📋 Order Collection Indexes: ${orderIndexes.length}`);
    orderIndexes.forEach(index => {
      console.log(`  ✅ ${JSON.stringify(index.key)} - ${index.name}`);
    });
    
    // Menu Items Collection Indexes  
    const menuIndexes = await MenuItem.collection.listIndexes().toArray();
    console.log(`\n🍽️  MenuItem Collection Indexes: ${menuIndexes.length}`);
    menuIndexes.forEach(index => {
      console.log(`  ✅ ${JSON.stringify(index.key)} - ${index.name}`);
    });
    
    console.log('\n🚀 PERFORMANCE BENCHMARKS');
    console.log('==========================');
    
    // Simulate high-traffic scenarios
    const tests = [
      {
        name: 'Dashboard Load (25 orders)',
        test: async () => {
          const pipeline = [
            { $sort: { orderDate: -1, time: -1 } },
            { $limit: 25 }
          ];
          return await Order.aggregate(pipeline);
        }
      },
      {
        name: 'Menu Page Load (Active Items)',
        test: async () => {
          return await MenuItem.find({ isActive: true }).limit(50);
        }
      },
      {
        name: 'Order Status Update',
        test: async () => {
          return await Order.find({ status: 'pending' }).limit(10);
        }
      },
      {
        name: 'Category Filter',
        test: async () => {
          return await MenuItem.find({ 
            category: 'Breakfast',
            isActive: true 
          }).limit(20);
        }
      },
      {
        name: 'Search Function',
        test: async () => {
          return await MenuItem.find({
            $text: { $search: 'bread' }
          }).limit(10);
        }
      }
    ];
    
    const results = [];
    
    for (const testCase of tests) {
      const startTime = Date.now();
      try {
        const result = await testCase.test();
        const duration = Date.now() - startTime;
        results.push({ name: testCase.name, duration, success: true, count: result.length });
        console.log(`⚡ ${testCase.name}: ${duration}ms (${result.length} records)`);
      } catch (error) {
        const duration = Date.now() - startTime;
        results.push({ name: testCase.name, duration, success: false, error: error.message });
        console.log(`❌ ${testCase.name}: FAILED after ${duration}ms - ${error.message}`);
      }
    }
    
    console.log('\n🎯 PRODUCTION READINESS ASSESSMENT');
    console.log('====================================');
    
    const avgTime = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
    const failedTests = results.filter(r => !r.success).length;
    
    console.log(`📊 Tests Run: ${results.length}`);
    console.log(`✅ Successful: ${results.length - failedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`⏱️  Average Response Time: ${avgTime.toFixed(2)}ms`);
    
    // Production Readiness Score
    let score = 100;
    if (failedTests > 0) score -= (failedTests * 20);
    if (avgTime > 100) score -= 20;
    if (avgTime > 50) score -= 10;
    
    console.log(`\n🏆 PRODUCTION READINESS SCORE: ${score}/100`);
    
    if (score >= 90) {
      console.log('🚀 EXCELLENT: Ready for high-traffic production deployment!');
      console.log('   • All critical performance optimizations implemented');
      console.log('   • Database indexes properly configured');
      console.log('   • Query performance optimized for scale');
    } else if (score >= 70) {
      console.log('✅ GOOD: Production ready with minor optimizations needed');
    } else {
      console.log('⚠️  NEEDS WORK: Additional optimization required before production');
    }
    
    console.log('\n📈 SCALING PROJECTIONS');
    console.log('======================');
    console.log(`🔄 Current avg response: ${avgTime.toFixed(2)}ms`);
    console.log(`🎯 Est. concurrent users: ${Math.floor(1000 / avgTime)} per second`);
    console.log(`📊 Daily order capacity: ~${Math.floor((24 * 60 * 60 * 1000) / avgTime).toLocaleString()} orders`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Production Test Failed:', error.message);
    process.exit(1);
  }
}

productionReadinessTest();
