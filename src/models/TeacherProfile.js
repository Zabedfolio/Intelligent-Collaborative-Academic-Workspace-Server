const mongoose = require('mongoose');

const teacherProfileSchema = new mongoose.Schema(
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
      default: 'Department of Computer Science & Artificial Intelligence'
    },
    designation: {
      type: String,
      default: 'Associate Professor & AI Curriculum Chair'
    },
    officeHours: {
      type: String,
      default: 'Tue & Thu: 2:00 PM - 4:30 PM (Suite 402 / Zoom)'
    },
    coursesTaught: [
      {
        id: { type: String },
        code: { type: String },
        name: { type: String },
        semester: { type: String },
        studentsCount: { type: Number, default: 0 },
        ragStatus: { type: String, default: 'Active Grounding' },
        syllabusIndexed: { type: Boolean, default: true }
      }
    ]
  },
  {
    timestamps: true,
    collection: 'teacher_profiles'
  }
);

teacherProfileSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('TeacherProfile', teacherProfileSchema);
