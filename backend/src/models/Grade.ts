import { Schema, model, Document, Types } from 'mongoose';

export interface IGrade extends Document {
  userId: Types.ObjectId;
  studentId: Types.ObjectId;
  assignmentId: Types.ObjectId;
  gradeSheetId: Types.ObjectId;
  score?: string;
  status?: 'missing' | 'absent' | 'exempt';
  isManuallyEdited: boolean;
  editedBy?: Types.ObjectId;
  editedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const gradeSchema = new Schema<IGrade>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  assignmentId: {
    type: Schema.Types.ObjectId,
    ref: 'Assignment',
    required: true
  },
  gradeSheetId: {
    type: Schema.Types.ObjectId,
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
    type: Schema.Types.ObjectId,
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

export const Grade = model<IGrade>('Grade', gradeSchema);
