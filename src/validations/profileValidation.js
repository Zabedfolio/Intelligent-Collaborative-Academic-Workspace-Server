const { z } = require('zod');

const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  bio: z.string().max(1000).optional(),
  department: z.string().optional(),
  departmentId: z.string().optional(),
  semester: z.string().optional(),
  currentSemesterId: z.string().optional(),
  designation: z.string().optional(),
  officeHours: z.string().optional(),
  skills: z
    .array(
      z.union([
        z.string(),
        z.object({
          tag: z.string(),
          confidence: z.number().min(0).max(100).optional()
        })
      ])
    )
    .optional(),
  goals: z.array(z.string()).optional(),
  learningGoals: z.array(z.string()).optional(),
  coursesTaught: z.array(z.any()).optional(),
  lastScope: z
    .object({
      departmentId: z.string().optional(),
      departmentName: z.string().optional(),
      semesterId: z.string().optional(),
      semesterName: z.string().optional(),
      courseId: z.string().optional(),
      courseName: z.string().optional(),
      examType: z.enum(['midterm', 'final']).optional()
    })
    .optional()
});

const availabilitySchema = z.object({
  availability: z.array(
    z.object({
      day: z.number().min(0).max(6),
      slots: z.array(z.number().min(0).max(23))
    })
  )
});

const lastScopeSchema = z.object({
  departmentId: z.string().optional(),
  departmentName: z.string().optional(),
  semesterId: z.string().optional(),
  semesterName: z.string().optional(),
  courseId: z.string().optional(),
  courseName: z.string().optional(),
  examType: z.enum(['midterm', 'final']).optional()
});

module.exports = {
  updateProfileSchema,
  availabilitySchema,
  lastScopeSchema
};
