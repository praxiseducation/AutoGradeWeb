"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Student = void 0;
const mongoose_1 = require("mongoose");
const studentSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    periodId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Period',
        required: true
    },
    studentId: {
        type: String,
        required: true,
        trim: true
    },
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        lowercase: true,
        trim: true,
        sparse: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});
// Compound index to ensure unique student IDs per user
studentSchema.index({ userId: 1, studentId: 1 }, { unique: true });
studentSchema.index({ periodId: 1, isActive: 1 });
studentSchema.index({ userId: 1, lastName: 1, firstName: 1 });
// Virtual for full name
studentSchema.methods.getFullName = function () {
    return `${this.firstName} ${this.lastName}`;
};
exports.Student = (0, mongoose_1.model)('Student', studentSchema);
//# sourceMappingURL=Student.js.map