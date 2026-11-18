const { z } = require('zod');

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const aiConfigSchema = z.object({
  strictCourseMode: z.boolean().optional(),
  cumulativeFinalScope: z.boolean().optional(),
  maxContextTokens: z.number().int().min(500, 'Minimum context token budget is 500').max(6000, 'Maximum context token budget is 6000').optional()
});

const createCourseSchema = z.object({
  courseCode: z.string().min(2, 'Course code must be at least 2 characters').toUpperCase(),
  title: z.string().min(2, 'Course title must be at least 2 characters'),
  description: z.string().optional(),
  credits: z.number().int().min(1).max(6).optional(),
  departmentId: z.string().regex(objectIdRegex, 'Invalid Department ID format'),
  semesterId: z.string().regex(objectIdRegex, 'Invalid Semester ID format'),
  teacherId: z.string().regex(objectIdRegex, 'Invalid Teacher ID format').optional(),
  aiConfig: aiConfigSchema.optional()
});

const updateCourseSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional(),
  credits: z.number().int().min(1).max(6).optional(),
  active: z.boolean().optional(),
  aiConfig: aiConfigSchema.optional()
});

const updateAIConfigSchema = z.object({
  strictCourseMode: z.boolean().optional(),
  cumulativeFinalScope: z.boolean().optional(),
  maxContextTokens: z.number().int().min(500).max(6000).optional()
});

const enrollStudentsSchema = z.object({
  studentEmails: z.array(z.string().email('Invalid student email format')).optional(),
  studentIds: z.array(z.string().regex(objectIdRegex, 'Invalid Student ID format')).optional()
}).refine(
  (data) => (data.studentEmails && data.studentEmails.length > 0) || (data.studentIds && data.studentIds.length > 0),
  { message: 'Provide either studentEmails or studentIds to enroll.' }
);

module.exports = {
  createCourseSchema,
  updateCourseSchema,
  updateAIConfigSchema,
  enrollStudentsSchema
};

