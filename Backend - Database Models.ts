// models/User.ts
import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  school?: string;
  role: 'teacher' | 'admin';
  isActive: boolean;
  isEmailVerified: boolean;
  settings: {
    defaultGradingScale: string[];
    defaultPeriods: number[];
  };
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  name: {
    type: String,
    required: true,
    trim: true
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
  isEmailVerified: {
    type: Boolean,
    default: false
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

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = model<IUser>('User', userSchema);

// models/Period.ts
import { Schema, model, Document, Types } from 'mongoose';

export interface IPeriod extends Document {
  userId: Types.ObjectId;
  periodNumber: number;
  name: string;
  students: Types.ObjectId[];
  isActive: boolean;
  academicYear: string;
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
    default: function() {
      return `Period ${this.periodNumber}`;
    }
  },
  students: [{
    type: Schema.Types.ObjectId,
    ref: 'Student'
  }],
  isActive: {
    type: Boolean,
    default: true
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
  }
}, {
  timestamps: true
});

// Compound index to ensure unique period numbers per user per academic year
periodSchema.index({ userId: 1, periodNumber: 1, academicYear: 1 }, { unique: true });

export const Period = model<IPeriod>('Period', periodSchema);

// models/Student.ts
import { Schema, model, Document, Types } from 'mongoose';

export interface IStudent extends Document {
  userId: Types.ObjectId;
  studentId: string;
  firstName: string;
  lastName: string;
  email?: string;
  periods: Types.ObjectId[];
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
    trim: true
  },
  periods: [{
    type: Schema.Types.ObjectId,
    ref: 'Period'
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index to ensure unique student IDs per user
studentSchema.index({ userId: 1, studentId: 1 }, { unique: true });

studentSchema.methods.getFullName = function(): string {
  return `${this.firstName} ${this.lastName}`;
};

export const Student = model<IStudent>('Student', studentSchema);

// models/Assignment.ts
import { Schema, model, Document, Types } from 'mongoose';

export interface IAssignment extends Document {
  userId: Types.ObjectId;
  name: string;
  periods: Types.ObjectId[];
  gradingScale: string[];
  statusOptions: string[];
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
  statusOptions: {
    type: [String],
    default: ['Missing', 'Absent', 'Exempt']
  }
}, {
  timestamps: true
});

export const Assignment = model<IAssignment>('Assignment', assignmentSchema);

// models/GradeSheet.ts
import { Schema, model, Document, Types } from 'mongoose';

export interface IGradeSheet extends Document {
  userId: Types.ObjectId;
  assignmentId: Types.ObjectId;
  periodId: Types.ObjectId;
  status: 'generated' | 'printed' | 'scanned' | 'processing' | 'completed' | 'error';
  templateUrl?: string;
  scannedImageUrl?: string;
  processedData?: Array<{
    studentId: string;
    score: string;
    status: string[];
  }>;
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
  templateUrl: String,
  scannedImageUrl: String,
  processedData: [{
    studentId: String,
    score: String,
    status: [String]
  }]
}, {
  timestamps: true
});

export const GradeSheet = model<IGradeSheet>('GradeSheet', gradeSheetSchema);

// models/ProcessingJob.ts
import { Schema, model, Document, Types } from 'mongoose';

export interface IProcessingJob extends Document {
  userId: Types.ObjectId;
  gradeSheetId: Types.ObjectId;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  imageUrl: string;
  ocrProvider: 'vision' | 'claude';
  result?: any;
  error?: string;
  attempts: number;
  startedAt?: Date;
  completedAt?: Date;
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
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  imageUrl: {
    type: String,
    required: true
  },
  ocrProvider: {
    type: String,
    enum: ['vision', 'claude'],
    default: 'vision'
  },
  result: Schema.Types.Mixed,
  error: String,
  attempts: {
    type: Number,
    default: 0
  },
  startedAt: Date,
  completedAt: Date
}, {
  timestamps: true
});

export const ProcessingJob = model<IProcessingJob>('ProcessingJob', processingJobSchema);
