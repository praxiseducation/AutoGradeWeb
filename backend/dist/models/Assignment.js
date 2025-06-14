"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Assignment = void 0;
const mongoose_1 = require("mongoose");
const assignmentSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['quiz', 'test', 'homework', 'other'],
        default: 'other'
    },
    periods: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Period'
        }],
    gradingScale: {
        type: [String],
        required: true,
        validate: {
            validator: function (v) {
                return v.length > 0 && v.length <= 5;
            },
            message: 'Grading scale must have between 1 and 5 options'
        }
    },
    includeStatus: {
        type: Boolean,
        default: true
    },
    totalPoints: {
        type: Number,
        min: 0
    },
    dueDate: Date
}, {
    timestamps: true
});
assignmentSchema.index({ userId: 1, createdAt: -1 });
assignmentSchema.index({ periods: 1 });
exports.Assignment = (0, mongoose_1.model)('Assignment', assignmentSchema);
//# sourceMappingURL=Assignment.js.map