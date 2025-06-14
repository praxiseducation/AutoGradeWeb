import { Schema, model, Document, Types } from 'mongoose';

export interface IAssignment extends Document {
  userId: Types.ObjectId;
  name: string;
  type: 'quiz' | 'test' | 'homework' | 'other';
  periods: Types.ObjectId[];
  gradingScale: string[];
  includeStatus: boolean;
  totalPoints?: number;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const assignmentSchema = new Schema<IAssignment>({
  userId: {
    type: Schema.Types.ObjectId,
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
    type: Schema.Types.ObjectId,
    ref: 'Period'
  }],
  gradingScale: {
    type: [String],
    required: true,
    validate: {
      validator: function(v: string[]) {
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

export const Assignment = model<IAssignment>('Assignment', assignmentSchema);
