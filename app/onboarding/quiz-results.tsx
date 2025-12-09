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
import Svg, { Circle, Line, Polygon } from 'react-native-svg';
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

      const prompt = `Developer: # Part 1 — Personality Question Generator
- Begin with a concise checklist (3–7 bullets) outlining the planning steps before question generation.
- Brainstorm potential question topics relevant to the specified traits.
- Select and refine a single, short, and effective question targeting one or more traits.
- Ensure the question is clear, simple, and free of jargon.
- Confirm that response options fit precisely into the four required categories.

Generate one concise, impactful personality question designed to reveal a user's tendencies on:
- Creative
- Analytical
- Logical
- Literacy
- Communication
- Problem Solving

**Requirements:**
- The question must use clear, simple language without jargon.
- It should intuitively elicit personality tendencies.
- Limit answer choices to:
  - "Strongly Agree"
  - "Agree"
  - "Disagree"
  - "Strongly Disagree"

**Example styles (do not reuse these):**
- "I enjoy breaking down complex problems into simple steps."
- "I often come up with original ideas or new ways of doing things."
- "I feel confident expressing my thoughts to others."

After generating the question, self-validate in 1–2 lines that it directly targets at least one trait and uses plain language. If not, revise and repeat until requirements are met. After each generation, validate that the generated question meets all requirements before proceeding.

# Part 2 — Personality-Based Career Recommendation
Once all questions are answered, compute a 0–100 score for each trait:
- Creative
- Analytical
- Logical
- Literacy
- Communication
- Problem Solving

**Instructions:**
- Consider only the provided personality trait scores.
- Ignore user goals, ambitions, education, or background.
- Based exclusively on the highest trait cluster, recommend one career title (2–3 words maximum).
- Output only the career title in the specified JSON schema; do not include extra text.

**Strict Trait-to-Career Mapping:**
- High Creative + Communication → "Marketing Manager", "Content Creator", "Brand Designer"
- High Analytical + Logical + Problem Solving → "Software Engineer", "Data Scientist", "AI Engineer"
- High Literacy + Communication → "Writer", "Journalist", "Teacher"
- High Analytical + Literacy → "Research Analyst", "Business Analyst"
- High Creative + Problem Solving → "Product Designer", "Architect"
- If multiple clusters are close, select the one with the most clearly dominant score.

## Output Format
### Input Schema
1. **Question Generation:** No input needed.
2. **Career Recommendation:** Expect a JSON object with integer scores (0–100) for each dimension:

```json
{
  "scores": {
    "creative": 88,
    "analytical": 65,
    "logical": 70,
    "literacy": 54,
    "communication": 80,
    "problemSolving": 60
  }
}
```
- All fields are required and must be integers between 0 and 100.
- If any field is missing or invalid, return:
  `{ "error": "All score fields are required and must be integers between 0 and 100." }`

### Output Schema
- Success: `{ "career": "Software Engineer" }`
- Error: `{ "error": "All score fields are required and must be integers between 0 and 100." }`

### Example Response
```json
{
  "career": "Product Designer"
}
```

Always validate that outputs for Part 2 strictly conform to this JSON schema before submitting the response.
For straightforward mappings, set reasoning_effort = minimal.`;

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
            We&apos;ve analyzed your personality and strengths
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
          
          <View style={styles.legendContainer}>
            {categories.map((cat) => (
              <View key={cat.key} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: cat.color }]} />
                <Text style={styles.legendLabel}>{cat.label}</Text>
                <Text style={styles.legendValue}>{scores[cat.key as keyof typeof scores]}%</Text>
              </View>
            ))}
          </View>
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
  const size = 280;
  const center = size / 2;
  const radius = size / 2 - 40;
  const numSides = categories.length;

  const getPoint = (index: number, value: number) => {
    const angle = (Math.PI * 2 * index) / numSides - Math.PI / 2;
    const distance = (value / 100) * radius;
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
        {gridLevels.map((level, i) => {
          const gridPoints = categories.map((_, index) => getPoint(index, level));
          const gridPolygon = gridPoints.map(p => `${p.x},${p.y}`).join(' ');
          return (
            <Polygon
              key={level}
              points={gridPolygon}
              fill="none"
              stroke={Colors.border}
              strokeWidth="1"
              opacity={0.3}
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
              stroke={Colors.border}
              strokeWidth="1"
              opacity={0.3}
            />
          );
        })}

        <Polygon
          points={polygonPoints}
          fill={Colors.primary}
          fillOpacity={0.3}
          stroke={Colors.primary}
          strokeWidth="3"
        />

        {dataPoints.map((point, i) => (
          <Circle
            key={i}
            cx={point.x}
            cy={point.y}
            r="5"
            fill={categories[i].color}
            stroke={Colors.white}
            strokeWidth="2"
          />
        ))}
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
    paddingVertical: 20,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    marginBottom: 20,
  },
  legendContainer: {
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.surface,
    borderRadius: 12,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  legendLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  legendValue: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.primary,
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
