export type AcademicLevel = 'school' | 'college';

export interface CourseDefinition {
  name: string;
  category: 'engineering' | 'medical' | 'business' | 'science' | 'arts' | 'law' | 'other';
  validYears: string[];
  duration: number;
}

export interface SkillDefinition {
  name: string;
  categories: CourseDefinition['category'][];
  description?: string;
}

export const SCHOOL_STANDARDS = ['8th', '9th', '10th', '11th', '12th'];

export const COURSES: Record<string, CourseDefinition> = {
  'B.Tech/B.E.': {
    name: 'B.Tech/B.E.',
    category: 'engineering',
    validYears: ['1st Year', '2nd Year', '3rd Year', '4th Year'],
    duration: 4,
  },
  'MBBS': {
    name: 'MBBS',
    category: 'medical',
    validYears: ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'],
    duration: 5,
  },
  'BDS': {
    name: 'BDS',
    category: 'medical',
    validYears: ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'],
    duration: 5,
  },
  'BCA': {
    name: 'BCA',
    category: 'engineering',
    validYears: ['1st Year', '2nd Year', '3rd Year'],
    duration: 3,
  },
  'B.Sc CS': {
    name: 'B.Sc CS',
    category: 'science',
    validYears: ['1st Year', '2nd Year', '3rd Year'],
    duration: 3,
  },
  'B.Com': {
    name: 'B.Com',
    category: 'business',
    validYears: ['1st Year', '2nd Year', '3rd Year'],
    duration: 3,
  },
  'BBA': {
    name: 'BBA',
    category: 'business',
    validYears: ['1st Year', '2nd Year', '3rd Year'],
    duration: 3,
  },
  'LLB (3-Year)': {
    name: 'LLB (3-Year)',
    category: 'law',
    validYears: ['1st Year', '2nd Year', '3rd Year'],
    duration: 3,
  },
  'LLB (5-Year)': {
    name: 'LLB (5-Year)',
    category: 'law',
    validYears: ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'],
    duration: 5,
  },
  'B.Arch': {
    name: 'B.Arch',
    category: 'engineering',
    validYears: ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'],
    duration: 5,
  },
  'MBA': {
    name: 'MBA',
    category: 'business',
    validYears: ['1st Year', '2nd Year'],
    duration: 2,
  },
  'M.Tech': {
    name: 'M.Tech',
    category: 'engineering',
    validYears: ['1st Year', '2nd Year'],
    duration: 2,
  },
  'M.Sc': {
    name: 'M.Sc',
    category: 'science',
    validYears: ['1st Year', '2nd Year'],
    duration: 2,
  },
  'LLM': {
    name: 'LLM',
    category: 'law',
    validYears: ['1st Year', '2nd Year'],
    duration: 2,
  },
  'B.A.': {
    name: 'B.A.',
    category: 'arts',
    validYears: ['1st Year', '2nd Year', '3rd Year'],
    duration: 3,
  },
  'Nursing (B.Sc)': {
    name: 'Nursing (B.Sc)',
    category: 'medical',
    validYears: ['1st Year', '2nd Year', '3rd Year', '4th Year'],
    duration: 4,
  },
  'Diploma': {
    name: 'Diploma',
    category: 'other',
    validYears: ['1st Year', '2nd Year', '3rd Year'],
    duration: 3,
  },
};

