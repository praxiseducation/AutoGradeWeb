// routes/auth.routes.ts
import { Router } from 'express';
import { body } from 'express-validator';
import * as authController from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

// Register new user
router.post('/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('school').optional().trim()
  ],
  validateRequest,
  authController.register
);

// Login
router.post('/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ],
  validateRequest,
  authController.login
);

// Refresh token
router.post('/refresh-token',
  body('refreshToken').notEmpty(),
  validateRequest,
  authController.refreshToken
);

// Logout
router.post('/logout',
  authController.logout
);

// Forgot password
router.post('/forgot-password',
  body('email').isEmail().normalizeEmail(),
  validateRequest,
  authController.forgotPassword
);

// Reset password
router.post('/reset-password',
  [
    body('token').notEmpty(),
    body('password').isLength({ min: 6 })
  ],
  validateRequest,
  authController.resetPassword
);

// Verify email
router.get('/verify-email/:token',
  authController.verifyEmail
);

export default router;

// routes/roster.routes.ts
import { Router } from 'express';
import multer from 'multer';
import { body } from 'express-validator';
import * as rosterController from '../controllers/roster.controller';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV and Excel files are allowed.'));
    }
  }
});

// All routes require authentication
router.use(authenticate);

// Upload roster file
router.post('/upload',
  upload.single('roster'),
  [
    body('periodNumber').isInt({ min: 1, max: 10 }),
    body('academicYear').optional().matches(/^\d{4}-\d{4}$/)
  ],
  validateRequest,
  rosterController.uploadRoster
);

// Import from Google Sheets
router.post('/import-sheets',
  [
    body('spreadsheetId').notEmpty(),
    body('periodMappings').isArray()
  ],
  validateRequest,
  rosterController.importFromGoogleSheets
);

// Get roster for a period
router.get('/period/:periodId',
  rosterController.getRosterByPeriod
);

// Update roster (add/remove students)
router.put('/period/:periodId',
  [
    body('action').isIn(['add', 'remove']),
    body('students').isArray()
  ],
  validateRequest,
  rosterController.updateRoster
);

// Download roster template
router.get('/template',
  rosterController.downloadTemplate
);

export default router;

// routes/gradeSheet.routes.ts
import { Router } from 'express';
import { body, param } from 'express-validator';
import * as gradeSheetController from '../controllers/gradeSheet.controller';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

router.use(authenticate);

// Generate grade sheets
router.post('/generate',
  [
    body('assignmentName').trim().notEmpty(),
    body('periodIds').isArray().notEmpty(),
    body('gradingScale').isArray().isLength({ min: 1, max: 5 }),
    body('includeStatusOptions').optional().isBoolean()
  ],
  validateRequest,
  gradeSheetController.generateGradeSheets
);

// Get grade sheet by ID
router.get('/:id',
  param('id').isMongoId(),
  validateRequest,
  gradeSheetController.getGradeSheet
);

// Get all grade sheets for user
router.get('/',
  gradeSheetController.getUserGradeSheets
);

// Download grade sheet as PDF
router.get('/:id/download',
  param('id').isMongoId(),
  validateRequest,
  gradeSheetController.downloadGradeSheet
);

// Download multiple grade sheets as single PDF
router.post('/download-batch',
  body('gradeSheetIds').isArray().notEmpty(),
  validateRequest,
  gradeSheetController.downloadBatchGradeSheets
);

// Update grade sheet status
router.patch('/:id/status',
  [
    param('id').isMongoId(),
    body('status').isIn(['printed', 'scanned'])
  ],
  validateRequest,
  gradeSheetController.updateGradeSheetStatus
);

export default router;

// routes/processing.routes.ts
import { Router } from 'express';
import multer from 'multer';
import { body, param } from 'express-validator';
import * as processingController from '../controllers/processing.controller';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB for images
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG and PNG images are allowed.'));
    }
  }
});

router.use(authenticate);

// Upload and process scanned grade sheets
router.post('/upload',
  upload.array('gradeSheets', 50), // Max 50 images at once
  [
    body('ocrProvider').optional().isIn(['vision', 'claude']),
    body('gradeSheetIds').optional().isArray()
  ],
  validateRequest,
  processingController.uploadAndProcess
);

// Process grade sheets from URLs
router.post('/process-urls',
  [
    body('imageUrls').isArray().notEmpty(),
    body('gradeSheetIds').isArray(),
    body('ocrProvider').optional().isIn(['vision', 'claude'])
  ],
  validateRequest,
  processingController.processFromUrls
);

