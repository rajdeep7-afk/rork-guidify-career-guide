import { useRouter } from 'expo-router';
import { ArrowLeft, GraduationCap, Briefcase, Target, BookOpen } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';

const ACADEMIC_LEVELS = [
  { label: 'School', value: 'school' as const },
  { label: 'College/University', value: 'college' as const },
];

const SCHOOL_STANDARDS = ['8th', '9th', '10th', '11th', '12th'];
const COLLEGE_YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

const COURSES = [
  'Engineering (B.Tech/B.E.)',
  'Medicine (MBBS, BDS)',
  'Computer Science (BCA, B.Sc CS)',
  'Business (B.Com, BBA)',
  'Law (LLB)',
  'Architecture (B.Arch)',
  'MBA',
  'M.Tech',
  'M.Sc',
  'LLM',
  'Other',
];

const LEARNING_PREFERENCES = [
  { label: 'Visual Learning', icon: BookOpen },
  { label: 'Hands-on Practice', icon: Target },
  { label: 'Structured Courses', icon: GraduationCap },
  { label: 'Self-paced', icon: Briefcase },
];

export default function PersonalInfoScreen() {
  const router = useRouter();
  const { updateProfile } = useAuth();
  
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [academicLevel, setAcademicLevel] = useState<'school' | 'college'>('school');
  const [standard, setStandard] = useState('');
  const [course, setCourse] = useState('');
  const [skills, setSkills] = useState('');
  const [goals, setGoals] = useState('');
  const [ambitions, setAmbitions] = useState('');
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);

  const togglePreference = (pref: string) => {
    setSelectedPreferences(prev =>
      prev.includes(pref) ? prev.filter(p => p !== pref) : [...prev, pref]
    );
  };

  const handleContinue = async () => {
    if (!name || !age || !standard || !goals || !ambitions) {
      Alert.alert('Missing Information', 'Please fill in all required fields');
      return;
    }

    if (academicLevel === 'college' && !course) {
      Alert.alert('Missing Information', 'Please select your course');
      return;
    }

    const skillsArray = skills.split(',').map(s => s.trim()).filter(s => s);

    await updateProfile({
      name,
      age: parseInt(age),
      academicLevel,
      standard,
      course: academicLevel === 'college' ? course : undefined,
      skills: skillsArray,
      goals,
      ambitions,
      learningPreferences: selectedPreferences,
    });

    router.push('/onboarding/quiz' as never);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Personal Information</Text>
        </View>
      </SafeAreaView>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Full Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Age <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your age"
              value={age}
              onChangeText={setAge}
              keyboardType="number-pad"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Academic Details</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Where do you study?</Text>
            <View style={styles.segmentedControl}>
              {ACADEMIC_LEVELS.map(level => (
                <Pressable
                  key={level.value}
                  style={[
                    styles.segment,
                    academicLevel === level.value && styles.segmentActive,
                  ]}
                  onPress={() => setAcademicLevel(level.value)}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      academicLevel === level.value && styles.segmentTextActive,
                    ]}
                  >
                    {level.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              {academicLevel === 'school' ? 'Standard' : 'Year'}{' '}
              <Text style={styles.required}>*</Text>
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {(academicLevel === 'school' ? SCHOOL_STANDARDS : COLLEGE_YEARS).map(std => (
                <Pressable
                  key={std}
                  style={[styles.chip, standard === std && styles.chipActive]}
                  onPress={() => setStandard(std)}
                >
                  <Text style={[styles.chipText, standard === std && styles.chipTextActive]}>
                    {std}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {academicLevel === 'college' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Course <Text style={styles.required}>*</Text>
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                {COURSES.map(c => (
                  <Pressable
                    key={c}
                    style={[styles.chip, course === c && styles.chipActive]}
                    onPress={() => setCourse(c)}
                  >
                    <Text style={[styles.chipText, course === c && styles.chipTextActive]}>
                      {c}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skills & Interests</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Skills (comma-separated)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="e.g., Python, Design, Writing"
              value={skills}
              onChangeText={setSkills}
              multiline
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Goals <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="What do you want to achieve?"
              value={goals}
              onChangeText={setGoals}
              multiline
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Ambitions <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="What are your long-term ambitions?"
              value={ambitions}
              onChangeText={setAmbitions}
              multiline
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Learning Preferences</Text>
          
          <View style={styles.preferencesGrid}>
            {LEARNING_PREFERENCES.map(pref => (
              <Pressable
                key={pref.label}
                style={[
                  styles.preferenceCard,
                  selectedPreferences.includes(pref.label) && styles.preferenceCardActive,
                ]}
                onPress={() => togglePreference(pref.label)}
              >
                <pref.icon
                  size={24}
                  color={
                    selectedPreferences.includes(pref.label)
                      ? Colors.primary
                      : Colors.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.preferenceText,
                    selectedPreferences.includes(pref.label) && styles.preferenceTextActive,
                  ]}
                >
                  {pref.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Pressable style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueButtonText}>Continue to Quiz</Text>
        </Pressable>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.background,
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
    marginLeft: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  required: {
    color: Colors.error,
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
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentActive: {
    backgroundColor: Colors.primary,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  segmentTextActive: {
    color: Colors.white,
  },
  chipScroll: {
    marginHorizontal: -4,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.white,
  },
  preferencesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  preferenceCard: {
    width: '47%',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    margin: 8,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  preferenceCardActive: {
    backgroundColor: Colors.surfaceLight,
    borderColor: Colors.primary,
  },
  preferenceText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  preferenceTextActive: {
    color: Colors.primary,
  },
  continueButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.white,
  },
});
