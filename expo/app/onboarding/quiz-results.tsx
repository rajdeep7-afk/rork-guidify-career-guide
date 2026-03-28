import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Sparkles, TrendingUp } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Line, Polygon, Text as SvgText } from 'react-native-svg';
import { generateText } from '@rork-ai/toolkit-sdk';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';



export default function QuizResultsScreen() {
  const router = useRouter();
  const { user, updateProfile } = useAuth();
  const [showRecommendation, setShowRecommendation] = useState(false);
  const animationValue = useRef(new Animated.Value(0)).current;

  const scores = user?.personalityScores;

  useEffect(() => {
    Animated.timing(animationValue, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: false,
    }).start();
  }, []);

  const careerMutation = useMutation({
    mutationFn: async () => {
      if (!user || !scores) return '';

      const prompt = `You are a career counselor AI tasked with providing a personalized career recommendation based on a holistic analysis of the user's profile.

### User Profile:
**Name:** ${user.name}
**Current Skills:** ${user.skills?.length > 0 ? user.skills.join(', ') : 'No specific skills listed yet'}

### Personality Analysis Scores (0-100):
- Creative: ${scores.creative}
- Analytical: ${scores.analytical}
- Logical: ${scores.logical}
- Literacy: ${scores.literacy || 0}
- Communication: ${scores.communication}
- Problem Solving: ${scores.problemSolving}
- Leadership: ${scores.leadership || 0}

### Task:
Analyze this user's complete profile—their personality radar scores, existing skills, academic background, and potential interests. Do NOT use any predetermined mapping charts or rule-based logic. Instead, use natural reasoning to infer:

1. What cognitive patterns emerge from their personality scores?
2. What career domains align naturally with their strengths?
3. How do their current skills complement or indicate future directions?
4. What roles would leverage their top abilities while offering growth?

Based on your holistic analysis, recommend ONE career title (2-4 words maximum) that genuinely fits this user's unique profile.

Return ONLY the career title, nothing else.`;

      const response = await generateText(prompt);
      return response.trim();
    },
    onSuccess: async (career) => {
      if (career) {
        await updateProfile({ careerRecommendation: career });
        setShowRecommendation(true);
      }
    },
  });

  useEffect(() => {
    if (!user?.careerRecommendation) {
      careerMutation.mutate();
    } else {
      setShowRecommendation(true);
    }
  }, []);

  const handleContinue = async () => {
    await updateProfile({ onboardingCompleted: true });
    router.replace('/dashboard' as never);
  };

  if (!scores) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const categories = [
    { key: 'creative', label: 'Creative', color: '#F59E0B' },
    { key: 'analytical', label: 'Analytical', color: '#8B5CF6' },
    { key: 'logical', label: 'Logical', color: '#3B82F6' },
    { key: 'communication', label: 'Communication', color: '#EC4899' },
    { key: 'problemSolving', label: 'Problem Solving', color: '#06B6D4' },
    { key: 'leadership', label: 'Leadership', color: '#EF4444' },
  ];

  const topStrength = categories.reduce((max, cat) =>
    scores[cat.key as keyof typeof scores] > scores[max.key as keyof typeof scores] ? cat : max
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Sparkles size={28} color={Colors.primary} />
          <Text style={styles.headerTitle}>Your Results</Text>
        </View>
      </SafeAreaView>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.celebrationSection}>
          <Text style={styles.congratsText}>Congratulations, {user?.name || 'Student'}!</Text>
          <Text style={styles.subtitleText}>
            We have analyzed your personality and strengths
          </Text>
        </View>

        <View style={styles.strengthCard}>
          <TrendingUp size={32} color={topStrength.color} />
          <Text style={styles.strengthLabel}>Your Top Strength</Text>
          <Text style={[styles.strengthValue, { color: topStrength.color }]}>
            {topStrength.label}
          </Text>
          <Text style={styles.strengthScore}>{scores[topStrength.key as keyof typeof scores]}%</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personality Analysis</Text>
          <RadarChart categories={categories} scores={scores} animationValue={animationValue} />
        </View>

        {careerMutation.isPending && (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>
              Analyzing your profile for career recommendations...
            </Text>
          </View>
        )}

        {showRecommendation && user?.careerRecommendation && (
          <View style={styles.recommendationCard}>
            <Sparkles size={24} color={Colors.secondary} />
            <Text style={styles.recommendationLabel}>Recommended Career Path</Text>
            <Text style={styles.recommendationText}>{user.careerRecommendation}</Text>
            <Text style={styles.recommendationSubtext}>
              Based on your unique strengths and interests
            </Text>
          </View>
        )}

        <Pressable
          style={({ pressed }) => [styles.continueButton, pressed && styles.buttonPressed]}
          onPress={handleContinue}
        >
          <Text style={styles.continueButtonText}>Continue to Dashboard</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

