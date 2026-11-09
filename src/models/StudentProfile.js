const mongoose = require('mongoose');

const studentProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: [true, 'User ID is required'],
      unique: true,
      index: true
    },
    departmentId: {
      type: String,
      default: 'cse'
    },
    departmentName: {
      type: String,
      default: 'Department of Computer Science & Engineering'
    },
    currentSemesterId: {
      type: String,
      default: 'fall-2026'
    },
    currentSemesterName: {
      type: String,
      default: 'Fall 2026'
    },
    skills: [
      {
        tag: { type: String, required: true },
        confidence: { type: Number, min: 0, max: 100, default: 80 }
      }
    ],
    goals: [
      {
        type: String,
        trim: true
      }
    ],
    // Weekly availability matrix: day 0-6 (0=Sun, 1=Mon ... 6=Sat), slots = array of active hours [0..23]
    availability: [
      {
        day: { type: Number, min: 0, max: 6 },
        slots: [{ type: Number, min: 0, max: 23 }]
      }
    ],
    lastScope: {
      departmentId: { type: String, default: 'cse' },
      departmentName: { type: String, default: 'Department of Computer Science & Engineering' },
      semesterId: { type: String, default: 'fall-2026' },
      semesterName: { type: String, default: 'Fall 2026' },
      courseId: { type: String, default: 'cs401' },
      courseName: { type: String, default: 'Advanced Machine Learning & Neural Networks' },
      examType: { type: String, enum: ['midterm', 'final'], default: 'midterm' }
    }
  },
  {
    timestamps: true,
    collection: 'student_profiles'
  }
);

studentProfileSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('StudentProfile', studentProfileSchema);
