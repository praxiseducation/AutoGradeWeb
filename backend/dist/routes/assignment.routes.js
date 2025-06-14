"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const Assignment_1 = require("../models/Assignment");
const GradeSheet_1 = require("../models/GradeSheet");
const Period_1 = require("../models/Period");
const router = (0, express_1.Router)();
// Get all assignments
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const assignments = await Assignment_1.Assignment.find({
            userId: req.user.id
        })
            .populate('periods', 'name periodNumber')
            .sort('-createdAt');
        res.json(assignments);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch assignments' });
    }
});
// Get single assignment
router.get('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const assignment = await Assignment_1.Assignment.findOne({
            _id: req.params.id,
            userId: req.user.id
        }).populate('periods', 'name periodNumber');
        if (!assignment) {
            return res.status(404).json({ error: 'Assignment not found' });
        }
        res.json(assignment);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch assignment' });
    }
});
// Create assignment and generate grade sheets
router.post('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const { name, type, periods, gradingScale, includeStatus } = req.body;
        // Verify all periods belong to the user
        const validPeriods = await Period_1.Period.find({
            _id: { $in: periods },
            userId: req.user.id
        });
        if (validPeriods.length !== periods.length) {
            return res.status(400).json({ error: 'Invalid periods selected' });
        }
        // Create assignment
        const assignment = new Assignment_1.Assignment({
            userId: req.user.id,
            name,
            type,
            periods,
            gradingScale,
            includeStatus
        });
        await assignment.save();
        // Create grade sheets for each period
        const gradeSheets = await Promise.all(periods.map((periodId) => {
            const gradeSheet = new GradeSheet_1.GradeSheet({
                userId: req.user.id,
                assignmentId: assignment._id,
                periodId
            });
            return gradeSheet.save();
        }));
        res.status(201).json({
            assignment,
            gradeSheets: gradeSheets.length,
            message: `Created assignment with ${gradeSheets.length} grade sheets`
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create assignment' });
    }
});
// Get grade sheets for an assignment
router.get('/:id/gradesheets', auth_1.authenticateToken, async (req, res) => {
    try {
        const assignment = await Assignment_1.Assignment.findOne({
            _id: req.params.id,
            userId: req.user.id
        });
        if (!assignment) {
            return res.status(404).json({ error: 'Assignment not found' });
        }
        const gradeSheets = await GradeSheet_1.GradeSheet.find({
            assignmentId: assignment._id
        }).populate('periodId', 'name periodNumber');
        res.json(gradeSheets);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch grade sheets' });
    }
});
exports.default = router;
//# sourceMappingURL=assignment.routes.js.map