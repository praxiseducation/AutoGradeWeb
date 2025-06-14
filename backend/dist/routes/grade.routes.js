"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const Grade_1 = require("../models/Grade");
const Assignment_1 = require("../models/Assignment");
const router = (0, express_1.Router)();
// Get grades for an assignment
router.get('/assignment/:assignmentId', auth_1.authenticateToken, async (req, res) => {
    try {
        // Verify assignment belongs to user
        const assignment = await Assignment_1.Assignment.findOne({
            _id: req.params.assignmentId,
            userId: req.user.id
        });
        if (!assignment) {
            return res.status(404).json({ error: 'Assignment not found' });
        }
        const grades = await Grade_1.Grade.find({
            assignmentId: req.params.assignmentId
        })
            .populate('studentId', 'firstName lastName studentId')
            .sort('studentId.lastName studentId.firstName');
        res.json(grades);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch grades' });
    }
});
// Update single grade
router.put('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { score, status } = req.body;
        const grade = await Grade_1.Grade.findOneAndUpdate({ _id: req.params.id, userId: req.user.id }, {
            score,
            status,
            isManuallyEdited: true,
            editedBy: req.user.id,
            editedAt: new Date()
        }, { new: true });
        if (!grade) {
            return res.status(404).json({ error: 'Grade not found' });
        }
        res.json(grade);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update grade' });
    }
});
// Bulk update grades (from scan processing)
router.post('/bulk', auth_1.authenticateToken, async (req, res) => {
    try {
        const { gradeSheetId, grades } = req.body;
        const operations = grades.map((g) => ({
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
        const result = await Grade_1.Grade.bulkWrite(operations);
        res.json({
            message: `Processed ${result.modifiedCount + result.upsertedCount} grades`,
            modified: result.modifiedCount,
            created: result.upsertedCount
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update grades' });
    }
});
// Export grades as CSV
router.get('/export/:assignmentId', auth_1.authenticateToken, async (req, res) => {
    try {
        const assignment = await Assignment_1.Assignment.findOne({
            _id: req.params.assignmentId,
            userId: req.user.id
        });
        if (!assignment) {
            return res.status(404).json({ error: 'Assignment not found' });
        }
        const grades = await Grade_1.Grade.find({
            assignmentId: req.params.assignmentId
        })
            .populate('studentId', 'firstName lastName studentId')
            .sort('studentId.lastName studentId.firstName');
        // Convert to CSV
        const csv = [
            'Student ID,First Name,Last Name,Score,Status',
            ...grades.map(g => {
                const student = g.studentId;
                return `${student.studentId},${student.firstName},${student.lastName},${g.score || ''},${g.status || ''}`;
            })
        ].join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${assignment.name}-grades.csv"`);
        res.send(csv);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to export grades' });
    }
});
exports.default = router;
//# sourceMappingURL=grade.routes.js.map