"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const auth_1 = require("../middleware/auth");
const csvParser_1 = require("../services/csvParser");
const Student_1 = require("../models/Student");
const Period_1 = require("../models/Period");
const router = (0, express_1.Router)();
// Configure multer for memory storage
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedMimes = ['text/csv', 'application/vnd.ms-excel', 'text/plain'];
        if (allowedMimes.includes(file.mimetype) || file.originalname.endsWith('.csv')) {
            cb(null, true);
        }
        else {
            cb(new Error('Only CSV files are allowed'));
        }
    }
});
// Preview CSV file
router.post('/roster/preview', auth_1.authenticateToken, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const preview = csvParser_1.CSVParserService.analyzeCSV(req.file.buffer);
        res.json({
            filename: req.file.originalname,
            size: req.file.size,
            preview
        });
    }
    catch (error) {
        res.status(400).json({ error: error.message || 'Failed to parse CSV' });
    }
});
// Process CSV with confirmed mapping
router.post('/roster/process', auth_1.authenticateToken, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const { periodId, mapping } = req.body;
        // Verify period exists and belongs to user
        const period = await Period_1.Period.findOne({
            _id: periodId,
            userId: req.user.id
        });
        if (!period) {
            return res.status(404).json({ error: 'Period not found' });
        }
        // Parse mapping from JSON string
        const columnMapping = typeof mapping === 'string' ? JSON.parse(mapping) : mapping;
        // Parse CSV with mapping
        const students = csvParser_1.CSVParserService.parseWithMapping(req.file.buffer, columnMapping);
        // Prepare students for insertion
        const studentsToInsert = students.map(s => ({
            userId: req.user.id,
            periodId,
            studentId: s.studentId,
            firstName: s.firstName,
            lastName: s.lastName,
            email: s.email
        }));
        // Insert students (skip duplicates)
        let inserted = 0;
        let skipped = 0;
        for (const student of studentsToInsert) {
            try {
                await Student_1.Student.create(student);
                inserted++;
            }
            catch (error) {
                if (error.code === 11000) {
                    skipped++;
                }
                else {
                    throw error;
                }
            }
        }
        // Update student count
        const totalStudents = await Student_1.Student.countDocuments({ periodId, isActive: true });
        await Period_1.Period.findByIdAndUpdate(periodId, { studentCount: totalStudents });
        res.json({
            message: `Successfully processed ${inserted} students`,
            inserted,
            skipped,
            total: students.length
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Failed to process roster' });
    }
});
// Upload scanned grade sheets
router.post('/scans', auth_1.authenticateToken, upload.array('files', 10), async (req, res) => {
    try {
        if (!req.files || !Array.isArray(req.files)) {
            return res.status(400).json({ error: 'No files uploaded' });
        }
        const uploadedFiles = req.files.map(file => ({
            filename: file.originalname,
            size: file.size,
            buffer: file.buffer
        }));
        // TODO: Process scanned images
        res.json({
            message: `${uploadedFiles.length} files uploaded successfully`,
            files: uploadedFiles.map(f => ({
                filename: f.filename,
                size: f.size
            }))
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Upload failed' });
    }
});
exports.default = router;
//# sourceMappingURL=upload.routes.js.map