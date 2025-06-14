import { Schema, model, Document, Types } from 'mongoose';

export interface IUser extends Document {
  email: string;
  name: string;
  googleId?: string;
  provider: 'google' | 'local';
  school?: string;
  role: 'teacher' | 'admin';
  isActive: boolean;
  settings: {
    defaultGradingScale: string[];
    defaultPeriods: number[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  googleId: {
    type: String,
    sparse: true,
    unique: true
  },
  provider: {
    type: String,
    enum: ['google', 'local'],
    default: 'google'
  },
  school: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: ['teacher', 'admin'],
    default: 'teacher'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  settings: {
    defaultGradingScale: {
      type: [String],
      default: ['10', '8.5', '7.5', '6.5', '5']
    },
    defaultPeriods: {
      type: [Number],
      default: [1, 2, 3, 4, 5, 6]
    }
  }
}, {
  timestamps: true
});

export const User = model<IUser>('User', userSchema);
