"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcessingJob = void 0;
const mongoose_1 = require("mongoose");
const processingJobSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    gradeSheetId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'GradeSheet',
        required: true
    },
    imageUrls: [{
            type: String,
            required: true
        }],
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending'
    },
    progress: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    error: String,
    startedAt: Date,
    completedAt: Date,
    results: {
        totalProcessed: Number,
        successCount: Number,
        errorCount: Number
    }
}, {
    timestamps: true
});
processingJobSchema.index({ userId: 1, status: 1 });
processingJobSchema.index({ gradeSheetId: 1 });
exports.ProcessingJob = (0, mongoose_1.model)('ProcessingJob', processingJobSchema);
//# sourceMappingURL=ProcessingJob.js.map