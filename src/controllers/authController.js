const User = require('../models/User');

/**
 * Institutional email domain check helper
 * Flags verified university accounts (.edu, .ac.bd, university domains)
 */
const checkInstitutionalDomain = (email) => {
  if (!email) return false;
  const domain = email.split('@')[1]?.toLowerCase() || '';
  return (
    domain.endsWith('.edu') ||
    domain.endsWith('.edu.bd') ||
    domain.endsWith('.ac.bd') ||
    domain.includes('university') ||
    domain.includes('college')
  );
};

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current authenticated user profile
 * @access  Private (Protected by requireAuth)
 */
const getMe = async (req, res) => {
  try {
    const userSession = req.user;
    if (!userSession?.id && !userSession?._id) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const userId = userSession.id || userSession._id;
    // Retrieve extended user profile from MongoDB
    const userDoc = await User.findById(userId).catch(() => null);

    const isInstitutional = checkInstitutionalDomain(userSession.email);

    return res.status(200).json({
      success: true,
      user: {
        id: userId,
        name: userSession.name,
        email: userSession.email,
        role: userSession.role || userDoc?.role || 'student',
        department: userSession.department || userDoc?.department || '',
        semester: userSession.semester || userDoc?.semester || '',
        image: userSession.image || userDoc?.image || '',
        isInstitutional,
        skills: userDoc?.skills || [],
        learningGoals: userDoc?.learningGoals || [],
        bio: userDoc?.bio || '',
        status: userDoc?.status || 'active',
        createdAt: userDoc?.createdAt || userSession.createdAt
      }
    });
  } catch (error) {
    console.error('getMe controller error:', error);
    return res.status(500).json({ success: false, error: 'Server error retrieving profile' });
  }
};

/**
 * @route   POST /api/v1/auth/sync-profile
 * @desc    Synchronize user metadata upon sign-up or profile update
 * @access  Private
 */
const syncProfile = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { department, semester, bio, skills, learningGoals, role } = req.body;

    const updateData = {};
    if (department !== undefined) updateData.department = department;
    if (semester !== undefined) updateData.semester = semester;
    if (bio !== undefined) updateData.bio = bio;
    if (Array.isArray(skills)) updateData.skills = skills;
    if (Array.isArray(learningGoals)) updateData.learningGoals = learningGoals;

    // Only allow role update if user is admin or during initial account setup
    if (role && (req.user.role === 'admin' || !req.user.role)) {
      updateData.role = role;
    }

    const updated = await User.findByIdAndUpdate(userId, { $set: updateData }, { new: true, upsert: true });

    return res.status(200).json({
      success: true,
      message: 'Profile synchronized successfully',
      user: updated.toSafeObject()
    });
  } catch (error) {
    console.error('syncProfile error:', error);
    return res.status(500).json({ success: false, error: 'Failed to synchronize profile' });
  }
};

module.exports = {
  getMe,
  syncProfile,
  checkInstitutionalDomain
};

