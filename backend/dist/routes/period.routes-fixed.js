"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const Period_1 = require("../models/Period");
const mongoose_1 = __importDefault(require("mongoose"));
const router = (0, express_1.Router)();
// Helper function to validate ObjectId
const isValidObjectId = (id) => {
    return mongoose_1.default.Types.ObjectId.isValid(id);
};
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
        const userId = req.userId;
        console.log('Fetching periods for user:', userId);
        // Validate userId
        if (!userId || !isValidObjectId(userId)) {
            console.log('Invalid userId:', userId);
            return res.status(400).json({ error: 'Invalid user ID' });
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
exports.default = router;
//# sourceMappingURL=period.routes-fixed.js.map