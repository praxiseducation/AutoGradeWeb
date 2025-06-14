"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = require("mongoose");
const userSchema = new mongoose_1.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    googleId: {
        type: String,
        sparse: true,
        unique: true
    },
    provider: {
        type: String,
        enum: ['google', 'local'],
        default: 'google'
    },
    school: {
        type: String,
        trim: true
    },
    role: {
        type: String,
        enum: ['teacher', 'admin'],
        default: 'teacher'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    settings: {
        defaultGradingScale: {
            type: [String],
            default: ['10', '8.5', '7.5', '6.5', '5']
        },
        defaultPeriods: {
            type: [Number],
            default: [1, 2, 3, 4, 5, 6]
        }
    }
}, {
    timestamps: true
});
exports.User = (0, mongoose_1.model)('User', userSchema);
//# sourceMappingURL=User.js.map