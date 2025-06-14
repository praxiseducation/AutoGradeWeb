"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const Student_1 = require("../models/Student");
const Period_1 = require("../models/Period");
const router = (0, express_1.Router)();
// Get all students for a period
router.get('/period/:periodId', auth_1.authenticateToken, async (req, res) => {
    try {
        // Verify the period belongs to the user
        const period = await Period_1.Period.findOne({
            _id: req.params.periodId,
            userId: req.user.id
        });
        if (!period) {
            return res.status(404).json({ error: 'Period not found' });
        }
        const students = await Student_1.Student.find({
            periodId: req.params.periodId,
            isActive: true
        }).sort('lastName firstName');
        res.json(students);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch students' });
    }
});
// Add single student
router.post('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const { periodId, studentId, firstName, lastName, email } = req.body;
        // Verify the period belongs to the user
        const period = await Period_1.Period.findOne({
            _id: periodId,
            userId: req.user.id
        });
        if (!period) {
            return res.status(404).json({ error: 'Period not found' });
        }
        const student = new Student_1.Student({
            userId: req.user.id,
            periodId,
            studentId,
            firstName,
            lastName,
            email
        });
        await student.save();
        // Update student count
        await Period_1.Period.findByIdAndUpdate(periodId, {
            $inc: { studentCount: 1 }
        });
        res.status(201).json(student);
    }
    catch (error) {
        if (error.code === 11000) {
            res.status(400).json({ error: 'Student ID already exists' });
        }
        else {
            res.status(500).json({ error: 'Failed to create student' });
        }
    }
});
// Bulk upload students
router.post('/bulk', auth_1.authenticateToken, async (req, res) => {
    try {
        const { periodId, students } = req.body;
        // Verify the period belongs to the user
        const period = await Period_1.Period.findOne({
            _id: periodId,
            userId: req.user.id
        });
        if (!period) {
            return res.status(404).json({ error: 'Period not found' });
        }
        const studentsToInsert = students.map((s) => ({
            userId: req.user.id,
            periodId,
            studentId: s.studentId,
            firstName: s.firstName,
            lastName: s.lastName,
            email: s.email
        }));
        // Insert students, ignoring duplicates
        const results = await Student_1.Student.insertMany(studentsToInsert, { ordered: false });
        // Update student count
        await Period_1.Period.findByIdAndUpdate(periodId, {
            studentCount: await Student_1.Student.countDocuments({ periodId, isActive: true })
        });
        res.status(201).json({
            message: `${results.length} students added successfully`,
            count: results.length
        });
    }
    catch (error) {
        if (error.code === 11000) {
            // Some duplicates, but others might have been inserted
            const inserted = error.insertedDocs?.length || 0;
            res.status(200).json({
                message: `${inserted} students added, some duplicates skipped`,
                count: inserted
            });
        }
        else {
            res.status(500).json({ error: 'Failed to upload students' });
        }
    }
});
// Update student
router.put('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { firstName, lastName, email } = req.body;
        const student = await Student_1.Student.findOneAndUpdate({ _id: req.params.id, userId: req.user.id }, { firstName, lastName, email }, { new: true });
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }
        res.json(student);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update student' });
    }
});
// Delete student
router.delete('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const student = await Student_1.Student.findOneAndUpdate({ _id: req.params.id, userId: req.user.id }, { isActive: false }, { new: true });
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }
        // Update student count
        await Period_1.Period.findByIdAndUpdate(student.periodId, {
            $inc: { studentCount: -1 }
        });
        res.json({ message: 'Student deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete student' });
    }
});
exports.default = router;
// Move students between periods
router.post('/move', auth_1.authenticateToken, async (req, res) => {
    try {
        const { studentIds, fromPeriodId, toPeriodId } = req.body;
        // Verify both periods belong to the user
        const [fromPeriod, toPeriod] = await Promise.all([
            Period_1.Period.findOne({ _id: fromPeriodId, userId: req.user.id }),
            Period_1.Period.findOne({ _id: toPeriodId, userId: req.user.id })
        ]);
        if (!fromPeriod || !toPeriod) {
            return res.status(404).json({ error: 'Period not found' });
        }
        // Update all students
        await Student_1.Student.updateMany({ _id: { $in: studentIds }, userId: req.user.id }, { periodId: toPeriodId });
        // Update student counts
        const [fromCount, toCount] = await Promise.all([
            Student_1.Student.countDocuments({ periodId: fromPeriodId, isActive: true }),
            Student_1.Student.countDocuments({ periodId: toPeriodId, isActive: true })
        ]);
        await Promise.all([
            Period_1.Period.findByIdAndUpdate(fromPeriodId, { studentCount: fromCount }),
            Period_1.Period.findByIdAndUpdate(toPeriodId, { studentCount: toCount })
        ]);
        res.json({
            message: `Successfully moved ${studentIds.length} students`,
            fromCount,
            toCount
        });
    }
    catch (error) {
        console.error('Error moving students:', error);
        res.status(500).json({ error: 'Failed to move students' });
    }
});
//# sourceMappingURL=student.routes.js.map