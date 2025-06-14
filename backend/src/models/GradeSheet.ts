import { Schema, model, Document, Types } from 'mongoose';

export interface IGradeSheet extends Document {
  userId: Types.ObjectId;
  assignmentId: Types.ObjectId;
  periodId: Types.ObjectId;
  status: 'generated' | 'printed' | 'scanned' | 'processing' | 'completed' | 'error';
  pdfUrl?: string;
  pageCount: number;
  generatedAt: Date;
  scannedAt?: Date;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const gradeSheetSchema = new Schema<IGradeSheet>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignmentId: {
    type: Schema.Types.ObjectId,
    ref: 'Assignment',
    required: true
  },
  periodId: {
    type: Schema.Types.ObjectId,
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

export const GradeSheet = model<IGradeSheet>('GradeSheet', gradeSheetSchema);