interface RadarChartProps {
  categories: { key: string; label: string; color: string }[];
  scores: {
    creative: number;
    analytical: number;
    logical: number;
    literacy: number;
    communication: number;
    problemSolving: number;
    leadership: number;
  };
  animationValue: Animated.Value;
}

function RadarChart({ categories, scores, animationValue }: RadarChartProps) {
  const size = 340;
  const center = size / 2;
  const radius = size / 2 - 70;
  const numSides = categories.length;

  const getPoint = (index: number, value: number) => {
    const angle = (Math.PI * 2 * index) / numSides - Math.PI / 2;
    const distance = (value / 100) * radius;
    return {
      x: center + distance * Math.cos(angle),
      y: center + distance * Math.sin(angle),
    };
  };

  const getLabelPoint = (index: number) => {
    const angle = (Math.PI * 2 * index) / numSides - Math.PI / 2;
    const distance = radius + 45;
    return {
      x: center + distance * Math.cos(angle),
      y: center + distance * Math.sin(angle),
    };
  };

  const dataPoints = categories.map((cat, i) => {
    const score = scores[cat.key as keyof typeof scores];
    return getPoint(i, score);
  });

  const polygonPoints = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

  const gridLevels = [20, 40, 60, 80, 100];

  return (
    <View style={styles.radarContainer}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {gridLevels.map((level) => {
          const gridPoints = categories.map((_, index) => getPoint(index, level));
          const gridPolygon = gridPoints.map(p => `${p.x},${p.y}`).join(' ');
          return (
            <Polygon
              key={level}
              points={gridPolygon}
              fill="none"
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth="1"
            />
          );
        })}

        {categories.map((_, index) => {
          const point = getPoint(index, 100);
          return (
            <Line
              key={index}
              x1={center}
              y1={center}
              x2={point.x}
              y2={point.y}
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth="1"
            />
          );
        })}

        <Polygon
          points={polygonPoints}
          fill="#10b981"
          fillOpacity={0.3}
          stroke="#10b981"
          strokeWidth="3"
        />

        {dataPoints.map((point, i) => (
          <Circle
            key={i}
            cx={point.x}
            cy={point.y}
            r="5"
            fill="#10b981"
            stroke="#ffffff"
            strokeWidth="2"
          />
        ))}

        {categories.map((cat, i) => {
          const labelPos = getLabelPoint(i);
          const score = scores[cat.key as keyof typeof scores];
          return (
            <React.Fragment key={cat.key}>
              <SvgText
                x={labelPos.x}
                y={labelPos.y - 8}
                fill="#ffffff"
                fontSize="11"
                fontWeight="600"
                textAnchor="middle"
                alignmentBaseline="middle"
              >
                {cat.label}
              </SvgText>
              <SvgText
                x={labelPos.x}
                y={labelPos.y + 10}
                fill="#ffffff"
                fontSize="15"
                fontWeight="700"
                textAnchor="middle"
                alignmentBaseline="middle"
              >
                {score}%
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.text,
    marginLeft: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  celebrationSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  congratsText: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  strengthCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  strengthLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginTop: 12,
    marginBottom: 4,
  },
  strengthValue: {
    fontSize: 24,
    fontWeight: '800' as const,
    marginBottom: 4,
  },
  strengthScore: {
    fontSize: 48,
    fontWeight: '900' as const,
    color: Colors.text,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  radarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    backgroundColor: '#1e40af',
    borderRadius: 20,
    marginBottom: 20,
  },

  loadingCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
  },
  recommendationCard: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  recommendationLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 12,
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  recommendationSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  continueButton: {
    backgroundColor: Colors.secondary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  buttonPressed: {
    opacity: 0.7,
  },
});
