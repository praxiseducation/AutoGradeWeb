"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GradeSheet = void 0;
const mongoose_1 = require("mongoose");
const gradeSheetSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    assignmentId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Assignment',
        required: true
    },
    periodId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Period',
        required: true
    },
    status: {
        type: String,
        enum: ['generated', 'printed', 'scanned', 'processing', 'completed', 'error'],
        default: 'generated'
    },
    pdfUrl: String,
    pageCount: {
        type: Number,
        default: 1
    },
    generatedAt: {
        type: Date,
        default: Date.now
    },
    scannedAt: Date,
    processedAt: Date
}, {
    timestamps: true
});
gradeSheetSchema.index({ userId: 1, status: 1 });
gradeSheetSchema.index({ assignmentId: 1, periodId: 1 });
exports.GradeSheet = (0, mongoose_1.model)('GradeSheet', gradeSheetSchema);
//# sourceMappingURL=GradeSheet.js.map