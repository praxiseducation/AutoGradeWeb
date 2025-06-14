const mongoose = require('mongoose');
require('dotenv').config();

async function createTestData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/autograde');
    console.log('✅ Connected to MongoDB');
    
    // Define Period schema
    const periodSchema = new mongoose.Schema({
      userId: mongoose.Schema.Types.ObjectId,
      periodNumber: Number,
      name: String,
      studentCount: { type: Number, default: 0 },
      academicYear: String,
      isActive: { type: Boolean, default: true }
    }, { timestamps: true });
    
    const Period = mongoose.model('Period', periodSchema);
    
    // Use the same test user ID as in auth middleware
    const testUserId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');
    
    // Check if any periods exist for this user
    const existingPeriods = await Period.find({ userId: testUserId });
    console.log(`📊 Existing periods for test user: ${existingPeriods.length}`);
    
    if (existingPeriods.length === 0) {
      // Create test periods
      const periods = [
        { periodNumber: 1, name: 'Period 1 - Math' },
        { periodNumber: 2, name: 'Period 2 - Science' },
        { periodNumber: 3, name: 'Period 3 - English' }
      ];
      
      for (const p of periods) {
        const period = new Period({
          userId: testUserId,
          periodNumber: p.periodNumber,
          name: p.name,
          studentCount: 0,
          academicYear: '2024-2025',
          isActive: true
        });
        
        await period.save();
        console.log('✅ Created:', period.name);
      }
    }
    
    // Show all periods
    const allPeriods = await Period.find({ userId: testUserId });
    console.log('\n📋 All periods for test user:');
    allPeriods.forEach(p => {
      console.log(`  - ${p.name} (${p.studentCount} students)`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createTestData();
