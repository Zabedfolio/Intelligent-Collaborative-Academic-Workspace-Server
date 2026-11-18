const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const {
  getHierarchyTree,
  createUniversity,
  createDepartment,
  createSemester,
  updateNode,
  deleteNode
} = require('../controllers/hierarchyController');

// 1. Read: Retrieve full organizational hierarchy tree (University -> Department -> Semester)
router.get('/tree', getHierarchyTree);

// 2. Admin Write Operations (Protected by Better-Auth session & Admin RBAC)
router.post('/universities', requireAuth, requireRole('admin'), createUniversity);
router.post('/departments', requireAuth, requireRole('admin'), createDepartment);
router.post('/semesters', requireAuth, requireRole('admin'), createSemester);
router.put('/:entityType/:id', requireAuth, requireRole('admin'), updateNode);
router.delete('/:entityType/:id', requireAuth, requireRole('admin'), deleteNode);

module.exports = router;

