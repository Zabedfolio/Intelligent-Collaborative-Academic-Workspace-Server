const University = require('../models/University');
const Department = require('../models/Department');
const Semester = require('../models/Semester');
const {
  createUniversitySchema,
  createDepartmentSchema,
  createSemesterSchema,
  updateNodeSchema
} = require('../validations/hierarchyValidation');

/**
 * Seed default IIUC hierarchy if database is currently empty
 */
const seedDefaultHierarchy = async () => {
  try {
    const existingUni = await University.findOne();
    if (existingUni) return existingUni;

    const uni = await University.create({
      name: 'International Islamic University Chittagong',
      code: 'IIUC',
      fullName: 'International Islamic University Chittagong (IIUC)',
      country: 'Bangladesh',
      active: true
    });

    const cseDept = await Department.create({
      universityId: uni._id,
      name: 'Department of Computer Science & Engineering',
      code: 'CSE',
      head: 'Prof. Dr. Tariqul Islam',
      description: 'Undergraduate and graduate degree programs in Computer Science, Software Engineering, and AI.',
      active: true
    });

    const mathDept = await Department.create({
      universityId: uni._id,
      name: 'Department of Mathematics & Data Science',
      code: 'MATH',
      head: 'Prof. Eleanor Vance',
      description: 'Pure mathematics, linear algebra, discrete structures, and applied computational statistics.',
      active: true
    });

    const eeeDept = await Department.create({
      universityId: uni._id,
      name: 'Department of Electrical & Electronic Engineering',
      code: 'EEE',
      head: 'Engr. Mahbubur Rahman',
      description: 'Circuits, semiconductor physics, signal processing, and robotics.',
      active: true
    });

    // Semesters for CSE
    await Semester.create([
      {
        departmentId: cseDept._id,
        name: 'Fall 2026 Semester',
        code: 'FA26',
        termNumber: 7,
        academicYear: '2026–2027',
        active: true
      },
      {
        departmentId: cseDept._id,
        name: 'Spring 2026 Semester',
        code: 'SP26',
        termNumber: 6,
        academicYear: '2025–2026',
        active: true
      },
      {
        departmentId: cseDept._id,
        name: 'Fall 2025 Semester',
        code: 'FA25',
        termNumber: 5,
        academicYear: '2025–2026',
        active: true
      }
    ]);

    // Semesters for MATH
    await Semester.create([
      {
        departmentId: mathDept._id,
        name: 'Fall 2026 Semester',
        code: 'FA26',
        termNumber: 1,
        academicYear: '2026–2027',
        active: true
      },
      {
        departmentId: mathDept._id,
        name: 'Spring 2026 Semester',
        code: 'SP26',
        termNumber: 2,
        academicYear: '2025–2026',
        active: true
      }
    ]);

    // Semesters for EEE
    await Semester.create([
      {
        departmentId: eeeDept._id,
        name: 'Fall 2026 Semester',
        code: 'FA26',
        termNumber: 3,
        academicYear: '2026–2027',
        active: true
      }
    ]);

    return uni;
  } catch (err) {
    console.error('Failed to seed default hierarchy:', err);
    return null;
  }
};

/**
 * GET /api/v1/hierarchy/tree
 * Returns nested institutional tree: University -> Departments -> Semesters
 */
const getHierarchyTree = async (req, res) => {
  try {
    let university = await University.findOne({ active: true });
    if (!university) {
      university = await seedDefaultHierarchy();
    }

    if (!university) {
      return res.status(404).json({
        success: false,
        error: 'Institutional hierarchy not found'
      });
    }

    // Fetch active departments for this university
    const departments = await Department.find({
      universityId: university._id,
      active: true
    }).lean();

    // Fetch semesters for each department
    const deptIds = departments.map((d) => d._id);
    const semesters = await Semester.find({
      departmentId: { $in: deptIds },
      active: true
    }).lean();

    // Group semesters by department
    const departmentsWithSemesters = departments.map((dept) => {
      const deptSemesters = semesters.filter(
        (s) => s.departmentId.toString() === dept._id.toString()
      );
      return {
        ...dept,
        id: dept._id.toString(),
        shortName: dept.code,
        semesters: deptSemesters.map((s) => ({
          ...s,
          id: s._id.toString()
        }))
      };
    });

    return res.json({
      success: true,
      data: {
        university: {
          ...university.toObject ? university.toObject() : university,
          id: university._id.toString(),
          shortName: university.code
        },
        departments: departmentsWithSemesters
      }
    });
  } catch (error) {
    console.error('Error in getHierarchyTree:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve academic hierarchy tree.'
    });
  }
};

/**
 * POST /api/v1/hierarchy/universities
 * Create an institutional university node (Admin only)
 */
