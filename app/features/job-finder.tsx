import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ArrowLeft, Briefcase, Building, Clock, DollarSign, ExternalLink, MapPin, TrendingUp } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { generateText } from '@rork-ai/toolkit-sdk';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';

interface Job {
  title: string;
  company: string;
  location: string;
  type: 'Full-Time' | 'Internship' | 'Part-Time' | 'Contract';
  experienceLevel: 'Entry Level' | 'Intermediate' | 'Senior';
  salary: string;
  skills: string[];
  description: string;
  matchPercentage: number;
  applyLink: string;
}

type JobFilter = 'All' | 'Full-Time' | 'Internship' | 'Part-Time' | 'Contract';

export default function JobFinderScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<JobFilter>('All');

  const jobsMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('No user profile found');

      const isStudent = user.academicLevel === 'school' || 
                       (user.academicLevel === 'college' && ['1st Year', '2nd Year', '3rd Year'].includes(user.standard));

      const prompt = `Generate 12 realistic job/internship recommendations for this candidate.

Candidate Profile:
- Academic Level: ${user.academicLevel === 'school' ? 'School' : 'College'}
- Year: ${user.standard}
${user.course ? `- Course: ${user.course}` : ''}
- Career Direction: ${user.careerRecommendation || 'Not specified'}
- Skills: ${user.skills.join(', ') || 'General skills'}
- Experience: ${isStudent ? 'Student/Fresher' : 'Some experience'}
${user.personalityScores ? `- Strengths: ${Object.entries(user.personalityScores).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([key]) => key).join(', ')}` : ''}

Guidelines:
- For students: Focus on internships, apprenticeships, entry-level roles
- For experienced: Include intermediate and full-time positions
- Include diverse companies: startups, MNCs, mid-size firms
- Realistic salary ranges for Indian market
- Match skills and career direction
- Include remote and office-based roles

Format as JSON array:
[
  {
    "title": "Software Engineer Intern",
    "company": "Google India",
    "location": "Bangalore, India (Remote)",
    "type": "Internship" or "Full-Time" or "Part-Time" or "Contract",
    "experienceLevel": "Entry Level" or "Intermediate" or "Senior",
    "salary": "₹15,000 - ₹25,000/month" or "₹6 - ₹12 LPA",
    "skills": ["Python", "Java", "DSA"],
    "description": "Brief role description",
    "matchPercentage": 85,
    "applyLink": "https://careers.google.com"
  }
]

Return ONLY valid JSON, no other text.`;

      const response = await generateText(prompt);
      console.log('AI Response:', response);
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error('Invalid response format');

      const parsed = JSON.parse(jsonMatch[0]) as Job[];
      return parsed.sort((a, b) => b.matchPercentage - a.matchPercentage);
    },
    onSuccess: (data) => {
      setJobs(data);
    },
    onError: () => {
      Alert.alert('Error', 'Failed to find job recommendations. Please try again.');
    },
  });

  useEffect(() => {
    if (!jobs) {
      jobsMutation.mutate();
    }
  }, []);

  const filters: JobFilter[] = ['All', 'Full-Time', 'Internship', 'Part-Time', 'Contract'];

  const filteredJobs = jobs?.filter(
    job => selectedFilter === 'All' || job.type === selectedFilter
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Job Finder</Text>
          <View style={styles.placeholder} />
        </View>
      </SafeAreaView>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {jobsMutation.isPending && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>
              Finding jobs that match your profile...
            </Text>
          </View>
        )}

        {jobs && jobs.length > 0 && (
          <>
            <View style={styles.filterSection}>
              <Text style={styles.resultsTitle}>
                {filteredJobs?.length || 0} Opportunities
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                {filters.map((filter) => (
                  <Pressable
                    key={filter}
                    style={[styles.filterChip, selectedFilter === filter && styles.filterChipActive]}
                    onPress={() => setSelectedFilter(filter)}
                  >
                    <Text style={[styles.filterChipText, selectedFilter === filter && styles.filterChipTextActive]}>
                      {filter}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {filteredJobs?.map((job, index) => (
              <View key={index} style={styles.jobCard}>
                <View style={styles.jobHeader}>
                  <View style={styles.jobHeaderContent}>
                    <Text style={styles.jobTitle}>{job.title}</Text>
                    <Text style={styles.companyName}>{job.company}</Text>
                  </View>
                  <View style={styles.matchBadge}>
                    <Text style={styles.matchText}>{job.matchPercentage}%</Text>
                  </View>
                </View>

                <View style={styles.jobMeta}>
                  <View style={styles.metaItem}>
                    <MapPin size={14} color={Colors.textSecondary} />
                    <Text style={styles.metaText}>{job.location}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Clock size={14} color={Colors.textSecondary} />
                    <Text style={styles.metaText}>{job.type}</Text>
                  </View>
                </View>

                <View style={styles.badges}>
                  <View style={[styles.badge, { backgroundColor: Colors.primary + '20', borderColor: Colors.primary }]}>
                    <Briefcase size={12} color={Colors.primary} />
                    <Text style={[styles.badgeText, { color: Colors.primary }]}>
                      {job.experienceLevel}
                    </Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: Colors.success + '20', borderColor: Colors.success }]}>
                    <DollarSign size={12} color={Colors.success} />
                    <Text style={[styles.badgeText, { color: Colors.success }]}>
                      {job.salary}
                    </Text>
                  </View>
                </View>

                <Text style={styles.jobDescription}>{job.description}</Text>

                <View style={styles.skillsSection}>
                  <Text style={styles.skillsLabel}>Required Skills:</Text>
                  <View style={styles.skillsContainer}>
                    {job.skills.map((skill, i) => (
                      <View key={i} style={styles.skillChip}>
                        <Text style={styles.skillText}>{skill}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <Pressable
                  style={({ pressed }) => [styles.applyButton, pressed && styles.buttonPressed]}
                  onPress={() => Alert.alert('Apply', `Visit: ${job.applyLink}\n\nOpportunity: ${job.title} at ${job.company}`)}
                >
                  <ExternalLink size={18} color={Colors.white} />
                  <Text style={styles.applyButtonText}>View & Apply</Text>
                </Pressable>
              </View>
            ))}

            <View style={styles.noteCard}>
              <Building size={24} color={Colors.accent} />
              <Text style={styles.noteText}>
                Job recommendations are based on your profile, skills, and career direction. Always research companies before applying.
              </Text>
            </View>

            <Pressable
              style={styles.refreshButton}
              onPress={() => {
                setJobs(null);
                setSelectedFilter('All');
                jobsMutation.mutate();
              }}
            >
              <TrendingUp size={20} color={Colors.text} />
              <Text style={styles.refreshButtonText}>Refresh Recommendations</Text>
            </Pressable>
          </>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 16,
    textAlign: 'center',
  },
  filterSection: {
    marginBottom: 20,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  filterScroll: {
    marginHorizontal: -4,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: Colors.white,
  },
  jobCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  jobHeaderContent: {
    flex: 1,
    marginRight: 12,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  companyName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  matchBadge: {
    backgroundColor: Colors.secondary + '20',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.secondary,
  },
  matchText: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: Colors.secondary,
  },
  jobMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
  },
  jobDescription: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 12,
  },
  skillsSection: {
    marginBottom: 16,
  },
  skillsLabel: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillChip: {
    backgroundColor: Colors.accent + '20',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  skillText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.accent,
  },
  applyButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  applyButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  noteCard: {
    backgroundColor: Colors.accent + '10',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
  },
  refreshButton: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  refreshButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
});
