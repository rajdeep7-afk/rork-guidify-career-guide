import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { ArrowLeft, Award, BookOpen, Check, FileText, Upload, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { generateText } from '@rork-ai/toolkit-sdk';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';
import { trpc } from '@/lib/trpc';
import { extractTextFromFile } from '@/lib/resume-parser';

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

type TestMode = 'select' | 'configure' | 'testing' | 'results';

export default function AptitudeTestScreen() {
  const router = useRouter();
  useAuth();

  const [mode, setMode] = useState<TestMode>('select');
  const [testType, setTestType] = useState<'subject' | 'resume'>('subject');
  
  const [subject, setSubject] = useState('');
  
  const [resumeFile, setResumeFile] = useState<{ name: string; uri: string; content?: string } | null>(null);
  const [extractedSkills, setExtractedSkills] = useState<string[]>([]);
  const [isProcessingResume, setIsProcessingResume] = useState(false);
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [currentDifficulty, setCurrentDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [correctStreak, setCorrectStreak] = useState(0);
  const [incorrectStreak, setIncorrectStreak] = useState(0);

  const parseResumeMutation = trpc.resume.parse.useMutation({
    onSuccess: (data) => {
      console.log('[Aptitude Test] Resume parsed successfully:', data);
      setExtractedSkills(data.skills || []);
      setIsProcessingResume(false);
    },
    onError: (error) => {
      console.error('[Aptitude Test] Resume parsing error:', error);
      setIsProcessingResume(false);
      Alert.alert('Error', 'Failed to parse resume. Using fallback skills.');
      setExtractedSkills(['General Knowledge', 'Problem Solving', 'Analytical Thinking']);
    },
  });

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      console.log('[Aptitude Test] File picked:', file.name);
      
      setResumeFile({
        name: file.name,
        uri: file.uri,
      });
      
      setIsProcessingResume(true);

      const resumeText = await extractTextFromFile(file.uri, file.name);
      
      parseResumeMutation.mutate({
        resumeText,
        profileType: 'experienced',
      });
    } catch (error) {
      console.error('[Aptitude Test] Error picking document:', error);
      setIsProcessingResume(false);
      Alert.alert('Error', 'Failed to pick document. Please try again.');
    }
  };



  const generateAdaptiveQuestion = useMutation({
    mutationFn: async (difficulty: 'easy' | 'medium' | 'hard') => {
      const topicBase = testType === 'subject' ? subject : extractedSkills.join(', ');
      
      const prompt = `Generate exactly 1 multiple-choice question about "${topicBase}" at ${difficulty} difficulty level.

Difficulty Guidelines:
- Easy: Basic concepts, definitions, simple recall
- Medium: Application of concepts, moderate problem-solving
- Hard: Complex scenarios, advanced analysis, deep understanding

Generate 1 question with 4 options. Format as JSON:
{
  "question": "Question text here?",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": 0,
  "difficulty": "${difficulty}"
}

correctAnswer is the index (0-3) of the correct option.
Return ONLY valid JSON, no other text.`;

      const response = await generateText(prompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Invalid response format');
      
      const parsed = JSON.parse(jsonMatch[0]) as Question;
      return parsed;
    },
    onSuccess: (data) => {
      setQuestions(prev => [...prev, data]);
    },
    onError: () => {
      Alert.alert('Error', 'Failed to generate question. Please try again.');
    },
  });

  const generateInitialQuestions = useMutation({
    mutationFn: async () => {
      const topicBase = testType === 'subject' ? subject : extractedSkills.join(', ');
      
      const prompt = `Generate exactly 10 multiple-choice questions about "${topicBase}" with adaptive difficulty.

Create a mix of difficulties:
- 3 easy questions (basic concepts)
- 4 medium questions (application)
- 3 hard questions (advanced)

Generate 10 questions with 4 options each. Format as JSON array:
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "difficulty": "easy"
  }
]

correctAnswer is the index (0-3) of the correct option.
Return ONLY valid JSON, no other text.`;

      const response = await generateText(prompt);
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error('Invalid response format');
      
      const parsed = JSON.parse(jsonMatch[0]) as Question[];
      if (parsed.length !== 10) throw new Error('Expected 10 questions');
      
      return parsed;
    },
    onSuccess: (data) => {
      setQuestions(data);
      setMode('testing');
      setCurrentQuestion(0);
      setAnswers({});
      setCurrentDifficulty('medium');
      setCorrectStreak(0);
      setIncorrectStreak(0);
    },
    onError: () => {
      Alert.alert('Error', 'Failed to generate questions. Please try again.');
    },
  });

  const handleStart = () => {
    if (testType === 'subject') {
      if (!subject.trim()) {
        Alert.alert('Missing Information', 'Please enter a subject');
        return;
      }
      generateInitialQuestions.mutate();
    } else {
      if (!resumeFile) {
        Alert.alert('Missing Resume', 'Please upload your resume first');
        return;
      }
      if (extractedSkills.length === 0) {
        Alert.alert('Processing', 'Please wait while we process your resume');
        return;
      }
      generateInitialQuestions.mutate();
    }
  };

  const handleAnswer = (optionIndex: number) => {
    setAnswers(prev => ({ ...prev, [currentQuestion]: optionIndex }));
    
    const question = questions[currentQuestion];
    const isCorrect = optionIndex === question.correctAnswer;
    
    if (isCorrect) {
      const newStreak = correctStreak + 1;
      setCorrectStreak(newStreak);
      setIncorrectStreak(0);
      
      if (newStreak >= 2 && currentDifficulty !== 'hard') {
        const nextDifficulty = currentDifficulty === 'easy' ? 'medium' : 'hard';
        setCurrentDifficulty(nextDifficulty);
        console.log(`Increasing difficulty to ${nextDifficulty} (${newStreak} correct in a row)`);
      }
    } else {
      const newStreak = incorrectStreak + 1;
      setIncorrectStreak(newStreak);
      setCorrectStreak(0);
      
      if (newStreak >= 2 && currentDifficulty !== 'easy') {
        const nextDifficulty = currentDifficulty === 'hard' ? 'medium' : 'easy';
        setCurrentDifficulty(nextDifficulty);
        console.log(`Decreasing difficulty to ${nextDifficulty} (${newStreak} incorrect in a row)`);
      }
    }
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else if (currentQuestion === questions.length - 1 && questions.length < 15) {
      console.log(`Generating next question at ${currentDifficulty} difficulty`);
      generateAdaptiveQuestion.mutate(currentDifficulty);
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    const answered = Object.keys(answers).length;
    if (answered < questions.length) {
      Alert.alert(
        'Incomplete Test',
        `You have answered ${answered} out of ${questions.length} questions. Submit anyway?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Submit', onPress: () => setShowResults(true) },
        ]
      );
    } else {
      setShowResults(true);
    }
  };

  const calculateResults = () => {
    let correct = 0;
    questions.forEach((q, index) => {
      if (answers[index] === q.correctAnswer) {
        correct++;
      }
    });
    return {
      correct,
      total: questions.length,
      percentage: Math.round((correct / questions.length) * 100),
    };
  };

  if (mode === 'select') {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color={Colors.text} />
            </Pressable>
            <Text style={styles.headerTitle}>Aptitude Test</Text>
            <View style={styles.placeholder} />
          </View>
        </SafeAreaView>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.pageTitle}>Choose Test Type</Text>
          <Text style={styles.pageSubtitle}>Select how you want to take the test</Text>

          <Pressable
            style={[styles.testTypeCard, testType === 'subject' && styles.testTypeCardActive]}
            onPress={() => {
              setTestType('subject');
              setMode('configure');
            }}
          >
            <BookOpen size={32} color={testType === 'subject' ? Colors.primary : Colors.textSecondary} />
            <Text style={[styles.testTypeTitle, testType === 'subject' && styles.testTypeTitleActive]}>
              Subject-Based Test
            </Text>
            <Text style={styles.testTypeDescription}>
              Take a test on a specific subject with AI-adaptive difficulty
            </Text>
          </Pressable>

          <Pressable
            style={[styles.testTypeCard, testType === 'resume' && styles.testTypeCardActive]}
            onPress={() => {
              setTestType('resume');
              setMode('configure');
            }}
          >
            <FileText size={32} color={testType === 'resume' ? Colors.primary : Colors.textSecondary} />
            <Text style={[styles.testTypeTitle, testType === 'resume' && styles.testTypeTitleActive]}>
              Resume-Based Test
            </Text>
            <Text style={styles.testTypeDescription}>
              Upload your resume and get questions based on your skills
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  if (mode === 'configure') {
    if (testType === 'resume') {
      return (
        <View style={styles.container}>
          <SafeAreaView style={styles.safeArea} edges={['top']}>
            <View style={styles.header}>
              <Pressable onPress={() => setMode('select')} style={styles.backButton}>
                <ArrowLeft size={24} color={Colors.text} />
              </Pressable>
              <Text style={styles.headerTitle}>Resume-Based Test</Text>
              <View style={styles.placeholder} />
            </View>
          </SafeAreaView>

          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            <Text style={styles.pageTitle}>Upload Your Resume</Text>
            <Text style={styles.pageSubtitle}>
              We&apos;ll analyze your resume and create a personalized adaptive test
            </Text>

            {!resumeFile ? (
              <Pressable
                style={({ pressed }) => [styles.uploadCard, pressed && styles.buttonPressed]}
                onPress={pickDocument}
              >
                <Upload size={48} color={Colors.primary} />
                <Text style={styles.uploadTitle}>Upload Resume</Text>
                <Text style={styles.uploadSubtitle}>PDF, DOCX, or TXT format</Text>
              </Pressable>
            ) : (
              <View>
                <View style={styles.fileCard}>
                  <FileText size={32} color={Colors.success} />
                  <View style={styles.fileInfo}>
                    <Text style={styles.fileName}>{resumeFile.name}</Text>
                    {isProcessingResume ? (
                      <View style={styles.processingContainer}>
                        <ActivityIndicator size="small" color={Colors.primary} />
                        <Text style={styles.processingText}>Analyzing resume...</Text>
                      </View>
                    ) : (
                      <Text style={styles.fileStatus}>✓ Processed successfully</Text>
                    )}
                  </View>
                  <Pressable
                    onPress={() => {
                      setResumeFile(null);
                      setExtractedSkills([]);
                    }}
                    style={styles.removeButton}
                  >
                    <X size={20} color={Colors.error} />
                  </Pressable>
                </View>

                {extractedSkills.length > 0 && (
                  <View style={styles.skillsContainer}>
                    <Text style={styles.skillsTitle}>Extracted Skills ({extractedSkills.length})</Text>
                    <View style={styles.skillsGrid}>
                      {extractedSkills.map((skill, index) => (
                        <View key={index} style={styles.skillChip}>
                          <Text style={styles.skillText}>{skill}</Text>
                        </View>
                      ))}
                    </View>
                    <Text style={styles.skillsNote}>
                      Questions will adapt based on your performance
                    </Text>
                  </View>
                )}

                <Pressable
                  style={({ pressed }) => [
                    styles.startButton,
                    pressed && styles.buttonPressed,
                    (isProcessingResume || generateInitialQuestions.isPending) && styles.buttonDisabled,
                  ]}
                  onPress={handleStart}
                  disabled={isProcessingResume || generateInitialQuestions.isPending || extractedSkills.length === 0}
                >
                  <Text style={styles.startButtonText}>
                    {generateInitialQuestions.isPending
                      ? 'Generating Questions...'
                      : isProcessingResume
                      ? 'Processing Resume...'
                      : 'Start Adaptive Test'}
                  </Text>
                </Pressable>
              </View>
            )}
          </ScrollView>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.header}>
            <Pressable onPress={() => setMode('select')} style={styles.backButton}>
              <ArrowLeft size={24} color={Colors.text} />
            </Pressable>
            <Text style={styles.headerTitle}>Configure Test</Text>
            <View style={styles.placeholder} />
          </View>
        </SafeAreaView>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.pageTitle}>Subject-Based Test</Text>
          <Text style={styles.pageSubtitle}>
            Enter the subject you want to test. Difficulty will adapt based on your performance.
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Which subject do you want to give the test for?</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter subject (e.g., Mathematics, Physics, Computer Science)"
              value={subject}
              onChangeText={setSubject}
              multiline
            />
            <Text style={styles.hint}>
              The test will start at medium difficulty and adjust automatically based on your answers.
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.startButton,
              pressed && styles.buttonPressed,
              generateInitialQuestions.isPending && styles.buttonDisabled,
            ]}
            onPress={handleStart}
            disabled={generateInitialQuestions.isPending}
          >
            <Text style={styles.startButtonText}>
              {generateInitialQuestions.isPending ? 'Generating Questions...' : 'Start Adaptive Test'}
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  if (mode === 'testing' && !showResults) {
    if (generateAdaptiveQuestion.isPending || currentQuestion >= questions.length) {
      return (
        <View style={styles.container}>
          <SafeAreaView style={styles.safeArea} edges={['top']}>
            <View style={styles.header}>
              <View style={styles.placeholder} />
              <Text style={styles.headerTitle}>Loading...</Text>
              <View style={styles.placeholder} />
            </View>
          </SafeAreaView>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Generating next question...</Text>
            <Text style={styles.loadingSubtext}>Difficulty: {currentDifficulty}</Text>
          </View>
        </View>
      );
    }

    const question = questions[currentQuestion];
    const progress = ((currentQuestion + 1) / Math.max(questions.length, 10)) * 100;

    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.header}>
            <Pressable
              onPress={() => {
                Alert.alert('Exit Test', 'Are you sure you want to exit? Progress will be lost.', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Exit', onPress: () => router.back(), style: 'destructive' },
                ]);
              }}
              style={styles.backButton}
            >
              <X size={24} color={Colors.error} />
            </Pressable>
            <Text style={styles.questionCount}>
              {currentQuestion + 1} / {Math.max(questions.length, 10)}
            </Text>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${progress}%` }]} />
          </View>
        </SafeAreaView>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.difficultyBadge}>
            <Text style={styles.difficultyText}>Difficulty: {question.difficulty}</Text>
          </View>

          <Text style={styles.questionNumber}>Question {currentQuestion + 1}</Text>
          <Text style={styles.questionText}>{question.question}</Text>

          <View style={styles.optionsContainer}>
            {question.options.map((option, index) => {
              const isSelected = answers[currentQuestion] === index;
              return (
                <Pressable
                  key={index}
                  style={({ pressed }) => [
                    styles.optionCard,
                    isSelected && styles.optionCardSelected,
                    pressed && styles.optionCardPressed,
                  ]}
                  onPress={() => handleAnswer(index)}
                >
                  <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                    {String.fromCharCode(65 + index)}
                  </Text>
                  <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                    {option}
                  </Text>
                  {isSelected && (
                    <View style={styles.checkmark}>
                      <Check size={18} color={Colors.white} strokeWidth={3} />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>

          <View style={styles.navigationButtons}>
            <Pressable
              style={[styles.navButton, currentQuestion === 0 && styles.navButtonDisabled]}
              onPress={handlePrevious}
              disabled={currentQuestion === 0}
            >
              <Text style={styles.navButtonText}>Previous</Text>
            </Pressable>

            {currentQuestion >= 9 ? (
              <Pressable style={styles.submitButton} onPress={handleSubmit}>
                <Text style={styles.submitButtonText}>Submit Test</Text>
              </Pressable>
            ) : (
              <Pressable 
                style={[styles.nextButton, !answers[currentQuestion] && styles.navButtonDisabled]} 
                onPress={handleNext}
                disabled={answers[currentQuestion] === undefined}
              >
                <Text style={styles.nextButtonText}>Next</Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
      </View>
    );
  }

  if (showResults) {
    const results = calculateResults();
    const grade =
      results.percentage >= 90
        ? 'Excellent'
        : results.percentage >= 75
        ? 'Great'
        : results.percentage >= 60
        ? 'Good'
        : results.percentage >= 40
        ? 'Fair'
        : 'Needs Improvement';

    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.header}>
            <View style={styles.placeholder} />
            <Text style={styles.headerTitle}>Test Results</Text>
            <View style={styles.placeholder} />
          </View>
        </SafeAreaView>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.resultsHeader}>
            <Award size={64} color={Colors.secondary} />
            <Text style={styles.gradeText}>{grade}!</Text>
            <Text style={styles.scoreText}>
              {results.correct} / {results.total}
            </Text>
            <Text style={styles.percentageText}>{results.percentage}%</Text>
          </View>

          <View style={styles.resultsCard}>
            <Text style={styles.resultsCardTitle}>Performance Summary</Text>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Correct Answers:</Text>
              <Text style={[styles.statValue, { color: Colors.success }]}>{results.correct}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Incorrect Answers:</Text>
              <Text style={[styles.statValue, { color: Colors.error }]}>
                {results.total - results.correct}
              </Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Score:</Text>
              <Text style={styles.statValue}>{results.percentage}%</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>AI Adaptation:</Text>
              <Text style={styles.statValue}>Enabled</Text>
            </View>
          </View>

          <Text style={styles.reviewTitle}>Review Answers</Text>
          {questions.map((q, index) => {
            const userAnswer = answers[index];
            const isCorrect = userAnswer === q.correctAnswer;
            
            return (
              <View key={index} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewQuestionNumber}>Question {index + 1}</Text>
                  {isCorrect ? (
                    <View style={[styles.resultBadge, { backgroundColor: Colors.success + '20' }]}>
                      <Check size={16} color={Colors.success} />
                      <Text style={[styles.resultBadgeText, { color: Colors.success }]}>Correct</Text>
                    </View>
                  ) : (
                    <View style={[styles.resultBadge, { backgroundColor: Colors.error + '20' }]}>
                      <X size={16} color={Colors.error} />
                      <Text style={[styles.resultBadgeText, { color: Colors.error }]}>Incorrect</Text>
                    </View>
                  )}
                </View>
                <View style={styles.difficultyBadgeSmall}>
                  <Text style={styles.difficultyTextSmall}>{q.difficulty}</Text>
                </View>
                <Text style={styles.reviewQuestion}>{q.question}</Text>
                {userAnswer !== undefined && (
                  <Text style={[styles.reviewAnswer, !isCorrect && { color: Colors.error }]}>
                    Your answer: {q.options[userAnswer]}
                  </Text>
                )}
                {!isCorrect && (
                  <Text style={[styles.reviewAnswer, { color: Colors.success }]}>
                    Correct answer: {q.options[q.correctAnswer]}
                  </Text>
                )}
              </View>
            );
          })}

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
    lineHeight: 22,
  },
  testTypeCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: Colors.border,
    position: 'relative' as const,
  },
  testTypeCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surfaceLight,
  },
  testTypeTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 12,
    marginBottom: 8,
  },
  testTypeTitleActive: {
    color: Colors.primary,
  },
  testTypeDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 8,
    fontStyle: 'italic' as const,
  },
  startButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  questionCount: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: Colors.border,
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  difficultyBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.secondary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 12,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.secondary,
    textTransform: 'capitalize' as const,
  },
  difficultyBadgeSmall: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  difficultyTextSmall: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.primary,
    textTransform: 'capitalize' as const,
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
    marginBottom: 8,
  },
  questionText: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 24,
    lineHeight: 28,
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  optionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionCardSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  optionCardPressed: {
    opacity: 0.7,
  },
  optionLabel: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: 32,
  },
  optionLabelSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    color: Colors.white,
  },
  optionText: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.text,
    flex: 1,
    lineHeight: 20,
  },
  optionTextSelected: {
    color: Colors.white,
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  navigationButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  navButton: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  nextButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  submitButton: {
    flex: 1,
    backgroundColor: Colors.secondary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  resultsHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  gradeText: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: Colors.text,
    marginTop: 16,
  },
  scoreText: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  percentageText: {
    fontSize: 48,
    fontWeight: '900' as const,
    color: Colors.primary,
    marginTop: 8,
  },
  resultsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  resultsCardTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  statLabel: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  reviewTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  reviewCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewQuestionNumber: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  resultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  resultBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  reviewQuestion: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
    lineHeight: 20,
  },
  reviewAnswer: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  doneButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  doneButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  uploadCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 48,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed' as const,
    marginVertical: 24,
  },
  uploadTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 16,
  },
  uploadSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  fileCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  fileInfo: {
    flex: 1,
    marginLeft: 12,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  fileStatus: {
    fontSize: 14,
    color: Colors.success,
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  processingText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.error + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  skillsContainer: {
    marginBottom: 24,
  },
  skillsTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  skillChip: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  skillText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  skillsNote: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontStyle: 'italic' as const,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  loadingSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
