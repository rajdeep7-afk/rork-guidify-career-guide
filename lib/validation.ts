import { UserProfile, ValidationError, ProfileValidation } from '@/types/user';

export function validateProfile(profile: Partial<UserProfile>): ProfileValidation {
  const errors: ValidationError[] = [];

  if (!profile.name || profile.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Name is required' });
  }

  if (!profile.age || profile.age < 10 || profile.age > 100) {
    errors.push({ field: 'age', message: 'Please enter a valid age (10-100)' });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateField(
  field: keyof UserProfile,
  value: unknown,
  _profile: Partial<UserProfile>
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
  }

  return null;
}
