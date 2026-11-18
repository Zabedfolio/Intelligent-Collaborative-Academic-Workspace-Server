const mongoose = require('mongoose');

const semesterSchema = new mongoose.Schema(
  {
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department reference is required'],
      index: true
    },
    name: {
      type: String,
      required: [true, 'Semester name is required (e.g. Fall 2026 Semester)'],
      trim: true
    },
    code: {
      type: String,
      required: [true, 'Semester code is required (e.g. FA26)'],
      uppercase: true,
      trim: true
    },
    termNumber: {
      type: Number,
      min: 1,
      max: 12,
      default: 1
    },
    academicYear: {
      type: String,
      trim: true,
      default: '2026–2027'
    },
    startDate: {
      type: Date
    },
    endDate: {
      type: Date
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

// Compound index so codes are unique per department
semesterSchema.index({ departmentId: 1, code: 1 }, { unique: true });

module.exports = mongoose.models.Semester || mongoose.model('Semester', semesterSchema);

