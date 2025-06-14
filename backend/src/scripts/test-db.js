const mongoose = require('mongoose');
require('dotenv').config();

async function testDB() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/autograde');
    console.log('✅ Connected to MongoDB');
    
    // Create a test period
    const Period = mongoose.model('Period', {
      userId: mongoose.Schema.Types.ObjectId,
      periodNumber: Number,
      name: String,
      studentCount: { type: Number, default: 0 },
      isActive: { type: Boolean, default: true }
    });
    
    // Use the same test user ID as in auth middleware
    const testUserId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');
    
    // Check if any periods exist for this user
    const existingPeriods = await Period.find({ userId: testUserId });
    console.log(`📊 Existing periods for test user: ${existingPeriods.length}`);
    
    if (existingPeriods.length === 0) {
      // Create a test period
      const testPeriod = new Period({
        userId: testUserId,
        periodNumber: 1,
        name: 'Period 1',
        studentCount: 0,
        isActive: true
      });
      
      await testPeriod.save();
      console.log('✅ Test period created:', testPeriod);
    }
    
    // Find all periods for test user
    const periods = await Period.find({ userId: testUserId });
    console.log(`📋 All periods for test user:`, periods);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testDB();
