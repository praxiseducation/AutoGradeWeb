import { Schema, model, Document, Types } from 'mongoose';

export interface IProcessingJob extends Document {
  userId: Types.ObjectId;
  gradeSheetId: Types.ObjectId;
  imageUrls: string[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
  results?: {
    totalProcessed: number;
    successCount: number;
    errorCount: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const processingJobSchema = new Schema<IProcessingJob>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  gradeSheetId: {
    type: Schema.Types.ObjectId,
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

export const ProcessingJob = model<IProcessingJob>('ProcessingJob', processingJobSchema);