export const SKILLS: SkillDefinition[] = [
  { name: 'Python', categories: ['engineering', 'science'], description: 'Programming language' },
  { name: 'Java', categories: ['engineering', 'science'], description: 'Programming language' },
  { name: 'JavaScript', categories: ['engineering', 'science'], description: 'Web programming' },
  { name: 'React', categories: ['engineering'], description: 'Frontend framework' },
  { name: 'Node.js', categories: ['engineering'], description: 'Backend technology' },
  { name: 'Machine Learning', categories: ['engineering', 'science'], description: 'AI/ML' },
  { name: 'Data Science', categories: ['engineering', 'science', 'business'], description: 'Data analysis' },
  { name: 'SQL', categories: ['engineering', 'science', 'business'], description: 'Database' },
  { name: 'Cloud Computing', categories: ['engineering'], description: 'AWS, Azure, GCP' },
  { name: 'DevOps', categories: ['engineering'], description: 'CI/CD, Docker, Kubernetes' },
  { name: 'Cybersecurity', categories: ['engineering'], description: 'Information security' },
  { name: 'Mobile Development', categories: ['engineering'], description: 'iOS, Android' },
  { name: 'UI/UX Design', categories: ['engineering', 'arts'], description: 'Interface design' },
  { name: 'Graphic Design', categories: ['arts'], description: 'Visual design' },
  
  { name: 'Anatomy', categories: ['medical'], description: 'Medical science' },
  { name: 'Physiology', categories: ['medical'], description: 'Medical science' },
  { name: 'Biochemistry', categories: ['medical', 'science'], description: 'Medical/science' },
  { name: 'Pharmacology', categories: ['medical'], description: 'Drug science' },
  { name: 'Surgery', categories: ['medical'], description: 'Surgical skills' },
  { name: 'Clinical Skills', categories: ['medical'], description: 'Patient care' },
  { name: 'Dental Care', categories: ['medical'], description: 'Dentistry' },
  { name: 'Patient Care', categories: ['medical'], description: 'Healthcare' },
  
  { name: 'Accounting', categories: ['business'], description: 'Financial accounting' },
  { name: 'Finance', categories: ['business'], description: 'Financial management' },
  { name: 'Marketing', categories: ['business'], description: 'Business marketing' },
  { name: 'Economics', categories: ['business', 'arts'], description: 'Economic principles' },
  { name: 'Business Strategy', categories: ['business'], description: 'Strategic planning' },
  { name: 'Excel', categories: ['business', 'engineering', 'science'], description: 'Spreadsheet software' },
  { name: 'Statistics', categories: ['business', 'engineering', 'science'], description: 'Statistical analysis' },
  
  { name: 'Legal Research', categories: ['law'], description: 'Law research' },
  { name: 'Contract Law', categories: ['law'], description: 'Contracts' },
  { name: 'Criminal Law', categories: ['law'], description: 'Criminal justice' },
  { name: 'Corporate Law', categories: ['law', 'business'], description: 'Business law' },
  
  { name: 'Physics', categories: ['science', 'engineering'], description: 'Physical sciences' },
  { name: 'Chemistry', categories: ['science', 'engineering'], description: 'Chemical sciences' },
  { name: 'Biology', categories: ['science', 'medical'], description: 'Biological sciences' },
  { name: 'Mathematics', categories: ['science', 'engineering'], description: 'Mathematical skills' },
  
  { name: 'Writing', categories: ['arts', 'business'], description: 'Content writing' },
  { name: 'Public Speaking', categories: ['arts', 'business', 'law'], description: 'Presentation skills' },
  { name: 'Research', categories: ['arts', 'science', 'law'], description: 'Research methodology' },
  { name: 'Critical Thinking', categories: ['arts', 'science', 'law', 'business', 'engineering'], description: 'Analytical thinking' },
  { name: 'Communication', categories: ['arts', 'business', 'law', 'medical'], description: 'Communication skills' },
  { name: 'Leadership', categories: ['business', 'engineering', 'arts', 'law'], description: 'Leadership abilities' },
  { name: 'Teamwork', categories: ['business', 'engineering', 'arts', 'science', 'medical'], description: 'Collaboration' },
  { name: 'Time Management', categories: ['business', 'engineering', 'arts', 'science', 'medical', 'law'], description: 'Productivity' },
  { name: 'Problem Solving', categories: ['engineering', 'science', 'business', 'medical'], description: 'Analytical problem solving' },
];

export const LEARNING_PREFERENCES = [
  'Visual Learning',
  'Hands-on Practice',
  'Structured Courses',
  'Self-paced',
  'Group Learning',
  'Project-based',
  'Video Tutorials',
  'Reading & Documentation',
];

export function validateCourseYear(course: string, year: string): boolean {
  const courseDefinition = COURSES[course];
  if (!courseDefinition) return false;
  return courseDefinition.validYears.includes(year);
}

export function validateCourseSkill(course: string, skillName: string): boolean {
  const courseDefinition = COURSES[course];
  if (!courseDefinition) return true;
  
  const skill = SKILLS.find(s => s.name === skillName);
  if (!skill) return true;
  
  return skill.categories.includes(courseDefinition.category);
}

export function getValidYearsForCourse(course: string): string[] {
  const courseDefinition = COURSES[course];
  if (!courseDefinition) return [];
  return courseDefinition.validYears;
}

export function getSuggestedSkillsForCourse(course: string): SkillDefinition[] {
  const courseDefinition = COURSES[course];
  if (!courseDefinition) return [];
  
  return SKILLS.filter(skill => 
    skill.categories.includes(courseDefinition.category)
  );
}

export function getCoursesArray(): string[] {
  return Object.keys(COURSES);
}
