"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const Period_1 = require("../models/Period");
const Student_1 = require("../models/Student");
const router = (0, express_1.Router)();
// Test endpoint (no auth required)
router.get('/test', async (req, res) => {
    try {
        const count = await Period_1.Period.countDocuments();
        res.json({
            message: 'API is working!',
            timestamp: new Date(),
            periodCount: count
        });
    }
    catch (error) {
        res.json({
            message: 'API is working but DB connection failed',
            error: error.message
        });
    }
});
// Get all periods for the user
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const authReq = req;
        const userId = authReq.userId;
        console.log('Fetching periods for user:', userId);
        // Check if userId is a valid MongoDB ObjectId format
        if (!userId || typeof userId !== 'string' || !userId.match(/^[0-9a-fA-F]{24}$/)) {
            console.log('Invalid userId format:', userId);
            return res.status(400).json({
                error: 'Invalid user ID format',
                message: 'User ID must be a valid MongoDB ObjectId'
            });
        }
        const periods = await Period_1.Period.find({
            userId: userId,
            isActive: true
        }).sort('periodNumber');
        console.log(`Found ${periods.length} periods`);
        res.json(periods);
    }
    catch (error) {
        console.error('Error fetching periods:', error);
        res.status(500).json({
            error: 'Failed to fetch periods',
            message: error.message
        });
    }
});
// Get single period
router.get('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const authReq = req;
        const userId = authReq.userId;
        const periodId = req.params.id;
        // Validate both IDs
        if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/) || !periodId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ error: 'Invalid ID format' });
        }
        const period = await Period_1.Period.findOne({
            _id: periodId,
            userId: userId
        });
        if (!period) {
            return res.status(404).json({ error: 'Period not found' });
        }
        res.json(period);
    }
    catch (error) {
        console.error('Error fetching period:', error);
        res.status(500).json({ error: 'Failed to fetch period' });
    }
});
// Create period
router.post('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const authReq = req;
        const userId = authReq.userId;
        // Validate userId
        if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ error: 'Invalid user ID format' });
        }
        const period = new Period_1.Period({
            userId: userId,
            periodNumber: req.body.periodNumber,
            name: req.body.name || `Period ${req.body.periodNumber}`,
            students: [],
            isActive: true
        });
        await period.save();
        res.status(201).json(period);
    }
    catch (error) {
        console.error('Error creating period:', error);
        res.status(500).json({ error: 'Failed to create period' });
    }
});
// Update period
router.put('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const authReq = req;
        const userId = authReq.userId;
        const periodId = req.params.id;
        // Validate IDs
        if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/) || !periodId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ error: 'Invalid ID format' });
        }
        const period = await Period_1.Period.findOneAndUpdate({ _id: periodId, userId: userId }, { name: req.body.name }, { new: true });
        if (!period) {
            return res.status(404).json({ error: 'Period not found' });
        }
        res.json(period);
    }
    catch (error) {
        console.error('Error updating period:', error);
        res.status(500).json({ error: 'Failed to update period' });
    }
});
// Delete period (soft delete)
router.delete('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const authReq = req;
        const userId = authReq.userId;
        const periodId = req.params.id;
        // Validate IDs
        if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/) || !periodId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ error: 'Invalid ID format' });
        }
        const period = await Period_1.Period.findOneAndUpdate({ _id: periodId, userId: userId }, { isActive: false }, { new: true });
        if (!period) {
            return res.status(404).json({ error: 'Period not found' });
        }
        // Also deactivate all students in this period
        await Student_1.Student.updateMany({ periodId: period._id }, { isActive: false });
        res.json({ message: 'Period deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting period:', error);
        res.status(500).json({ error: 'Failed to delete period' });
    }
});
exports.default = router;
//# sourceMappingURL=period.routes.js.map