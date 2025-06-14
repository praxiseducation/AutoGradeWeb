import { Request, Response } from 'express';
import { Router } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import { Assignment } from '../models/Assignment';
import { GradeSheet } from '../models/GradeSheet';
import { Period } from '../models/Period';


const router = Router();

// Get all assignments
router.get('/', authenticateToken as any, async (req: Request, res: Response) => {
  try {
    const assignments = await Assignment.find({ 
      userId: req.user.id 
    })
    .populate('periods', 'name periodNumber')
    .sort('-createdAt');
    
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// Get single assignment
router.get('/:id', authenticateToken as any, async (req: Request, res: Response) => {
  try {
    const assignment = await Assignment.findOne({
      _id: req.params.id,
      userId: req.user.id
    }).populate('periods', 'name periodNumber');
    
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    
    res.json(assignment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch assignment' });
  }
});

// Create assignment and generate grade sheets
router.post('/', authenticateToken as any, async (req: Request, res: Response) => {
  try {
    const { name, type, periods, gradingScale, includeStatus } = req.body;
    
    // Verify all periods belong to the user
    const validPeriods = await Period.find({
      _id: { $in: periods },
      userId: req.user.id
    });
    
    if (validPeriods.length !== periods.length) {
      return res.status(400).json({ error: 'Invalid periods selected' });
    }
    
    // Create assignment
    const assignment = new Assignment({
      userId: req.user.id,
      name,
      type,
      periods,
      gradingScale,
      includeStatus
    });
    
    await assignment.save();
    
    // Create grade sheets for each period
    const gradeSheets = await Promise.all(
      periods.map((periodId: string) => {
        const gradeSheet = new GradeSheet({
          userId: req.user.id,
          assignmentId: assignment._id,
          periodId
        });
        return gradeSheet.save();
      })
    );
    
    res.status(201).json({ 
      assignment,
      gradeSheets: gradeSheets.length,
      message: `Created assignment with ${gradeSheets.length} grade sheets`
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create assignment' });
  }
});

// Get grade sheets for an assignment
router.get('/:id/gradesheets', authenticateToken as any, async (req: Request, res: Response) => {
  try {
    const assignment = await Assignment.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    
    const gradeSheets = await GradeSheet.find({
      assignmentId: assignment._id
    }).populate('periodId', 'name periodNumber');
    
    res.json(gradeSheets);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch grade sheets' });
  }
});

export default router;
