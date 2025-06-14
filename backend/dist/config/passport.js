"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const User_1 = require("../models/User");
passport_1.default.use(new passport_google_oauth20_1.Strategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/auth/google/callback',
}, async (accessToken, refreshToken, profile, done) => {
    try {
        // Check if user exists
        let user = await User_1.User.findOne({ googleId: profile.id });
        if (user) {
            return done(null, {
                id: user._id.toString(),
                email: user.email,
                role: user.role || 'teacher'
            });
        }
        // Create new user
        const newUser = await User_1.User.create({
            googleId: profile.id,
            email: profile.emails?.[0]?.value || '',
            name: profile.displayName,
            provider: 'google'
        });
        return done(null, {
            id: newUser._id.toString(),
            email: newUser.email,
            role: newUser.role || 'teacher'
        });
    }
    catch (error) {
        return done(error, false);
    }
}));
passport_1.default.serializeUser((user, done) => {
    done(null, user.id);
});
passport_1.default.deserializeUser(async (id, done) => {
    try {
        const user = await User_1.User.findById(id);
        if (user) {
            done(null, {
                id: user._id.toString(),
                email: user.email,
                role: user.role || 'teacher'
            });
        }
        else {
            done(null, false);
        }
    }
    catch (error) {
        done(error, false);
    }
});
exports.default = passport_1.default;
//# sourceMappingURL=passport.js.map