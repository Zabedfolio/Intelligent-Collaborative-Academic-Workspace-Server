const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const TeacherProfile = require('../models/TeacherProfile');
const {
  updateProfileSchema,
  availabilitySchema,
  lastScopeSchema
} = require('../validations/profileValidation');

/**
 * GET /api/v1/users/profile
 * Fetches extended student or teacher profile data for the authenticated user
 */
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role || 'student';

    // Fetch base user account
    let user = await User.findById(userId);
    if (!user) {
      // In case Better-Auth created the user with string ID
      user = await User.findOne({ email: req.user.email });
    }

    if (role === 'teacher') {
      let teacherProfile = await TeacherProfile.findOne({ userId });
      if (!teacherProfile) {
        teacherProfile = await TeacherProfile.create({
          userId,
          departmentName: user?.department || 'Department of Computer Science & Artificial Intelligence',
          designation: 'Associate Professor & AI Curriculum Chair'
        });
      }

      return res.json({
        success: true,
        user: {
          id: userId,
          name: req.user.name,
          email: req.user.email,
          role: 'teacher',
          image: req.user.image || '',
          bio: user?.bio || '',
          department: teacherProfile.departmentName,
          designation: teacherProfile.designation,
          officeHours: teacherProfile.officeHours,
          coursesTaught: teacherProfile.coursesTaught || []
        },
        profile: teacherProfile.toSafeObject()
      });
    }

    // Default to student
    let studentProfile = await StudentProfile.findOne({ userId });
    if (!studentProfile) {
      studentProfile = await StudentProfile.create({
        userId,
        departmentName: user?.department || 'Department of Computer Science & Engineering',
        currentSemesterName: user?.semester || 'Fall 2026',
        skills: [
          { tag: 'Python', confidence: 90 },
          { tag: 'Data Structures', confidence: 85 },
          { tag: 'Machine Learning', confidence: 80 }
        ],
        goals: [
          'Score an A grade in CS401 Machine Learning',
          'Master RAG vector retrieval pipelines and dense embeddings',
          'Form an active weekly peer review study group'
        ],
        availability: [
          { day: 1, slots: [18, 19, 20] }, // Mon 6-9 PM
          { day: 2, slots: [18, 19, 20] }, // Tue 6-9 PM
          { day: 3, slots: [18, 19, 20] }, // Wed 6-9 PM
          { day: 4, slots: [18, 19, 20] }, // Thu 6-9 PM
          { day: 6, slots: [9, 10, 11] }   // Sat 9 AM-12 PM
        ],
        lastScope: {
          departmentId: 'cse',
          departmentName: 'Department of Computer Science & Engineering',
          semesterId: 'fall-2026',
          semesterName: 'Fall 2026',
          courseId: 'cs401',
          courseName: 'Advanced Machine Learning & Neural Networks',
          examType: 'midterm'
        }
      });
    }

    return res.json({
      success: true,
      user: {
        id: userId,
        name: req.user.name,
        email: req.user.email,
        role: 'student',
        image: req.user.image || '',
        bio: user?.bio || '',
        department: studentProfile.departmentName,
        semester: studentProfile.currentSemesterName,
        skills: studentProfile.skills,
        goals: studentProfile.goals,
        availability: studentProfile.availability,
        lastScope: studentProfile.lastScope
      },
      profile: studentProfile.toSafeObject()
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return res.status(500).json({ success: false, error: 'Internal server error while fetching profile' });
  }
};

/**
 * PUT /api/v1/users/profile
 * Validates and updates user and student/teacher profile
 */