const createUniversity = async (req, res) => {
  try {
    const validatedData = createUniversitySchema.parse(req.body);
    const existing = await University.findOne({ code: validatedData.code });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: `University code ${validatedData.code} is already registered.`
      });
    }

    const university = await University.create(validatedData);
    return res.status(201).json({
      success: true,
      message: 'University registered successfully.',
      data: university
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ success: false, errors: error.errors });
    }
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /api/v1/hierarchy/departments
 * Create a new academic department under a university (Admin only)
 */
const createDepartment = async (req, res) => {
  try {
    const validatedData = createDepartmentSchema.parse(req.body);

    const university = await University.findById(validatedData.universityId);
    if (!university) {
      return res.status(404).json({
        success: false,
        error: 'University not found.'
      });
    }

    const existing = await Department.findOne({
      universityId: validatedData.universityId,
      code: validatedData.code
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: `Department code ${validatedData.code} already exists under this university.`
      });
    }

    const department = await Department.create(validatedData);
    return res.status(201).json({
      success: true,
      message: 'Department created successfully.',
      data: {
        ...department.toObject(),
        id: department._id.toString(),
        shortName: department.code,
        semesters: []
      }
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ success: false, errors: error.errors });
    }
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /api/v1/hierarchy/semesters
 * Create an academic semester under a department (Admin only)
 */
const createSemester = async (req, res) => {
  try {
    const validatedData = createSemesterSchema.parse(req.body);

    const department = await Department.findById(validatedData.departmentId);
    if (!department) {
      return res.status(404).json({
        success: false,
        error: 'Parent department not found.'
      });
    }

    const existing = await Semester.findOne({
      departmentId: validatedData.departmentId,
      code: validatedData.code
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: `Semester code ${validatedData.code} already exists under this department.`
      });
    }

    const semester = await Semester.create(validatedData);
    return res.status(201).json({
      success: true,
      message: 'Semester created successfully.',
      data: {
        ...semester.toObject(),
        id: semester._id.toString()
      }
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ success: false, errors: error.errors });
    }
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * PUT /api/v1/hierarchy/:entityType/:id
 * Edit attributes of a University, Department, or Semester (Admin only)
 */
const updateNode = async (req, res) => {
  try {
    const { entityType, id } = req.params;
    const validatedData = updateNodeSchema.parse(req.body);

    let updatedNode = null;
    if (entityType === 'university') {
      updatedNode = await University.findByIdAndUpdate(id, validatedData, { new: true });
    } else if (entityType === 'department') {
      updatedNode = await Department.findByIdAndUpdate(id, validatedData, { new: true });
    } else if (entityType === 'semester') {
      updatedNode = await Semester.findByIdAndUpdate(id, validatedData, { new: true });
    } else {
      return res.status(400).json({
        success: false,
        error: `Invalid entity type: '${entityType}'. Expected 'university', 'department', or 'semester'.`
      });
    }

    if (!updatedNode) {
      return res.status(404).json({
        success: false,
        error: `${entityType} with ID ${id} not found.`
      });
    }

    return res.json({
      success: true,
      message: `${entityType} updated successfully.`,
      data: updatedNode
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ success: false, errors: error.errors });
    }
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * DELETE /api/v1/hierarchy/:entityType/:id
 * Safe delete/soft-delete node. Enforces relational integrity rules:
 * - Reject Department deletion if active Semesters exist (409 Conflict)
 * - Reject University deletion if active Departments exist (409 Conflict)
 */
const deleteNode = async (req, res) => {
  try {
    const { entityType, id } = req.params;

    if (entityType === 'department') {
      // Relational check: Are there active semesters under this department?
      const semesterCount = await Semester.countDocuments({ departmentId: id, active: true });
      if (semesterCount > 0) {
        return res.status(409).json({
          success: false,
          error: `Cannot delete Department: ${semesterCount} active semester(s) are linked to it. Please reassign or remove the semesters first.`
        });
      }

      await Department.findByIdAndUpdate(id, { active: false });
      return res.json({
        success: true,
        message: 'Department deleted successfully.'
      });
    }

    if (entityType === 'semester') {
      await Semester.findByIdAndUpdate(id, { active: false });
      return res.json({
        success: true,
        message: 'Semester deleted successfully.'
      });
    }

    if (entityType === 'university') {
      const deptCount = await Department.countDocuments({ universityId: id, active: true });
      if (deptCount > 0) {
        return res.status(409).json({
          success: false,
          error: `Cannot delete University: ${deptCount} active department(s) are linked to it.`
        });
      }

      await University.findByIdAndUpdate(id, { active: false });
      return res.json({
        success: true,
        message: 'University deleted successfully.'
      });
    }

    return res.status(400).json({
      success: false,
      error: `Invalid entity type '${entityType}'.`
    });
  } catch (error) {
    console.error('Error in deleteNode:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getHierarchyTree,
  createUniversity,
  createDepartment,
  createSemester,
  updateNode,
  deleteNode,
  seedDefaultHierarchy
};

