import { Schema, model, Document, Types } from 'mongoose';

export interface IPeriod extends Document {
  userId: Types.ObjectId;
  periodNumber: number;
  name: string;
  academicYear: string;
  isActive: boolean;
  studentCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const periodSchema = new Schema<IPeriod>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  periodNumber: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  academicYear: {
    type: String,
    default: function() {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      // Academic year starts in August (month 7)
      return month >= 7 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  studentCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Compound index to ensure unique period numbers per user per academic year
periodSchema.index({ userId: 1, periodNumber: 1, academicYear: 1 }, { unique: true });
periodSchema.index({ userId: 1, isActive: 1 });

export const Period = model<IPeriod>('Period', periodSchema);
