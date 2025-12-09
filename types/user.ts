export interface UserProfile {
  id: string;
  name: string;
  email: string;
  age: number;
  academicLevel: 'school' | 'college';
  standard: string;
  course?: string;
  skills: string[];
  goals: string;
  ambitions: string;
  learningPreferences: string[];
  personalityScores?: PersonalityScores;
  careerRecommendation?: string;
  quizCompleted: boolean;
  onboardingCompleted: boolean;
  googleId?: string;
  profileImage?: string;
  authProvider?: 'email' | 'google';
}

export interface PersonalityScores {
  creative: number;
  analytical: number;
  logical: number;
  literacy: number;
  communication: number;
  problemSolving: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  category: keyof PersonalityScores;
}
