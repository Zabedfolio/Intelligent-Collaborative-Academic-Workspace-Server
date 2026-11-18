const Course = require('../models/Course');
const Department = require('../models/Department');
const Semester = require('../models/Semester');
const User = require('../models/User');
const {
  createCourseSchema,
  updateCourseSchema,
  updateAIConfigSchema,
  enrollStudentsSchema
} = require('../validations/courseValidation');

/**
 * GET /api/v1/courses
 * List all active courses with optional filtering
 */
const getCourses = async (req, res) => {
  try {
    const { departmentId, semesterId, teacherId, myEnrollments } = req.query;
    const filter = { active: true };

    if (departmentId) filter.departmentId = departmentId;
    if (semesterId) filter.semesterId = semesterId;
    if (teacherId) filter.teacherId = teacherId;

    if (myEnrollments && req.user) {
      filter.enrolledStudentIds = req.user.id;
    }

    const courses = await Course.find(filter)
      .populate('departmentId', 'name code')
      .populate('semesterId', 'name code academicYear')
      .populate('teacherId', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    const formatted = courses.map((c) => ({
      ...c,
      id: c._id.toString(),
      code: c.courseCode,
      name: c.title,
      enrolledCount: c.enrolledStudentIds?.length || 0,
      departmentName: c.departmentId?.name || '',
      departmentCode: c.departmentId?.code || '',
      semesterName: c.semesterId?.name || '',
      semesterCode: c.semesterId?.code || '',
      instructor: c.teacherId?.name || 'Verified Faculty'
    }));

    return res.json({
      success: true,
      count: formatted.length,
      data: formatted
    });
  } catch (error) {
    console.error('Error in getCourses:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve courses.' });
  }
};

/**
 * GET /api/v1/courses/:id
 * Retrieve single course details, populated metadata, and AI parameters
 */
const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    let course = null;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      course = await Course.findById(id)
        .populate('departmentId', 'name code')
        .populate('semesterId', 'name code academicYear')
        .populate('teacherId', 'name email bio')
        .populate('enrolledStudentIds', 'name email image role')
        .lean();
    } else {
      course = await Course.findOne({ courseCode: id.toUpperCase(), active: true })
        .populate('departmentId', 'name code')
        .populate('semesterId', 'name code academicYear')
        .populate('teacherId', 'name email bio')
        .populate('enrolledStudentIds', 'name email image role')
        .lean();
    }

    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found.' });
    }

    return res.json({
      success: true,
      data: {
        ...course,
        id: course._id.toString(),
        code: course.courseCode,
        name: course.title,
        enrolledCount: course.enrolledStudentIds?.length || 0,
        departmentName: course.departmentId?.name || '',
        departmentCode: course.departmentId?.code || '',
        semesterName: course.semesterId?.name || '',
        semesterCode: course.semesterId?.code || '',
        instructor: course.teacherId?.name || 'Faculty Member'
      }
    });
  } catch (error) {
    console.error('Error in getCourseById:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve course details.' });
  }
};

/**
 * POST /api/v1/courses
 * Create a course entity under Department & Semester (Teacher / Admin only)
 */
const createCourse = async (req, res) => {
  try {
    const validatedData = createCourseSchema.parse(req.body);

    // Verify department exists
    const department = await Department.findById(validatedData.departmentId);
    if (!department) {
      return res.status(404).json({ success: false, error: 'Parent department not found.' });
    }

    // Verify semester exists
    const semester = await Semester.findById(validatedData.semesterId);
    if (!semester) {
      return res.status(404).json({ success: false, error: 'Parent semester not found.' });
    }

    // Assign instructor: Teacher can only assign themselves; Admin can assign specified teacher
    let assignedTeacherId = req.user.id;
    if (req.user.role === 'admin' && validatedData.teacherId) {
      assignedTeacherId = validatedData.teacherId;
    }

    // Check duplicate course code in this department and semester
    const existing = await Course.findOne({
      departmentId: validatedData.departmentId,
      semesterId: validatedData.semesterId,
      courseCode: validatedData.courseCode
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        error: `Course ${validatedData.courseCode} is already registered under this semester.`
      });
    }

    const course = await Course.create({
      ...validatedData,
      teacherId: assignedTeacherId,
      enrolledStudentIds: []
    });

    return res.status(201).json({
      success: true,
      message: `Course ${course.courseCode} created successfully.`,
      data: course
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ success: false, errors: error.errors });
    }
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * PUT /api/v1/courses/:id
 * Update course metadata (Teacher owner or Admin only)
 */
