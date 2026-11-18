const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema(
  {
    universityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'University',
      required: [true, 'University reference is required'],
      index: true
    },
    name: {
      type: String,
      required: [true, 'Department name is required'],
      trim: true
    },
    code: {
      type: String,
      required: [true, 'Department short code is required (e.g. CSE)'],
      uppercase: true,
      trim: true
    },
    head: {
      type: String,
      trim: true,
      default: 'To be appointed'
    },
    description: {
      type: String,
      trim: true
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

// Compound index so codes are unique per university
departmentSchema.index({ universityId: 1, code: 1 }, { unique: true });

module.exports = mongoose.models.Department || mongoose.model('Department', departmentSchema);

