import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Audio } from 'expo-av';
import { ArrowLeft, Mic, MicOff, Play, Sparkles, TrendingUp, Volume2 } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
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

type InterviewMode = 'select' | 'interviewing' | 'results';
type InterviewType = 'hr' | 'technical' | 'college' | 'internship';

interface InterviewResult {
  overallScore: number;
  clarityScore: number;
  confidenceScore: number;
  technicalScore: number;
  communicationScore: number;
  feedback: string;
  improvements: string[];
}

export default function InterviewBotScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [mode, setMode] = useState<InterviewMode>('select');
  const [interviewType, setInterviewType] = useState<InterviewType | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [result, setResult] = useState<InterviewResult | null>(null);
  const [isPlayingQuestion, setIsPlayingQuestion] = useState(false);

  const questionsMutation = useMutation({
    mutationFn: async (type: InterviewType) => {
      const prompt = `Generate 5 interview questions for a ${type} interview.

User Profile:
- Career Goal: ${user?.careerRecommendation || 'Not specified'}
- Skills: ${user?.skills.join(', ') || 'General'}

Question types:
- HR: Behavioral, situational, motivation questions
- Technical: Domain-specific technical questions
- College: Admission interview questions about goals, interests
- Internship: Questions about learning, projects, initiative

Return as JSON array: ["Question 1?", "Question 2?", ...]`;

      const response = await generateText(prompt);
      const jsonMatch = response.match(/\[[\s\S]*?\]/);
      if (!jsonMatch) throw new Error('Invalid format');
      
      const qs = JSON.parse(jsonMatch[0]) as string[];
      return qs.slice(0, 5);
    },
    onSuccess: (data) => {
      setQuestions(data);
      setMode('interviewing');
    },
  });

  const evaluationMutation = useMutation({
    mutationFn: async () => {
      const interviewData = questions.map((q, i) => ({
        question: q,
        answer: answers[i] || 'No response provided',
      }));

      const prompt = `Evaluate this interview performance. Provide scores (0-100) and feedback.

Interview Type: ${interviewType}
Career Field: ${user?.careerRecommendation || 'General'}

Q&A:
${interviewData.map((item, i) => `${i + 1}. Q: ${item.question}\n   A: ${item.answer}`).join('\n\n')}

Return as JSON:
{
  "overallScore": 75,
  "clarityScore": 80,
  "confidenceScore": 70,
  "technicalScore": 75,
  "communicationScore": 80,
  "feedback": "Overall assessment paragraph",
  "improvements": ["Improvement 1", "Improvement 2", "Improvement 3"]
}`;

      const response = await generateText(prompt);
      const jsonMatch = response.match(/\{[\s\S]*?\}/);
      if (!jsonMatch) throw new Error('Invalid format');
      
      return JSON.parse(jsonMatch[0]) as InterviewResult;
    },
    onSuccess: (data) => {
      setResult(data);
      setMode('results');
    },
  });

  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Microphone access is required for voice interviews.');
        }
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
      }
    })();
  }, []);

  const startInterview = (type: InterviewType) => {
    setInterviewType(type);
    questionsMutation.mutate(type);
  };

  const startRecording = async () => {
    try {
      if (Platform.OS === 'web') {
        Alert.alert('Web Platform', 'Voice recording works best on mobile devices. For now, you can simulate responses.');
        const mockAnswer = `This is a simulated answer for the question: "${questions[currentQuestionIndex]}". In a real scenario, your spoken response would be transcribed here.`;
        setAnswers(prev => {
          const updated = [...prev];
          updated[currentQuestionIndex] = mockAnswer;
          return updated;
        });
        return;
      }

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(newRecording);
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      setIsProcessing(true);
      await recording.stopAndUnloadAsync();
      
      const mockAnswer = `Recorded answer for: "${questions[currentQuestionIndex]}". (Speech-to-text would transcribe the actual spoken response here)`;
      setAnswers(prev => {
        const updated = [...prev];
        updated[currentQuestionIndex] = mockAnswer;
        return updated;
      });
      
      setRecording(null);
    } catch (error) {
      console.error('Failed to stop recording:', error);
    } finally {
      setIsProcessing(false);
      if (Platform.OS !== 'web') {
        await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      }
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      evaluationMutation.mutate();
    }
  };

  const handlePlayQuestion = () => {
    if (Platform.OS === 'web') {
      Alert.alert('Question', questions[currentQuestionIndex]);
      return;
    }
    setIsPlayingQuestion(true);
    setTimeout(() => setIsPlayingQuestion(false), 2000);
  };

  if (mode === 'select') {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color={Colors.text} />
            </Pressable>
            <Text style={styles.headerTitle}>Interview Bot</Text>
            <View style={styles.placeholder} />
          </View>
        </SafeAreaView>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.pageTitle}>Choose Interview Type</Text>
          <Text style={styles.pageSubtitle}>
            Practice with AI-powered interview questions
          </Text>

          <Pressable
            style={({ pressed }) => [styles.typeCard, pressed && styles.buttonPressed]}
            onPress={() => startInterview('hr')}
          >
            <Sparkles size={32} color={Colors.primary} />
            <Text style={styles.typeTitle}>HR Interview</Text>
            <Text style={styles.typeDescription}>
              Behavioral questions, situational scenarios, motivation
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.typeCard, pressed && styles.buttonPressed]}
            onPress={() => startInterview('technical')}
          >
            <TrendingUp size={32} color={Colors.secondary} />
            <Text style={styles.typeTitle}>Technical Interview</Text>
            <Text style={styles.typeDescription}>
              Domain-specific technical questions and problem-solving
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.typeCard, pressed && styles.buttonPressed]}
            onPress={() => startInterview('college')}
          >
            <Volume2 size={32} color={Colors.accent} />
            <Text style={styles.typeTitle}>College Admission</Text>
            <Text style={styles.typeDescription}>
              Questions about goals, interests, and academic aspirations
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.typeCard, pressed && styles.buttonPressed]}
            onPress={() => startInterview('internship')}
          >
            <Mic size={32} color='#10B981' />
            <Text style={styles.typeTitle}>Internship Interview</Text>
            <Text style={styles.typeDescription}>
              Questions about learning goals, projects, and initiative
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  if (mode === 'interviewing') {
    if (questionsMutation.isPending) {
      return (
        <View style={styles.loadingFullScreen}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Preparing interview questions...</Text>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color={Colors.text} />
            </Pressable>
            <Text style={styles.headerTitle}>
              Question {currentQuestionIndex + 1}/{questions.length}
            </Text>
            <View style={styles.placeholder} />
          </View>
        </SafeAreaView>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.questionCard}>
            <Pressable
              style={({ pressed }) => [styles.playButton, pressed && styles.buttonPressed]}
              onPress={handlePlayQuestion}
            >
              <Play size={20} color={Colors.white} />
              <Text style={styles.playButtonText}>
                {isPlayingQuestion ? 'Playing...' : 'Play Question'}
              </Text>
            </Pressable>
            
            <Text style={styles.questionText}>{questions[currentQuestionIndex]}</Text>
          </View>

          <View style={styles.recordingSection}>
            {!answers[currentQuestionIndex] ? (
              <>
                <Pressable
                  style={({ pressed }) => [
                    styles.recordButton,
                    isRecording && styles.recordButtonActive,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={isRecording ? stopRecording : startRecording}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <ActivityIndicator size="large" color={Colors.white} />
                  ) : isRecording ? (
                    <MicOff size={48} color={Colors.white} />
                  ) : (
                    <Mic size={48} color={Colors.white} />
                  )}
                </Pressable>
                <Text style={styles.recordingText}>
                  {isProcessing
                    ? 'Processing...'
                    : isRecording
                    ? 'Recording... Tap to stop'
                    : 'Tap to record your answer'}
                </Text>
              </>
            ) : (
              <>
                <View style={styles.answeredCard}>
                  <Text style={styles.answeredLabel}>Your Answer:</Text>
                  <Text style={styles.answeredText}>{answers[currentQuestionIndex]}</Text>
                </View>
                <Pressable
                  style={({ pressed }) => [styles.nextButton, pressed && styles.buttonPressed]}
                  onPress={handleNext}
                >
                  <Text style={styles.nextButtonText}>
                    {currentQuestionIndex === questions.length - 1 ? 'Finish Interview' : 'Next Question'}
                  </Text>
                </Pressable>
              </>
            )}
          </View>
        </ScrollView>
      </View>
    );
  }

  if (mode === 'results') {
    if (evaluationMutation.isPending) {
      return (
        <View style={styles.loadingFullScreen}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Evaluating your performance...</Text>
        </View>
      );
    }

    if (!result) return null;

    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.header}>
            <View style={styles.placeholder} />
            <Text style={styles.headerTitle}>Interview Results</Text>
            <View style={styles.placeholder} />
          </View>
        </SafeAreaView>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.scoreCard}>
            <Text style={styles.overallScoreLabel}>Overall Score</Text>
            <Text style={styles.overallScoreValue}>{result.overallScore}%</Text>
            <Text style={styles.overallScoreGrade}>
              {result.overallScore >= 80 ? 'Excellent!' : result.overallScore >= 60 ? 'Good!' : 'Keep Practicing!'}
            </Text>
          </View>

          <View style={styles.scoresGrid}>
            <View style={styles.scoreItem}>
              <Text style={styles.scoreLabel}>Clarity</Text>
              <Text style={styles.scoreValue}>{result.clarityScore}%</Text>
            </View>
            <View style={styles.scoreItem}>
              <Text style={styles.scoreLabel}>Confidence</Text>
              <Text style={styles.scoreValue}>{result.confidenceScore}%</Text>
            </View>
            <View style={styles.scoreItem}>
              <Text style={styles.scoreLabel}>Technical</Text>
              <Text style={styles.scoreValue}>{result.technicalScore}%</Text>
            </View>
            <View style={styles.scoreItem}>
              <Text style={styles.scoreLabel}>Communication</Text>
              <Text style={styles.scoreValue}>{result.communicationScore}%</Text>
            </View>
          </View>

          <View style={styles.feedbackCard}>
            <Text style={styles.feedbackTitle}>Feedback</Text>
            <Text style={styles.feedbackText}>{result.feedback}</Text>
          </View>

          <View style={styles.improvementsCard}>
            <Text style={styles.improvementsTitle}>Areas for Improvement</Text>
            {result.improvements.map((improvement, index) => (
              <View key={index} style={styles.improvementItem}>
                <View style={styles.improvementBullet} />
                <Text style={styles.improvementText}>{improvement}</Text>
              </View>
            ))}
          </View>

          <Pressable
            style={styles.doneButton}
            onPress={() => router.back()}
          >
            <Text style={styles.doneButtonText}>Back to Dashboard</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  return null;
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
  loadingFullScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 16,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  pageSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  typeCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typeTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 12,
    marginBottom: 8,
  },
  typeDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  questionCard: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    padding: 24,
    marginBottom: 32,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 16,
    gap: 8,
  },
  playButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  questionText: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.white,
    lineHeight: 28,
  },
  recordingSection: {
    alignItems: 'center',
  },
  recordButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  recordButtonActive: {
    backgroundColor: Colors.error,
  },
  recordingText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    textAlign: 'center',
  },
  answeredCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    width: '100%',
  },
  answeredLabel: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.primary,
    marginBottom: 8,
  },
  answeredText: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
  },
  nextButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  scoreCard: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
  },
  overallScoreLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  overallScoreValue: {
    fontSize: 64,
    fontWeight: '900' as const,
    color: Colors.white,
  },
  overallScoreGrade: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 8,
  },
  scoresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  scoreItem: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    flex: 1,
    minWidth: '45%',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  scoreLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  feedbackCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  feedbackText: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
  },
  improvementsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  improvementsTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  improvementItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  improvementBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.secondary,
    marginTop: 6,
    marginRight: 12,
  },
  improvementText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  doneButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.white,
  },
});
