const { z } = require('zod');

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const createUniversitySchema = z.object({
  name: z.string().min(2, 'University name must be at least 2 characters'),
  code: z.string().min(2, 'University short code must be at least 2 characters').toUpperCase(),
  fullName: z.string().optional(),
  country: z.string().optional()
});

const createDepartmentSchema = z.object({
  universityId: z.string().regex(objectIdRegex, 'Invalid University ID format'),
  name: z.string().min(2, 'Department name must be at least 2 characters'),
  code: z.string().min(2, 'Department code must be at least 2 characters').toUpperCase(),
  head: z.string().optional(),
  description: z.string().optional()
});

const createSemesterSchema = z.object({
  departmentId: z.string().regex(objectIdRegex, 'Invalid Department ID format'),
  name: z.string().min(2, 'Semester name must be at least 2 characters'),
  code: z.string().min(2, 'Semester code must be at least 2 characters').toUpperCase(),
  termNumber: z.number().int().min(1).max(12).optional(),
  academicYear: z.string().optional()
});

const updateNodeSchema = z.object({
  name: z.string().min(2).optional(),
  code: z.string().min(2).toUpperCase().optional(),
  head: z.string().optional(),
  description: z.string().optional(),
  termNumber: z.number().int().min(1).max(12).optional(),
  academicYear: z.string().optional(),
  active: z.boolean().optional()
});

module.exports = {
  createUniversitySchema,
  createDepartmentSchema,
  createSemesterSchema,
  updateNodeSchema
};