// Get processing job status
router.get('/job/:jobId',
  param('jobId').isMongoId(),
  validateRequest,
  processingController.getJobStatus
);

// Get all processing jobs for user
router.get('/jobs',
  processingController.getUserJobs
);

// Retry failed job
router.post('/job/:jobId/retry',
  param('jobId').isMongoId(),
  validateRequest,
  processingController.retryJob
);

// Manual correction of OCR results
router.post('/job/:jobId/correct',
  [
    param('jobId').isMongoId(),
    body('corrections').isArray()
  ],
  validateRequest,
  processingController.correctResults
);

export default router;

// routes/export.routes.ts
import { Router } from 'express';
import { body, param, query } from 'express-validator';
import * as exportController from '../controllers/export.controller';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

router.use(authenticate);

// Export grades as CSV
router.get('/csv',
  [
    query('assignmentId').optional().isMongoId(),
    query('periodId').optional().isMongoId(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601()
  ],
  validateRequest,
  exportController.exportToCSV
);

// Export grades to Google Sheets
router.post('/google-sheets',
  [
    body('assignmentIds').isArray(),
    body('spreadsheetId').optional().isString(),
    body('createNew').optional().isBoolean()
  ],
  validateRequest,
  exportController.exportToGoogleSheets
);

// Export grade report as PDF
router.get('/pdf/report',
  [
    query('periodId').isMongoId(),
    query('studentId').optional().isMongoId(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601()
  ],
  validateRequest,
  exportController.exportGradeReport
);

// Get export history
router.get('/history',
  exportController.getExportHistory
);

// Download previous export
router.get('/download/:exportId',
  param('exportId').isMongoId(),
  validateRequest,
  exportController.downloadExport
);

export default router;

// routes/period.routes.ts
import { Router } from 'express';
import { body, param } from 'express-validator';
import * as periodController from '../controllers/period.controller';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

router.use(authenticate);

// Get all periods for user
router.get('/',
  periodController.getUserPeriods
);

// Get single period
router.get('/:id',
  param('id').isMongoId(),
  validateRequest,
  periodController.getPeriod
);

// Create new period
router.post('/',
  [
    body('periodNumber').isInt({ min: 1, max: 10 }),
    body('name').optional().trim(),
    body('academicYear').optional().matches(/^\d{4}-\d{4}$/)
  ],
  validateRequest,
  periodController.createPeriod
);

// Update period
router.put('/:id',
  [
    param('id').isMongoId(),
    body('name').optional().trim(),
    body('isActive').optional().isBoolean()
  ],
  validateRequest,
  periodController.updatePeriod
);

// Delete period (soft delete)
router.delete('/:id',
  param('id').isMongoId(),
  validateRequest,
  periodController.deletePeriod
);

// Get period statistics
router.get('/:id/stats',
  param('id').isMongoId(),
  validateRequest,
  periodController.getPeriodStats
);

export default router;

// routes/student.routes.ts
import { Router } from 'express';
import { body, param } from 'express-validator';
import * as studentController from '../controllers/student.controller';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

router.use(authenticate);

// Get all students
router.get('/',
  studentController.getAllStudents
);

// Get single student
router.get('/:id',
  param('id').isMongoId(),
  validateRequest,
  studentController.getStudent
);

// Create student
router.post('/',
  [
    body('studentId').trim().notEmpty(),
    body('firstName').trim().notEmpty(),
    body('lastName').trim().notEmpty(),
    body('email').optional().isEmail(),
    body('periodIds').optional().isArray()
  ],
  validateRequest,
  studentController.createStudent
);

// Update student
router.put('/:id',
  [
    param('id').isMongoId(),
    body('firstName').optional().trim(),
    body('lastName').optional().trim(),
    body('email').optional().isEmail(),
    body('isActive').optional().isBoolean()
  ],
  validateRequest,
  studentController.updateStudent
);

// Delete student (soft delete)
router.delete('/:id',
  param('id').isMongoId(),
  validateRequest,
  studentController.deleteStudent
);

// Bulk operations
router.post('/bulk',
  [
    body('action').isIn(['create', 'update', 'delete']),
    body('students').isArray()
  ],
  validateRequest,
  studentController.bulkOperation
);

// Search students
router.get('/search',
  query('q').trim().notEmpty(),
  validateRequest,
  studentController.searchStudents
);

export default router;
