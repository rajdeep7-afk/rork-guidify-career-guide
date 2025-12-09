import { useRouter } from 'expo-router';
import {
  BookOpen,
  BrainCircuit,
  Briefcase,
  DollarSign,
  GraduationCap,
  LogOut,
  Map,
  Mic,
  User,
} from 'lucide-react-native';
import React from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import Colors from '@/constants/colors';

const { width } = Dimensions.get('window');

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  color: string;
  onPress: () => void;
}

function FeatureCard({ title, description, icon: Icon, color, onPress }: FeatureCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.featureCard, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        <Icon size={28} color={color} />
      </View>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </Pressable>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const { profile } = useProfile();

  const scores = profile?.personalityScores;
  const topStrength = scores
    ? Object.entries(scores).reduce((max, [key, value]) =>
        value > max.value ? { key, value } : max
      , { key: '', value: 0 })
    : null;

  const features = [
    {
      title: 'Career Roadmap',
      description: 'Get personalized career path',
      icon: Map,
      color: Colors.primary,
      route: '/features/career-roadmap',
    },
    {
      title: 'Aptitude Test',
      description: 'Test your knowledge',
      icon: BrainCircuit,
      color: Colors.secondary,
      route: '/features/aptitude-test',
    },
    {
      title: 'College Finder',
      description: 'Find best colleges for you',
      icon: GraduationCap,
      color: '#8B5CF6',
      route: '/features/college-finder',
    },
    {
      title: 'Scholarship Finder',
      description: 'Discover funding opportunities',
      icon: DollarSign,
      color: '#10B981',
      route: '/features/scholarship-finder',
    },
    {
      title: 'Interview Bot',
      description: 'Practice with AI interviewer',
      icon: Mic,
      color: '#EC4899',
      route: '/features/interview-bot',
    },
    {
      title: 'Job Finder',
      description: 'Explore career opportunities',
      icon: Briefcase,
      color: '#F59E0B',
      route: '/features/job-finder',
    },
  ];

  const strengthLabels: Record<string, string> = {
    creative: 'Creative',
    analytical: 'Analytical',
    logical: 'Logical',
    literacy: 'Literacy',
    communication: 'Communication',
    problemSolving: 'Problem Solving',
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{profile?.name || 'Student'}</Text>
          </View>
          <Pressable style={styles.profileButton} onPress={() => logout()}>
            <LogOut size={20} color={Colors.text} />
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <User size={24} color={Colors.primary} />
              <Text style={styles.statLabel}>Academic Level</Text>
              <Text style={styles.statValue}>
                {profile?.academicLevel === 'school' ? 'School' : 'College'}
              </Text>
              <Text style={styles.statSubvalue}>
                {profile?.course || profile?.standard}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <BookOpen size={24} color={Colors.secondary} />
              <Text style={styles.statLabel}>Top Strength</Text>
              <Text style={styles.statValue}>
                {topStrength ? strengthLabels[topStrength.key] : 'N/A'}
              </Text>
              <Text style={styles.statSubvalue}>
                {topStrength ? `${topStrength.value}%` : '-'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Explore Features</Text>
          <Text style={styles.sectionSubtitle}>
            Discover tools to guide your career journey
          </Text>
        </View>

        <View style={styles.featuresGrid}>
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              title={feature.title}
              description={feature.description}
              icon={feature.icon}
              color={feature.color}
              onPress={() => router.push(feature.route as never)}
            />
          ))}
        </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  greeting: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  userName: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.text,
    marginTop: 4,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  statsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 16,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 8,
    marginBottom: 4,
    fontWeight: '500' as const,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  statSubvalue: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  careerBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  careerBadgeLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  careerBadgeValue: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.white,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  featureCard: {
    width: (width - 56) / 2,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    margin: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardPressed: {
    opacity: 0.7,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
});
