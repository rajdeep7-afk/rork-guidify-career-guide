import { useRouter } from 'expo-router';
import { ArrowLeft, ChevronLeft } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import { Alert, Animated, Dimensions, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { quizQuestions } from '@/data/quizQuestions';
import { PersonalityScores } from '@/types/user';
import Colors from '@/constants/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.85;
const SWIPE_THRESHOLD = 100;

const RESPONSIVE_FONT_SIZE = SCREEN_WIDTH < 350 ? 20 : SCREEN_WIDTH < 380 ? 22 : 24;
const RESPONSIVE_LINE_HEIGHT = RESPONSIVE_FONT_SIZE * 1.4;

const SWIPE_DIRECTIONS = {
  RIGHT: { value: 3, emoji: '😀', color: '#10b981' },
  LEFT: { value: 0, emoji: '😒', color: '#ef4444' },
  UP: { value: 2, emoji: '😍', color: '#3b82f6' },
  DOWN: { value: 1, emoji: '😭', color: '#9333ea' },
};

export default function QuizScreen() {
  const router = useRouter();
  const { updateProfile } = useAuth();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const progress = ((currentQuestion) / quizQuestions.length) * 100;

  const handleAnswer = (value: number) => {
    const questionId = quizQuestions[currentQuestion].id;
    setAnswers(prev => ({ ...prev, [questionId]: value }));

    setTimeout(() => {
      if (currentQuestion < quizQuestions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
      } else {
        handleSubmit();
      }
    }, 300);
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const calculateScores = (): PersonalityScores => {
    const rawScores: PersonalityScores = {
      creative: 0,
      analytical: 0,
      logical: 0,
      literacy: 0,
      communication: 0,
      problemSolving: 0,
      leadership: 0,
    };

    const categoryCount: Record<keyof PersonalityScores, number> = {
      creative: 0,
      analytical: 0,
      logical: 0,
      literacy: 0,
      communication: 0,
      problemSolving: 0,
      leadership: 0,
    };

    quizQuestions.forEach(q => {
      const answerIndex = answers[q.id];
      if (answerIndex !== undefined) {
        rawScores[q.category] += answerIndex;
        categoryCount[q.category] += 1;
      }
    });

    const normalizedScores: PersonalityScores = {
      creative: 0,
      analytical: 0,
      logical: 0,
      literacy: 0,
      communication: 0,
      problemSolving: 0,
      leadership: 0,
    };

    Object.keys(rawScores).forEach(key => {
      const k = key as keyof PersonalityScores;
      const count = categoryCount[k];
      if (count > 0) {
        const avgScore = rawScores[k] / count;
        const normalizedValue = (avgScore / 3) * 100;
        normalizedScores[k] = Math.round(normalizedValue * 0.8 + 10);
      } else {
        normalizedScores[k] = 50;
      }
    });

    return normalizedScores;
  };

  const handleSubmit = async () => {
    const answeredCount = Object.keys(answers).length;
    if (answeredCount < quizQuestions.length) {
      Alert.alert(
        'Incomplete Quiz',
        `You have answered ${answeredCount} out of ${quizQuestions.length} questions. Please answer all questions.`
      );
      return;
    }

    const scores = calculateScores();
    
    await updateProfile({
      personalityScores: scores,
      quizCompleted: true,
    });

    router.push('/onboarding/quiz-results' as never);
  };

  const question = quizQuestions[currentQuestion];

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={Colors.text} />
          </Pressable>
        </View>

        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${progress}%` }]} />
        </View>

        <Text style={styles.progressText}>
          {currentQuestion + 1} of {quizQuestions.length}
        </Text>
      </SafeAreaView>

      <View style={styles.content}>
        <SwipeCard
          key={question.id}
          question={question.question}
          questionNumber={currentQuestion + 1}
          onSwipe={handleAnswer}
        />
      </View>

      <SafeAreaView style={styles.bottomContainer} edges={['bottom']}>
        <Pressable
          style={({ pressed }) => [
            styles.previousButton,
            currentQuestion === 0 && styles.previousButtonDisabled,
            pressed && styles.buttonPressed,
          ]}
          onPress={handlePrevious}
          disabled={currentQuestion === 0}
        >
          <ChevronLeft size={24} color={currentQuestion === 0 ? Colors.textSecondary : Colors.primary} />
          <Text style={[styles.previousButtonText, currentQuestion === 0 && styles.previousButtonTextDisabled]}>
            Previous Question
          </Text>
        </Pressable>

        <Text style={styles.hintText}>Swipe the card to answer</Text>
      </SafeAreaView>
    </View>
  );
}

interface SwipeCardProps {
  question: string;
  questionNumber: number;
  onSwipe: (value: number) => void;
}

function SwipeCard({ question, questionNumber, onSwipe }: SwipeCardProps) {
  const pan = useRef(new Animated.ValueXY()).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const [swipeDirection, setSwipeDirection] = useState<keyof typeof SWIPE_DIRECTIONS | null>(null);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        Animated.spring(scale, {
          toValue: 1.05,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderMove: (_, gestureState) => {
        pan.setValue({ x: gestureState.dx, y: gestureState.dy });

        const rotateValue = gestureState.dx / SCREEN_WIDTH;
        rotate.setValue(rotateValue);

        if (Math.abs(gestureState.dx) > Math.abs(gestureState.dy)) {
          setSwipeDirection(gestureState.dx > 0 ? 'RIGHT' : 'LEFT');
        } else {
          setSwipeDirection(gestureState.dy < 0 ? 'UP' : 'DOWN');
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const { dx, dy } = gestureState;
        const isHorizontalSwipe = Math.abs(dx) > Math.abs(dy);
        const isVerticalSwipe = Math.abs(dy) > Math.abs(dx);

        let shouldSwipe = false;
        let swipeValue = 0;
        let animationTarget = { x: 0, y: 0 };

        if (isHorizontalSwipe && Math.abs(dx) > SWIPE_THRESHOLD) {
          shouldSwipe = true;
          if (dx > 0) {
            swipeValue = SWIPE_DIRECTIONS.RIGHT.value;
            animationTarget = { x: SCREEN_WIDTH, y: dy };
          } else {
            swipeValue = SWIPE_DIRECTIONS.LEFT.value;
            animationTarget = { x: -SCREEN_WIDTH, y: dy };
          }
        } else if (isVerticalSwipe && Math.abs(dy) > SWIPE_THRESHOLD) {
          shouldSwipe = true;
          if (dy < 0) {
            swipeValue = SWIPE_DIRECTIONS.UP.value;
            animationTarget = { x: dx, y: -SCREEN_HEIGHT };
          } else {
            swipeValue = SWIPE_DIRECTIONS.DOWN.value;
            animationTarget = { x: dx, y: SCREEN_HEIGHT };
          }
        }

        if (shouldSwipe) {
          Animated.parallel([
            Animated.timing(pan, {
              toValue: animationTarget,
              duration: 250,
              useNativeDriver: true,
            }),
            Animated.timing(scale, {
              toValue: 0.8,
              duration: 250,
              useNativeDriver: true,
            }),
            Animated.timing(rotate, {
              toValue: animationTarget.x > 0 ? 0.3 : -0.3,
              duration: 250,
              useNativeDriver: true,
            }),
          ]).start(() => {
            onSwipe(swipeValue);
          });
        } else {
          Animated.parallel([
            Animated.spring(pan, {
              toValue: { x: 0, y: 0 },
              friction: 6,
              tension: 40,
              useNativeDriver: true,
            }),
            Animated.spring(scale, {
              toValue: 1,
              friction: 6,
              tension: 40,
              useNativeDriver: true,
            }),
            Animated.spring(rotate, {
              toValue: 0,
              friction: 6,
              tension: 40,
              useNativeDriver: true,
            }),
          ]).start();
          setSwipeDirection(null);
        }
      },
    })
  ).current;

  const rotateInterpolate = rotate.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-15deg', '15deg'],
  });

  return (
    <View style={styles.cardContainer}>
      {swipeDirection && (
        <SwipeIndicators direction={swipeDirection} />
      )}

      <Animated.View
        style={[
          styles.card,
          {
            transform: [
              { translateX: pan.x },
              { translateY: pan.y },
              { rotate: rotateInterpolate },
              { scale },
            ],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <View style={styles.cardContent}>
          <View style={styles.questionNumberBadge}>
            <Text style={styles.questionNumberText}>Q{questionNumber}</Text>
          </View>

          <Text style={styles.cardQuestion}>{question}</Text>

          <View style={styles.swipeHints}>
            <View style={styles.hintRow}>
              <View style={[styles.hintBox, { backgroundColor: 'rgba(59, 130, 246, 0.08)' }]}>
                <Text style={styles.hintEmoji}>
                  {SWIPE_DIRECTIONS.UP.emoji}
                </Text>
              </View>
            </View>

            <View style={styles.hintRowCenter}>
              <View style={[styles.hintBox, { backgroundColor: 'rgba(239, 68, 68, 0.08)' }]}>
                <Text style={styles.hintEmoji}>
                  {SWIPE_DIRECTIONS.LEFT.emoji}
                </Text>
              </View>

              <View style={[styles.hintBox, { backgroundColor: 'rgba(16, 185, 129, 0.08)' }]}>
                <Text style={styles.hintEmoji}>
                  {SWIPE_DIRECTIONS.RIGHT.emoji}
                </Text>
              </View>
            </View>

            <View style={styles.hintRow}>
              <View style={[styles.hintBox, { backgroundColor: 'rgba(147, 51, 234, 0.08)' }]}>
                <Text style={styles.hintEmoji}>
                  {SWIPE_DIRECTIONS.DOWN.emoji}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

interface SwipeIndicatorsProps {
  direction: keyof typeof SWIPE_DIRECTIONS;
}

function SwipeIndicators({ direction }: SwipeIndicatorsProps) {
  const config = SWIPE_DIRECTIONS[direction];
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <>
      {direction === 'UP' && (
        <Animated.View style={[styles.indicator, styles.indicatorTop, { opacity, transform: [{ scale }] }]}>
          <Text style={styles.indicatorEmojiLarge}>{config.emoji}</Text>
        </Animated.View>
      )}
      {direction === 'DOWN' && (
        <Animated.View style={[styles.indicator, styles.indicatorBottom, { opacity, transform: [{ scale }] }]}>
          <Text style={styles.indicatorEmojiLarge}>{config.emoji}</Text>
        </Animated.View>
      )}
      {direction === 'LEFT' && (
        <Animated.View style={[styles.indicator, styles.indicatorLeft, { opacity, transform: [{ scale }] }]}>
          <Text style={styles.indicatorEmojiLarge}>{config.emoji}</Text>
        </Animated.View>
      )}
      {direction === 'RIGHT' && (
        <Animated.View style={[styles.indicator, styles.indicatorRight, { opacity, transform: [{ scale }] }]}>
          <Text style={styles.indicatorEmojiLarge}>{config.emoji}</Text>
        </Animated.View>
      )}
    </>
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
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: Colors.border,
    marginHorizontal: 20,
    marginTop: 8,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 12,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  cardContainer: {
    width: CARD_WIDTH,
    minHeight: SCREEN_HEIGHT * 0.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    minHeight: SCREEN_HEIGHT * 0.5,
    backgroundColor: Colors.white,
    borderRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  cardContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    justifyContent: 'space-between',
  },
  questionNumberBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  questionNumberText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  cardQuestion: {
    fontSize: RESPONSIVE_FONT_SIZE,
    fontWeight: '700' as const,
    color: Colors.text,
    lineHeight: RESPONSIVE_LINE_HEIGHT,
    textAlign: 'center',
    flexGrow: 1,
    flexShrink: 0,
    marginVertical: 20,
    alignSelf: 'center',
    width: '100%',
  },
  swipeHints: {
    gap: 12,
  },
  hintRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hintRowCenter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hintBox: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hintEmoji: {
    fontSize: 32,
  },
  indicator: {
    position: 'absolute',
    paddingHorizontal: 32,
    paddingVertical: 24,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  indicatorTop: {
    top: 100,
  },
  indicatorBottom: {
    bottom: 180,
  },
  indicatorLeft: {
    left: 20,
    top: '50%',
    marginTop: -30,
  },
  indicatorRight: {
    right: 20,
    top: '50%',
    marginTop: -30,
  },
  indicatorEmojiLarge: {
    fontSize: 56,
  },
  bottomContainer: {
    backgroundColor: Colors.background,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    gap: 12,
  },
  previousButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  previousButtonDisabled: {
    opacity: 0.4,
  },
  previousButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  previousButtonTextDisabled: {
    color: Colors.textSecondary,
  },
  hintText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  buttonPressed: {
    opacity: 0.7,
  },
});
