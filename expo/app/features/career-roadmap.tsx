import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ArrowLeft, BookOpen, BrainCircuit, Briefcase, CheckCircle2, Clock, ExternalLink, Sparkles, Target } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { generateText } from '@rork-ai/toolkit-sdk';
import { useProfile } from '@/contexts/ProfileContext';
import Colors from '@/constants/colors';

interface RoadmapMilestone {
  phase: string;
  duration: string;
  skills: string[];
  courses: string[];
  projects: string[];
  certifications: string[];
}

interface NCVETQualification {
  qualification_title: string;
  sector: string;
  nsqf_level: string;
  qualification_code: string;
  summary: string;
  job_roles: string[];
}

interface Course {
  name: string;
  platform: 'NCVET' | 'NSQF' | 'NPTEL' | 'Coursera' | 'Udemy' | 'GreatLearning';
  description: string;
  link: string;
}

interface CareerRecommendation {
  careerTitle: string;
  fitExplanation: string;
  skillsToImprove: string[];
  jobResponsibilities: string[];
  relevantFields: string[];
}

export default function CareerRoadmapScreen() {
  const router = useRouter();
  const { profile } = useProfile();
  const [roadmap, setRoadmap] = useState<RoadmapMilestone[] | null>(null);
  const [careerInput, setCareerInput] = useState<string>('');
  const [ncvetQualifications, setNcvetQualifications] = useState<NCVETQualification[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [aiRecommendations, setAiRecommendations] = useState<CareerRecommendation[] | null>(null);
  const [showAiRecommendations, setShowAiRecommendations] = useState(false);

  const aiRecommendationsMutation = useMutation({
    mutationFn: async () => {
      if (!profile) return [];

      const scores = profile.personalityScores;
      if (!scores) return [];

      const prompt = `You are an expert career counselor AI. Analyze this user's complete profile holistically and provide personalized career recommendations using natural reasoning—NOT predetermined rules or static mapping charts.

### User Profile:
**Name:** ${profile.name}
**Current Skills:** ${profile.skills?.length > 0 ? profile.skills.join(', ') : 'No specific skills listed yet'}

### Personality Radar Scores (0-100):
- Creative: ${scores.creative}
- Analytical: ${scores.analytical}
- Logical: ${scores.logical}
- Literacy: ${scores.literacy || 0}
- Communication: ${scores.communication}
- Problem Solving: ${scores.problemSolving}
- Leadership: ${scores.leadership || 0}

### Task:
Based on this user's personality scores, skills, academic background, and interests, recommend 3-5 career paths that genuinely align with their unique profile. Use AI reasoning to:

1. Interpret their cognitive patterns and behavioral tendencies from the personality scores
2. Identify careers that leverage their top strengths while offering growth
3. Consider how their existing skills and academic level fit into career trajectories
4. Think beyond traditional role definitions—recommend careers based on what they're naturally good at

**Do NOT use any hardcoded mapping rules or predefined trait-to-career charts.** Reason dynamically about each user.

For each recommended career, provide:
- **Career Title**: The specific job role (2-4 words)
- **Why You Fit**: A clear, personalized explanation (2-3 sentences) of why this career suits THIS user's unique strengths and profile
- **Skills to Improve**: 4-6 specific skills they should develop to excel in this role
- **Job Responsibilities**: 4-6 typical day-to-day responsibilities in this career
- **Relevant Fields/Specializations**: 3-5 related domains, industries, or specializations they could explore

Return ONLY a valid JSON array with this exact structure:
[
  {
    "careerTitle": "Career Name",
    "fitExplanation": "Personalized explanation of why this fits the user...",
    "skillsToImprove": ["skill1", "skill2", "skill3", "skill4"],
    "jobResponsibilities": ["responsibility1", "responsibility2", "responsibility3", "responsibility4"],
    "relevantFields": ["field1", "field2", "field3"]
  }
]

Return ONLY valid JSON, no other text.`;

      const response = await generateText(prompt);
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return [];
      return JSON.parse(jsonMatch[0]) as CareerRecommendation[];
    },
    onSuccess: (data) => {
      setAiRecommendations(data);
    },
  });

  const ncvetMutation = useMutation({
    mutationFn: async (careerGoal: string) => {
      const prompt = `You are an AI agent tasked with searching official NCVET and NQR qualification repositories for the career goal: "${careerGoal}".

Search these official sources:
- NQR Search: https://www.nqr.gov.in/search
- NCVET Official: https://www.ncveter.msde.gov.in/
- Qualification Packs: https://nqr.gov.in/qualification-pack
- Sector Skill Councils: https://nqr.gov.in/sector

Your task:
1. Search for qualifications related to "${careerGoal}"
2. Extract ONLY real, verifiable qualifications from these official sources
3. For each qualification found, extract: qualification_title, sector, nsqf_level, qualification_code, summary, job_roles
4. Return results as a JSON array

Format:
[
  {
    "qualification_title": "...",
    "sector": "...",
    "nsqf_level": "...",
    "qualification_code": "...",
    "summary": "...",
    "job_roles": ["..."]
  }
]

IMPORTANT:
- Only include data that exists on official NCVET/NQR pages
- If no matches found, return empty array: []
- Return ONLY valid JSON, no other text`;

      const response = await generateText(prompt);
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return [];
      return JSON.parse(jsonMatch[0]) as NCVETQualification[];
    },
    onSuccess: (data) => {
      setNcvetQualifications(data);
    },
  });

  const roadmapMutation = useMutation({
    mutationFn: async (targetCareer: string) => {
      console.log('[Career Roadmap] Generating roadmap for:', targetCareer);
      console.log('[Career Roadmap] Using profile:', {
        name: profile?.name,
        skills: profile?.skills,
      });
      
      const prompt = `Create a detailed, step-by-step career roadmap for becoming a "${targetCareer}".

User's Current Profile:
- Name: ${profile?.name || 'User'}
- Current Skills: ${profile?.skills.join(', ') || 'Beginner level'}

IMPORTANT: Create this roadmap SPECIFICALLY for "${targetCareer}" - use the EXACT career name provided, not a similar or related career.

Provide a roadmap with 4-5 phases, each containing:
- Phase name and duration
- Key skills to learn
- Recommended courses/resources (online platforms like Coursera, Udemy, etc.)
- Practical project ideas to build portfolio
- Industry-recognized certifications

Format as JSON array with this structure:
[
  {
    "phase": "Foundation Phase",
    "duration": "3-6 months",
    "skills": ["skill1", "skill2"],
    "courses": ["course1", "course2"],
    "projects": ["project1", "project2"],
    "certifications": ["cert1", "cert2"]
  }
]

Return ONLY valid JSON, no other text.`;

      const response = await generateText(prompt);
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error('Invalid response format');
      
      return JSON.parse(jsonMatch[0]) as RoadmapMilestone[];
    },
    onSuccess: (data) => {
      setRoadmap(data);
    },
    onError: () => {
      Alert.alert('Error', 'Failed to generate roadmap. Please try again.');
    },
  });

  const coursesMutation = useMutation({
    mutationFn: async (careerGoal: string) => {
      const prompt = `Find real, accessible courses for the career: "${careerGoal}". Provide courses from NCVET, NSQF, NPTEL, Coursera, Udemy, and GreatLearning platforms.

For each platform, find 3-5 relevant courses:

1. NCVET: National Council for Vocational Education & Training
2. NSQF: National Skills Qualifications Framework
3. NPTEL: National Programme on Technology Enhanced Learning
4. Coursera: Professional certificates and specializations
5. Udemy: Practical skills courses
6. GreatLearning: Career-focused programs

Return as JSON array:
[
  {
    "name": "Course Name",
    "platform": "NCVET" or "NSQF" or "NPTEL" or "Coursera" or "Udemy" or "GreatLearning",
    "description": "Brief description of what this course covers",
    "link": "MUST BE EXACT COURSE URL - For Coursera use https://www.coursera.org/learn/[course-slug], For Udemy use https://www.udemy.com/course/[course-slug], For GreatLearning use https://www.mygreatlearning.com/academy/learn-for-free/courses/[course-slug]"
  }
]

IMPORTANT RULES:
- For NCVET courses: Use ONLY the link "https://www.kaushalverse.ncvet.gov.in/homepage" for ALL NCVET courses
- For NSQF courses: Use ONLY the link "https://www.nielit.gov.in/CoursePage.html" for ALL NSQF courses
- For NPTEL courses: Use ONLY the link "https://nptel.ac.in/courses" for ALL NPTEL courses
- For Coursera: Generate real, specific course URLs with actual course slugs
- For Udemy: Generate real, specific course URLs with actual course slugs
- For GreatLearning: Generate real, specific course URLs with actual course slugs

Return ONLY valid JSON, no other text.`;

      const response = await generateText(prompt);
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return [];
      const courses = JSON.parse(jsonMatch[0]) as Course[];
      
      return courses.map(course => {
        if (course.platform === 'NCVET') {
          return { ...course, link: 'https://www.kaushalverse.ncvet.gov.in/homepage' };
        } else if (course.platform === 'NSQF') {
          return { ...course, link: 'https://www.nielit.gov.in/CoursePage.html' };
        } else if (course.platform === 'NPTEL') {
          return { ...course, link: 'https://nptel.ac.in/courses' };
        }
        return course;
      });
    },
    onSuccess: (data) => {
      setCourses(data);
    },
  });

  const handleGenerate = () => {
    const career = careerInput.trim();
    if (!career) {
      Alert.alert('Enter Career', 'Please enter a career or job role to generate a roadmap.');
      return;
    }
    setRoadmap(null);
    setNcvetQualifications([]);
    setCourses([]);
    setShowAiRecommendations(false);
    roadmapMutation.mutate(career);
    ncvetMutation.mutate(career);
    coursesMutation.mutate(career);
  };

  const handleGetAiRecommendations = () => {
    if (!profile?.personalityScores) {
      Alert.alert('Complete Quiz', 'Please complete the personality quiz first to get AI-powered recommendations.');
      return;
    }
    setShowAiRecommendations(true);
    setAiRecommendations(null);
    aiRecommendationsMutation.mutate();
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Career Roadmap</Text>
          <View style={styles.placeholder} />
        </View>
      </SafeAreaView>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {profile?.personalityScores && (
          <View style={styles.aiRecommendCard}>
            <View style={styles.aiRecommendHeader}>
              <BrainCircuit size={24} color={Colors.secondary} />
              <Text style={styles.aiRecommendTitle}>AI Career Recommendations</Text>
            </View>
            <Text style={styles.aiRecommendSubtitle}>
              Get personalized career suggestions based on your personality analysis and skills
            </Text>
            <Pressable
              style={[styles.aiRecommendButton, aiRecommendationsMutation.isPending && styles.buttonDisabled]}
              onPress={handleGetAiRecommendations}
              disabled={aiRecommendationsMutation.isPending}
            >
              <Text style={styles.aiRecommendButtonText}>
                {aiRecommendationsMutation.isPending ? 'Analyzing...' : 'Get AI Recommendations'}
              </Text>
            </Pressable>
          </View>
        )}

        {aiRecommendationsMutation.isPending && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Analyzing your profile for personalized recommendations...</Text>
          </View>
        )}

        {showAiRecommendations && aiRecommendations && aiRecommendations.length > 0 && (
          <View style={styles.recommendationsContainer}>
            <View style={styles.recommendationsHeader}>
              <Sparkles size={28} color={Colors.primary} />
              <Text style={styles.recommendationsTitle}>Your Personalized Career Matches</Text>
            </View>
            <Text style={styles.recommendationsSubtitle}>
              Based on your unique personality profile and strengths
            </Text>
            
            {aiRecommendations.map((rec, index) => (
              <View key={index} style={styles.recommendationCard}>
                <View style={styles.recommendationHeader}>
                  <View style={styles.recommendationNumber}>
                    <Text style={styles.recommendationNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.recommendationCareerTitle}>{rec.careerTitle}</Text>
                </View>

                <View style={styles.fitSection}>
                  <Text style={styles.fitLabel}>Why This Fits You</Text>
                  <Text style={styles.fitExplanation}>{rec.fitExplanation}</Text>
                </View>

                {rec.skillsToImprove.length > 0 && (
                  <View style={styles.recSection}>
                    <View style={styles.recSectionHeader}>
                      <Target size={16} color={Colors.primary} />
                      <Text style={styles.recSectionTitle}>Skills to Develop</Text>
                    </View>
                    {rec.skillsToImprove.map((skill, i) => (
                      <View key={i} style={styles.recListItem}>
                        <View style={styles.recBullet} />
                        <Text style={styles.recListItemText}>{skill}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {rec.jobResponsibilities.length > 0 && (
                  <View style={styles.recSection}>
                    <View style={styles.recSectionHeader}>
                      <Briefcase size={16} color={Colors.secondary} />
                      <Text style={styles.recSectionTitle}>What You&apos;ll Do</Text>
                    </View>
                    {rec.jobResponsibilities.map((resp, i) => (
                      <View key={i} style={styles.recListItem}>
                        <View style={styles.recBullet} />
                        <Text style={styles.recListItemText}>{resp}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {rec.relevantFields.length > 0 && (
                  <View style={styles.recSection}>
                    <View style={styles.recSectionHeader}>
                      <BookOpen size={16} color="#8B5CF6" />
                      <Text style={styles.recSectionTitle}>Related Fields to Explore</Text>
                    </View>
                    <View style={styles.fieldsContainer}>
                      {rec.relevantFields.map((field, i) => (
                        <View key={i} style={styles.fieldChip}>
                          <Text style={styles.fieldChipText}>{field}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                <Pressable
                  style={styles.generateForCareerButton}
                  onPress={() => {
                    setCareerInput(rec.careerTitle);
                    setShowAiRecommendations(false);
                    handleGenerate();
                  }}
                >
                  <Text style={styles.generateForCareerButtonText}>Generate Roadmap for {rec.careerTitle}</Text>
                  <ArrowLeft size={16} color={Colors.white} style={{ transform: [{ rotate: '180deg' }] }} />
                </Pressable>
              </View>
            ))}
          </View>
        )}

        <View style={styles.inputCard}>
          <Text style={styles.inputTitle}>Generate Career Roadmap</Text>
          <Text style={styles.inputSubtitle}>
            Your profile data is automatically used for personalized recommendations
          </Text>
          {profile?.skills && profile.skills.length > 0 && (
            <View style={styles.profileBadge}>
              <Text style={styles.profileBadgeText}>
                {profile.skills.length} skills tracked
              </Text>
            </View>
          )}
          {profile?.careerRecommendation && (
            <Pressable
              style={styles.recommendedChip}
              onPress={() => setCareerInput(profile.careerRecommendation || '')}
            >
              <Target size={16} color={Colors.primary} />
              <Text style={styles.recommendedChipText}>AI Suggestion: {profile.careerRecommendation}</Text>
            </Pressable>
          )}
          <TextInput
            style={styles.careerInput}
            value={careerInput}
            onChangeText={setCareerInput}
            placeholder="e.g., Doctor, Software Engineer, Fashion Designer..."
            placeholderTextColor={Colors.textSecondary}
          />
          <Pressable
            style={[styles.generateButton, (roadmapMutation.isPending || !careerInput.trim()) && styles.buttonDisabled]}
            onPress={handleGenerate}
            disabled={roadmapMutation.isPending || !careerInput.trim()}
          >
            <Text style={styles.generateButtonText}>
              {roadmapMutation.isPending ? 'Generating...' : 'Generate Roadmap'}
            </Text>
          </Pressable>
        </View>

        {roadmapMutation.isPending && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Creating your personalized roadmap...</Text>
          </View>
        )}

        {roadmap && (
          <View style={styles.roadmapContainer}>
            <View style={styles.roadmapHeader}>
              <Target size={28} color={Colors.primary} />
              <Text style={styles.roadmapTitle}>Your Path to {careerInput}</Text>
            </View>

            {roadmap.map((milestone, index) => (
              <View key={index} style={styles.milestoneCard}>
                <View style={styles.milestoneHeader}>
                  <View style={styles.phaseNumber}>
                    <Text style={styles.phaseNumberText}>{index + 1}</Text>
                  </View>
                  <View style={styles.milestoneHeaderText}>
                    <Text style={styles.milestoneName}>{milestone.phase}</Text>
                    <View style={styles.durationBadge}>
                      <Clock size={14} color={Colors.secondary} />
                      <Text style={styles.durationText}>{milestone.duration}</Text>
                    </View>
                  </View>
                </View>

                {milestone.skills.length > 0 && (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <CheckCircle2 size={18} color={Colors.primary} />
                      <Text style={styles.sectionTitle}>Skills to Learn</Text>
                    </View>
                    {milestone.skills.map((skill, i) => (
                      <View key={i} style={styles.listItem}>
                        <View style={styles.bullet} />
                        <Text style={styles.listItemText}>{skill}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {milestone.courses.length > 0 && (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <BookOpen size={18} color={Colors.secondary} />
                      <Text style={styles.sectionTitle}>Recommended Courses</Text>
                    </View>
                    {milestone.courses.map((course, i) => {
                      const searchQuery = encodeURIComponent(course);
                      let courseUrl = `https://www.google.com/search?q=${searchQuery}`;
                      
                      if (course.toLowerCase().includes('coursera')) {
                        courseUrl = `https://www.coursera.org/search?query=${searchQuery}`;
                      } else if (course.toLowerCase().includes('udemy')) {
                        courseUrl = `https://www.udemy.com/courses/search/?q=${searchQuery}`;
                      } else if (course.toLowerCase().includes('nptel')) {
                        courseUrl = `https://nptel.ac.in/courses`;
                      } else if (course.toLowerCase().includes('ncvet')) {
                        courseUrl = `https://www.kaushalverse.ncvet.gov.in/homepage`;
                      } else if (course.toLowerCase().includes('nsqf') || course.toLowerCase().includes('nielit')) {
                        courseUrl = `https://www.nielit.gov.in/CoursePage.html`;
                      }
                      
                      return (
                        <View key={i} style={styles.listItem}>
                          <View style={styles.bullet} />
                          <Pressable
                            style={styles.courseLink}
                            onPress={async () => {
                              try {
                                await Linking.openURL(courseUrl);
                              } catch {
                                Alert.alert('Info', 'Please search for: ' + course);
                              }
                            }}
                          >
                            <Text style={styles.courseLinkText}>{course}</Text>
                            <View style={{ marginLeft: 6 }}>
                              <ExternalLink size={14} color={Colors.primary} />
                            </View>
                          </Pressable>
                        </View>
                      );
                    })}
                  </View>
                )}

                {milestone.projects.length > 0 && (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Target size={18} color="#8B5CF6" />
                      <Text style={styles.sectionTitle}>Project Ideas</Text>
                    </View>
                    {milestone.projects.map((project, i) => (
                      <View key={i} style={styles.listItem}>
                        <View style={styles.bullet} />
                        <Text style={styles.listItemText}>{project}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {milestone.certifications.length > 0 && (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Briefcase size={18} color="#10B981" />
                      <Text style={styles.sectionTitle}>Certifications</Text>
                    </View>
                    {milestone.certifications.map((cert, i) => (
                      <View key={i} style={styles.listItem}>
                        <View style={styles.bullet} />
                        <Text style={styles.listItemText}>{cert}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}

            {ncvetQualifications.length > 0 && (
              <View style={styles.ncvetSection}>
                <Text style={styles.ncvetTitle}>NCVET/NQR Qualifications</Text>
                <Text style={styles.ncvetSubtitle}>Official government-recognized qualifications</Text>
                {ncvetQualifications.map((qual, index) => (
                  <View key={index} style={styles.qualCard}>
                    <Text style={styles.qualTitle}>{qual.qualification_title}</Text>
                    <View style={styles.qualMeta}>
                      <Text style={styles.qualMetaText}>Sector: {qual.sector}</Text>
                      <Text style={styles.qualMetaText}>NSQF Level: {qual.nsqf_level}</Text>
                    </View>
                    {qual.qualification_code && (
                      <Text style={styles.qualCode}>Code: {qual.qualification_code}</Text>
                    )}
                    <Text style={styles.qualSummary}>{qual.summary}</Text>
                    {qual.job_roles.length > 0 && (
                      <View style={styles.jobRolesContainer}>
                        <Text style={styles.jobRolesLabel}>Job Roles:</Text>
                        {qual.job_roles.map((role, i) => (
                          <Text key={i} style={styles.jobRoleText}>• {role}</Text>
                        ))}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}

            {courses.length > 0 && (
              <View style={styles.coursesSection}>
                <Text style={styles.coursesTitle}>Recommended Courses</Text>
                <Text style={styles.coursesSubtitle}>Enhance your skills with these courses</Text>
                {['NCVET' as const, 'NSQF' as const, 'NPTEL' as const, 'Coursera' as const, 'Udemy' as const, 'GreatLearning' as const].map((platform) => {
                  const platformCourses = courses.filter(c => c.platform === platform);
                  if (platformCourses.length === 0) return null;
                  
                  return (
                    <View key={platform} style={styles.platformSection}>
                      <Text style={styles.platformName}>{platform}</Text>
                      {platformCourses.map((course, idx) => (
                        <View
                          key={idx}
                          style={styles.courseCard}
                        >
                          <View style={styles.courseHeader}>
                            <BookOpen size={20} color={Colors.primary} />
                            <Text style={styles.courseName}>{course.name}</Text>
                          </View>
                          <Text style={styles.courseDescription}>{course.description}</Text>
                          <Pressable
                            style={styles.enrollButton}
                            onPress={async () => {
                              try {
                                await Linking.openURL(course.link);
                              } catch {
                                Alert.alert('Error', 'Unable to open link');
                              }
                            }}
                          >
                            <ExternalLink size={16} color={Colors.white} />
                            <Text style={styles.enrollButtonText}>Enroll Now</Text>
                          </Pressable>
                        </View>
                      ))}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  placeholder: {
    width: 40,
  },
  inputCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  inputSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  recommendedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 16,
    gap: 6,
  },
  recommendedChipText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  careerInput: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  generateButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.text,
    marginTop: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  infoDescription: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 16,
  },
  roadmapContainer: {
    gap: 20,
  },
  roadmapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  roadmapTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.text,
    marginLeft: 12,
    flex: 1,
  },
  milestoneCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  milestoneHeader: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  phaseNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  phaseNumberText: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.white,
  },
  milestoneHeaderText: {
    flex: 1,
  },
  milestoneName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  durationText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.secondary,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginTop: 6,
    marginRight: 10,
  },
  listItemText: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
    lineHeight: 20,
  },
  ncvetSection: {
    marginBottom: 24,
  },
  ncvetTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  ncvetSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  qualCard: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  qualTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  qualMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 6,
  },
  qualMetaText: {
    fontSize: 12,
    color: Colors.secondary,
    fontWeight: '600' as const,
  },
  qualCode: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  qualSummary: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 10,
  },
  jobRolesContainer: {
    marginTop: 6,
  },
  jobRolesLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  jobRoleText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginLeft: 8,
    lineHeight: 18,
  },
  coursesSection: {
    marginBottom: 24,
  },
  coursesTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  coursesSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  platformSection: {
    marginBottom: 20,
  },
  platformName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.secondary,
    marginBottom: 12,
  },
  courseCard: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  courseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  courseName: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
    flex: 1,
  },
  courseDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  enrollButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  enrollButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  courseLink: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  courseLinkText: {
    fontSize: 14,
    color: Colors.primary,
    flex: 1,
    lineHeight: 20,
    textDecorationLine: 'underline' as const,
  },
  profileBadge: {
    backgroundColor: Colors.primary + '10',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 12,
  },
  profileBadgeText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  aiRecommendCard: {
    backgroundColor: Colors.secondary + '15',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: Colors.secondary,
  },
  aiRecommendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  aiRecommendTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  aiRecommendSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  aiRecommendButton: {
    backgroundColor: Colors.secondary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  aiRecommendButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  recommendationsContainer: {
    marginBottom: 32,
  },
  recommendationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  recommendationsTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.text,
    flex: 1,
  },
  recommendationsSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 24,
    lineHeight: 20,
  },
  recommendationCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  recommendationNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recommendationNumberText: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: Colors.white,
  },
  recommendationCareerTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.text,
    flex: 1,
  },
  fitSection: {
    backgroundColor: Colors.primary + '10',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  fitLabel: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.primary,
    marginBottom: 8,
    textTransform: 'uppercase' as const,
  },
  fitExplanation: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
  },
  recSection: {
    marginBottom: 20,
  },
  recSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  recSectionTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  recListItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  recBullet: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.primary,
    marginTop: 7,
    marginRight: 10,
  },
  recListItemText: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
    lineHeight: 20,
  },
  fieldsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  fieldChip: {
    backgroundColor: Colors.background,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  fieldChipText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  generateForCareerButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  generateForCareerButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.white,
  },
});
