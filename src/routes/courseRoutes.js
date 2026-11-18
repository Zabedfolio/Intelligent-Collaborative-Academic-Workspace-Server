const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  updateCourseAIConfig,
  enrollStudents,
  unenrollStudent
} = require('../controllers/courseController');

// 1. Public / Authenticated Course Catalog Queries
router.get('/', getCourses);
router.get('/:id', getCourseById);

// 2. Teacher & Admin Course Management Operations
router.post('/', requireAuth, requireRole(['teacher', 'admin']), createCourse);
router.put('/:id', requireAuth, requireRole(['teacher', 'admin']), updateCourse);
router.put('/:id/ai-config', requireAuth, requireRole(['teacher', 'admin']), updateCourseAIConfig);
router.post('/:id/enroll', requireAuth, requireRole(['teacher', 'admin']), enrollStudents);
router.delete('/:id/enroll/:studentId', requireAuth, requireRole(['teacher', 'admin']), unenrollStudent);

module.exports = router;

