const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    courseCode: {
      type: String,
      required: [true, 'Course code is required (e.g. CS401)'],
      uppercase: true,
      trim: true,
      index: true
    },
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    credits: {
      type: Number,
      default: 3,
      min: [1, 'Credits must be at least 1'],
      max: [6, 'Credits cannot exceed 6']
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department reference is required'],
      index: true
    },
    semesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Semester',
      required: [true, 'Semester reference is required'],
      index: true
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Instructor/Teacher reference is required'],
      index: true
    },
    enrolledStudentIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
      }
    ],
    contextLastUpdated: {
      type: Date,
      default: Date.now
    },
    aiConfig: {
      strictCourseMode: {
        type: Boolean,
        default: true
      },
      cumulativeFinalScope: {
        type: Boolean,
        default: false
      },
      maxContextTokens: {
        type: Number,
        default: 2500,
        min: 500,
        max: 6000
      }
    },
    active: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Compound index so course codes are unique within the same department & semester
courseSchema.index({ departmentId: 1, semesterId: 1, courseCode: 1 }, { unique: true });

module.exports = mongoose.models.Course || mongoose.model('Course', courseSchema);