const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = updateCourseSchema.parse(req.body);

    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found.' });
    }

    // Ownership check
    const isOwner = course.teacherId.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Only the assigned course instructor or an administrator can modify this course.'
      });
    }

    const updated = await Course.findByIdAndUpdate(id, validatedData, { new: true });
    return res.json({
      success: true,
      message: 'Course updated successfully.',
      data: updated
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ success: false, errors: error.errors });
    }
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * PUT /api/v1/courses/:id/ai-config
 * Calibrate course RAG AI operational parameters (Teacher owner or Admin only)
 */
const updateCourseAIConfig = async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = updateAIConfigSchema.parse(req.body);

    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found.' });
    }

    // Ownership check
    const isOwner = course.teacherId.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Only the course instructor or an administrator can calibrate AI settings.'
      });
    }

    const newAIConfig = {
      ...course.aiConfig,
      ...validatedData
    };

    course.aiConfig = newAIConfig;
    course.contextLastUpdated = new Date();
    await course.save();

    return res.json({
      success: true,
      message: 'Course AI governance parameters saved successfully.',
      aiConfig: course.aiConfig,
      contextLastUpdated: course.contextLastUpdated
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ success: false, errors: error.errors });
    }
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /api/v1/courses/:id/enroll
 * Batch enroll students via array of emails or user IDs (Teacher owner or Admin only)
 */
const enrollStudents = async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = enrollStudentsSchema.parse(req.body);

    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found.' });
    }

    // Ownership check
    const isOwner = course.teacherId.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Only the course instructor or an administrator can enroll students.'
      });
    }

    let studentUserIds = [];

    // Find by emails
    if (validatedData.studentEmails && validatedData.studentEmails.length > 0) {
      const usersByEmail = await User.find({
        email: { $in: validatedData.studentEmails.map((e) => e.toLowerCase()) }
      }).select('_id email');
      studentUserIds = [...studentUserIds, ...usersByEmail.map((u) => u._id.toString())];
    }

    // Find by explicit IDs
    if (validatedData.studentIds && validatedData.studentIds.length > 0) {
      studentUserIds = [...studentUserIds, ...validatedData.studentIds];
    }

    // Deduplicate and filter out already enrolled students
    const existingSet = new Set(course.enrolledStudentIds.map((sid) => sid.toString()));
    let newlyEnrolledCount = 0;

    for (const sid of studentUserIds) {
      if (!existingSet.has(sid)) {
        course.enrolledStudentIds.push(sid);
        existingSet.add(sid);
        newlyEnrolledCount++;
      }
    }

    await course.save();

    return res.json({
      success: true,
      message: `Enrolled ${newlyEnrolledCount} student(s) into ${course.courseCode}.`,
      totalEnrolled: course.enrolledStudentIds.length,
      newlyEnrolledCount
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ success: false, errors: error.errors });
    }
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * DELETE /api/v1/courses/:id/enroll/:studentId
 * Unenroll a student from course roster
 */
const unenrollStudent = async (req, res) => {
  try {
    const { id, studentId } = req.params;

    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found.' });
    }

    const isOwner = course.teacherId.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Only the course instructor or an administrator can modify enrollments.'
      });
    }

    course.enrolledStudentIds = course.enrolledStudentIds.filter(
      (sid) => sid.toString() !== studentId
    );
    await course.save();

    return res.json({
      success: true,
      message: 'Student unenrolled from course.',
      totalEnrolled: course.enrolledStudentIds.length
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  updateCourseAIConfig,
  enrollStudents,
  unenrollStudent
};

