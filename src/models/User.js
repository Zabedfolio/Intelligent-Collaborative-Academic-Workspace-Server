const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    emailVerified: {
      type: Boolean,
      default: false
    },
    image: {
      type: String,
      default: ''
    },
    role: {
      type: String,
      enum: ['student', 'teacher', 'admin'],
      default: 'student',
      index: true
    },
    department: {
      type: String,
      default: ''
    },
    semester: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['active', 'pending_approval', 'suspended'],
      default: 'active'
    },
    bio: {
      type: String,
      default: ''
    },
    skills: [
      {
        type: String
      }
    ],
    learningGoals: [
      {
        type: String
      }
    ],
    lastLoginAt: {
      type: Date
    }
  },
  {
    timestamps: true,
    collection: 'user' // Directly maps to Better Auth user collection
  }
);

// Method to return safe JSON without sensitive fields
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
