import { UserProfile, ValidationError, ProfileValidation } from '@/types/user';
import {
  COURSES,
  SCHOOL_STANDARDS,
  validateCourseYear,
  validateCourseSkill,
} from '@/constants/validation';

export function validateProfile(profile: Partial<UserProfile>): ProfileValidation {
  const errors: ValidationError[] = [];

  if (!profile.name || profile.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Name is required' });
  }

  if (!profile.age || profile.age < 10 || profile.age > 100) {
    errors.push({ field: 'age', message: 'Please enter a valid age (10-100)' });
  }

  if (!profile.standard || profile.standard.trim().length === 0) {
    errors.push({ field: 'standard', message: 'Academic year/standard is required' });
  }

  if (profile.academicLevel === 'school') {
    if (profile.standard && !SCHOOL_STANDARDS.includes(profile.standard)) {
      errors.push({
        field: 'standard',
        message: 'Invalid standard for school level',
      });
    }
  } else if (profile.academicLevel === 'college') {
    if (!profile.course || profile.course.trim().length === 0) {
      errors.push({ field: 'course', message: 'Course is required for college students' });
    }

    if (profile.course && profile.standard) {
      if (!validateCourseYear(profile.course, profile.standard)) {
        const validYears = COURSES[profile.course]?.validYears || [];
        errors.push({
          field: 'standard',
          message: `Invalid year for ${profile.course}. Valid years: ${validYears.join(', ')}`,
        });
      }
    }
  }

  if (profile.skills && profile.skills.length > 0 && profile.course) {
    const invalidSkills: string[] = [];
    profile.skills.forEach(skillName => {
      if (!validateCourseSkill(profile.course!, skillName)) {
        invalidSkills.push(skillName);
      }
    });

    if (invalidSkills.length > 0) {
      errors.push({
        field: 'skills',
        message: `These skills don't match your academic stream: ${invalidSkills.join(', ')}`,
      });
    }
  }



  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateField(
  field: keyof UserProfile,
  value: unknown,
  profile: Partial<UserProfile>
): ValidationError | null {
  switch (field) {
    case 'name':
      if (!value || (typeof value === 'string' && value.trim().length === 0)) {
        return { field: 'name', message: 'Name is required' };
      }
      break;

    case 'age':
      if (typeof value === 'number' && (value < 10 || value > 100)) {
        return { field: 'age', message: 'Please enter a valid age (10-100)' };
      }
      break;

    case 'standard':
      if (!value || (typeof value === 'string' && value.trim().length === 0)) {
        return { field: 'standard', message: 'Academic year/standard is required' };
      }

      if (profile.academicLevel === 'college' && profile.course && typeof value === 'string') {
        if (!validateCourseYear(profile.course, value)) {
          const validYears = COURSES[profile.course]?.validYears || [];
          return {
            field: 'standard',
            message: `Invalid year for ${profile.course}. Valid years: ${validYears.join(', ')}`,
          };
        }
      }
      break;

    case 'course':
      if (profile.academicLevel === 'college') {
        if (!value || (typeof value === 'string' && value.trim().length === 0)) {
          return { field: 'course', message: 'Course is required for college students' };
        }
      }
      break;

    case 'skills':
      if (Array.isArray(value) && value.length > 0 && profile.course) {
        const invalidSkills: string[] = [];
        value.forEach(skillName => {
          if (typeof skillName === 'string' && !validateCourseSkill(profile.course!, skillName)) {
            invalidSkills.push(skillName);
          }
        });

        if (invalidSkills.length > 0) {
          return {
            field: 'skills',
            message: `These skills don't match your academic stream: ${invalidSkills.join(', ')}`,
          };
        }
      }
      break;


  }

  return null;
}
