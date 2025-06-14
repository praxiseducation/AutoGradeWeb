"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const passport_1 = __importDefault(require("passport"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const router = (0, express_1.Router)();
// Google OAuth routes
router.get('/google', passport_1.default.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport_1.default.authenticate('google', { session: false }), (req, res) => {
    const user = req.user;
    // Generate JWT token
    const token = jsonwebtoken_1.default.sign({
        userId: user._id,
        email: user.email,
        role: user.role
    }, process.env.JWT_SECRET, { expiresIn: '7d' });
    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
});
// Get current user
router.get('/me', passport_1.default.authenticate('jwt', { session: false }), (req, res) => {
    res.json(req.user);
});
exports.default = router;
//# sourceMappingURL=auth.routes.js.map