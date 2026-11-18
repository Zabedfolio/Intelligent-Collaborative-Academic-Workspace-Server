const mongoose = require('mongoose');

const universitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'University name is required'],
      trim: true
    },
    code: {
      type: String,
      required: [true, 'University short code is required'],
      unique: true,
      uppercase: true,
      trim: true
    },
    fullName: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      default: 'Bangladesh',
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

module.exports = mongoose.models.University || mongoose.model('University', universitySchema);

