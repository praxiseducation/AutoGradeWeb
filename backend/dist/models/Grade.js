"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Grade = void 0;
const mongoose_1 = require("mongoose");
const gradeSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    studentId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    assignmentId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Assignment',
        required: true
    },
    gradeSheetId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'GradeSheet',
        required: true
    },
    score: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['missing', 'absent', 'exempt']
    },
    isManuallyEdited: {
        type: Boolean,
        default: false
    },
    editedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User'
    },
    editedAt: Date
}, {
    timestamps: true
});
// Ensure one grade per student per assignment
gradeSchema.index({ studentId: 1, assignmentId: 1 }, { unique: true });
gradeSchema.index({ userId: 1, assignmentId: 1 });
gradeSchema.index({ gradeSheetId: 1 });
exports.Grade = (0, mongoose_1.model)('Grade', gradeSchema);
//# sourceMappingURL=Grade.js.map