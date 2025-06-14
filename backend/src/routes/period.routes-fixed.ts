import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { Period } from '../models/Period';
import { Student } from '../models/Student';
import mongoose from 'mongoose';

const router = Router();

// Helper function to validate ObjectId
const isValidObjectId = (id: string): boolean => {
  return mongoose.Types.ObjectId.isValid(id);
};

// Test endpoint (no auth required)
router.get('/test', async (req: Request, res: Response) => {
  try {
    const count = await Period.countDocuments();
    res.json({ 
      message: 'API is working!', 
      timestamp: new Date(),
      periodCount: count 
    });
  } catch (error: any) {
    res.json({ 
      message: 'API is working but DB connection failed', 
      error: error.message 
    });
  }
});

// Get all periods for the user
router.get('/', authenticateToken as any, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    console.log('Fetching periods for user:', userId);
    
    // Validate userId
    if (!userId || !isValidObjectId(userId)) {
      console.log('Invalid userId:', userId);
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    const periods = await Period.find({ 
      userId: userId,
      isActive: true 
    }).sort('periodNumber');
    
    console.log(`Found ${periods.length} periods`);
    res.json(periods);
  } catch (error: any) {
    console.error('Error fetching periods:', error);
    res.status(500).json({
      error: 'Failed to fetch periods',
      message: error.message
    });
  }
});

export default router;