const updateProfile = async (req, res) => {
  try {
    const parseResult = updateProfileSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: parseResult.error.flatten().fieldErrors
      });
    }

    const userId = req.user.id;
    const role = req.user.role || 'student';
    const payload = parseResult.data;

    // Update base User record
    const userUpdate = {};
    if (payload.name) userUpdate.name = payload.name;
    if (payload.bio !== undefined) userUpdate.bio = payload.bio;
    if (payload.department) userUpdate.department = payload.department;
    if (payload.semester) userUpdate.semester = payload.semester;

    await User.findOneAndUpdate(
      { $or: [{ _id: userId }, { email: req.user.email }] },
      { $set: userUpdate },
      { new: true }
    );

    if (role === 'teacher') {
      const teacherUpdate = {};
      if (payload.department || payload.departmentName) {
        teacherUpdate.departmentName = payload.department || payload.departmentName;
      }
      if (payload.designation !== undefined) teacherUpdate.designation = payload.designation;
      if (payload.officeHours !== undefined) teacherUpdate.officeHours = payload.officeHours;
      if (payload.coursesTaught) teacherUpdate.coursesTaught = payload.coursesTaught;

      const updatedTeacher = await TeacherProfile.findOneAndUpdate(
        { userId },
        { $set: teacherUpdate },
        { new: true, upsert: true }
      );

      return res.json({
        success: true,
        message: 'Teacher profile updated successfully',
        profile: updatedTeacher.toSafeObject()
      });
    }

    // Student profile update
    const studentUpdate = {};
    if (payload.department || payload.departmentName) {
      studentUpdate.departmentName = payload.department || payload.departmentName;
    }
    if (payload.departmentId) studentUpdate.departmentId = payload.departmentId;
    if (payload.semester || payload.currentSemesterName) {
      studentUpdate.currentSemesterName = payload.semester || payload.currentSemesterName;
    }
    if (payload.currentSemesterId) studentUpdate.currentSemesterId = payload.currentSemesterId;

    if (payload.skills) {
      // Normalize skills array into [{ tag, confidence }]
      studentUpdate.skills = payload.skills.map((s) => {
        if (typeof s === 'string') return { tag: s, confidence: 80 };
        return { tag: s.tag, confidence: s.confidence !== undefined ? s.confidence : 80 };
      });
    }

    if (payload.goals || payload.learningGoals) {
      studentUpdate.goals = payload.goals || payload.learningGoals;
    }

    if (payload.lastScope) {
      studentUpdate.lastScope = payload.lastScope;
    }

    const updatedStudent = await StudentProfile.findOneAndUpdate(
      { userId },
      { $set: studentUpdate },
      { new: true, upsert: true }
    );

    return res.json({
      success: true,
      message: 'Student profile updated successfully',
      profile: updatedStudent.toSafeObject()
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({ success: false, error: 'Internal server error while updating profile' });
  }
};

/**
 * PUT /api/v1/users/availability
 * Updates weekly 7x24 availability matrix for collaborative study matching
 */
const updateAvailability = async (req, res) => {
  try {
    const parseResult = availabilitySchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid availability matrix format',
        details: parseResult.error.flatten().fieldErrors
      });
    }

    const userId = req.user.id;
    const { availability } = parseResult.data;

    // Clean and sort slots
    const normalizedAvailability = availability.map((daySlot) => ({
      day: daySlot.day,
      slots: Array.from(new Set(daySlot.slots)).sort((a, b) => a - b)
    }));

    const updatedProfile = await StudentProfile.findOneAndUpdate(
      { userId },
      { $set: { availability: normalizedAvailability } },
      { new: true, upsert: true }
    );

    return res.json({
      success: true,
      message: 'Availability matrix updated successfully',
      availability: updatedProfile.availability
    });
  } catch (error) {
    console.error('Error updating availability:', error);
    return res.status(500).json({ success: false, error: 'Internal server error while updating availability' });
  }
};

/**
 * PUT /api/v1/users/scope
 * Persists student's last selected academic scope (Department -> Semester -> Course -> Exam Target)
 */
const updateLastScope = async (req, res) => {
  try {
    const parseResult = lastScopeSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid scope data',
        details: parseResult.error.flatten().fieldErrors
      });
    }

    const userId = req.user.id;
    const scopeData = parseResult.data;

    const updatedProfile = await StudentProfile.findOneAndUpdate(
      { userId },
      { $set: { lastScope: scopeData } },
      { new: true, upsert: true }
    );

    return res.json({
      success: true,
      message: 'Active academic scope persisted successfully',
      lastScope: updatedProfile.lastScope
    });
  } catch (error) {
    console.error('Error updating lastScope:', error);
    return res.status(500).json({ success: false, error: 'Internal server error while updating last scope' });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updateAvailability,
  updateLastScope
};
