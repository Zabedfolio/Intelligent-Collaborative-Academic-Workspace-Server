const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');
const {
  getProfile,
  updateProfile,
  updateAvailability,
  updateLastScope
} = require('../controllers/userController');

// All profile endpoints require an active authenticated Better-Auth session
router.get('/profile', requireAuth, getProfile);
router.put('/profile', requireAuth, updateProfile);
router.put('/availability', requireAuth, updateAvailability);
router.put('/scope', requireAuth, updateLastScope);

module.exports = router;
