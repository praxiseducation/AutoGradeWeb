import { Schema, model, Document, Types } from 'mongoose';

export interface IStudent extends Document {
  userId: Types.ObjectId;
  periodId: Types.ObjectId;
  studentId: string;
  firstName: string;
  lastName: string;
  email?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  getFullName(): string;
}

const studentSchema = new Schema<IStudent>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  periodId: {
    type: Schema.Types.ObjectId,
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
studentSchema.methods.getFullName = function(): string {
  return `${this.firstName} ${this.lastName}`;
};

export const Student = model<IStudent>('Student', studentSchema);
