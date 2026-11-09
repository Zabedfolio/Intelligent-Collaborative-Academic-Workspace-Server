const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { getMe, syncProfile } = require('../controllers/authController');

// Public route to check institutional domain eligibility
router.post('/check-domain', (req, res) => {
  const { email } = req.body;
  const { checkInstitutionalDomain } = require('../controllers/authController');
  const isInstitutional = checkInstitutionalDomain(email);
  return res.json({ isInstitutional });
});

// Protected routes (Requires active Better-Auth session)
router.get('/me', requireAuth, getMe);
router.post('/sync-profile', requireAuth, syncProfile);

// Admin-only test route verifying requireRole middleware
router.get('/admin-check', requireAuth, requireRole('admin'), (req, res) => {
  res.json({ success: true, message: 'Admin role verified', user: req.user });
});

// Teacher-only test route verifying requireRole middleware
router.get('/teacher-check', requireAuth, requireRole(['teacher', 'admin']), (req, res) => {
  res.json({ success: true, message: 'Teacher or Admin role verified', user: req.user });
});

module.exports = router;
