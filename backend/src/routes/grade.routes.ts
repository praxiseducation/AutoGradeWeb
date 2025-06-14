import { Request, Response } from 'express';
import { Router } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import { Grade } from '../models/Grade';
import { Student } from '../models/Student';
import { Assignment } from '../models/Assignment';


const router = Router();

// Get grades for an assignment
router.get('/assignment/:assignmentId', authenticateToken as any, async (req: Request, res: Response) => {
  try {
    // Verify assignment belongs to user
    const assignment = await Assignment.findOne({
      _id: req.params.assignmentId,
      userId: req.user.id
    });
    
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    
    const grades = await Grade.find({
      assignmentId: req.params.assignmentId
    })
    .populate('studentId', 'firstName lastName studentId')
    .sort('studentId.lastName studentId.firstName');
    
    res.json(grades);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch grades' });
  }
});

// Update single grade
router.put('/:id', authenticateToken as any, async (req: Request, res: Response) => {
  try {
    const { score, status } = req.body;
    
    const grade = await Grade.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { 
        score,
        status,
        isManuallyEdited: true,
        editedBy: req.user.id,
        editedAt: new Date()
      },
      { new: true }
    );
    
    if (!grade) {
      return res.status(404).json({ error: 'Grade not found' });
    }
    
    res.json(grade);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update grade' });
  }
});

// Bulk update grades (from scan processing)
router.post('/bulk', authenticateToken as any, async (req: Request, res: Response) => {
  try {
    const { gradeSheetId, grades } = req.body;
    
    const operations = grades.map((g: any) => ({
      updateOne: {
        filter: { 
          studentId: g.studentId,
          assignmentId: g.assignmentId
        },
        update: {
          $set: {
            userId: req.user.id,
            gradeSheetId,
            score: g.score,
            status: g.status,
            isManuallyEdited: false
          }
        },
        upsert: true
      }
    }));
    
    const result = await Grade.bulkWrite(operations);
    
    res.json({ 
      message: `Processed ${result.modifiedCount + result.upsertedCount} grades`,
      modified: result.modifiedCount,
      created: result.upsertedCount
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update grades' });
  }
});

// Export grades as CSV
router.get('/export/:assignmentId', authenticateToken as any, async (req: Request, res: Response) => {
  try {
    const assignment = await Assignment.findOne({
      _id: req.params.assignmentId,
      userId: req.user.id
    });
    
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    
    const grades = await Grade.find({
      assignmentId: req.params.assignmentId
    })
    .populate('studentId', 'firstName lastName studentId')
    .sort('studentId.lastName studentId.firstName');
    
    // Convert to CSV
    const csv = [
      'Student ID,First Name,Last Name,Score,Status',
      ...grades.map(g => {
        const student = g.studentId as any;
        return `${student.studentId},${student.firstName},${student.lastName},${g.score || ''},${g.status || ''}`;
      })
    ].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${assignment.name}-grades.csv"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export grades' });
  }
});

export default router;
