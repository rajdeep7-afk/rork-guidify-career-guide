import { useRouter } from 'expo-router';
import { ArrowLeft, AlertCircle } from 'lucide-react-native';
import React, { useState, useEffect } from 'react';
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
import { useProfile } from '@/contexts/ProfileContext';
import Colors from '@/constants/colors';
import {
  getCoursesArray,
  SCHOOL_STANDARDS,
  getValidYearsForCourse,
  getSuggestedSkillsForCourse,
} from '@/constants/validation';

const ACADEMIC_LEVELS = [
  { label: 'School', value: 'school' as const },
  { label: 'College/University', value: 'college' as const },
];

export default function PersonalInfoScreen() {
  const router = useRouter();
  const { user, updateProfile: updateAuthProfile } = useAuth();
  const { updateProfile, validateProfile: validateProfileFn } = useProfile();
  
  const [name, setName] = useState(user?.name || '');
  const [age, setAge] = useState(user?.age?.toString() || '');
  const [academicLevel, setAcademicLevel] = useState<'school' | 'college'>(user?.academicLevel || 'school');
  const [standard, setStandard] = useState(user?.standard || '');
  const [course, setCourse] = useState(user?.course || '');
  const [skills, setSkills] = useState<string[]>(user?.skills || []);
  const [goals, setGoals] = useState(user?.goals || '');
  const [ambitions, setAmbitions] = useState(user?.ambitions || '');
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [validYears, setValidYears] = useState<string[]>([]);
  const [suggestedSkills, setSuggestedSkills] = useState<string[]>([]);

  useEffect(() => {
    if (course) {
      const years = getValidYearsForCourse(course);
      setValidYears(years);
      
      if (standard && !years.includes(standard)) {
        setStandard('');
        setErrors(prev => ({
          ...prev,
          standard: `Please select a valid year for ${course}`,
        }));
      }

      const suggested = getSuggestedSkillsForCourse(course);
      setSuggestedSkills(suggested.map(s => s.name));
    }
  }, [course, standard]);

  useEffect(() => {
    if (academicLevel === 'school') {
      setCourse('');
      setValidYears([]);
    }
  }, [academicLevel]);

  const toggleSkill = (skill: string) => {
    setSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const validateAndContinue = () => {
    const profileData = {
      ...user!,
      name,
      age: parseInt(age),
      academicLevel,
      standard,
      course: academicLevel === 'college' ? course : undefined,
      skills,
      goals,
      ambitions,
    };

    const validation = validateProfileFn(profileData);

    if (!validation.isValid) {
      const errorMap: Record<string, string> = {};
      validation.errors.forEach(err => {
        errorMap[err.field] = err.message;
      });
      setErrors(errorMap);
      
      Alert.alert(
        'Validation Error',
        validation.errors[0]?.message || 'Please fix the errors and try again'
      );
      return;
    }

    setErrors({});
    handleContinue();
  };

  const handleContinue = async () => {
    const profileData = {
      ...user!,
      name,
      age: parseInt(age),
      academicLevel,
      standard,
      course: academicLevel === 'college' ? course : undefined,
      year: academicLevel === 'college' ? standard : undefined,
      skills,
      goals,
      ambitions,
    };

    const result = await updateProfile(profileData);
    
    if (result.success) {
      await updateAuthProfile(profileData);
      router.push('/onboarding/quiz' as never);
    } else {
      const errorMap: Record<string, string> = {};
      result.errors.forEach(err => {
        errorMap[err.field] = err.message;
      });
      setErrors(errorMap);
      Alert.alert('Error', result.errors[0]?.message || 'Failed to save profile');
    }
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
              style={[styles.input, errors.name && styles.inputError]}
              placeholder="Enter your full name"
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (errors.name) {
                  setErrors(prev => ({ ...prev, name: '' }));
                }
              }}
            />
            {errors.name && (
              <View style={styles.errorContainer}>
                <AlertCircle size={14} color={Colors.error} />
                <Text style={styles.errorText}>{errors.name}</Text>
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Age <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, errors.age && styles.inputError]}
              placeholder="Enter your age"
              value={age}
              onChangeText={(text) => {
                setAge(text);
                if (errors.age) {
                  setErrors(prev => ({ ...prev, age: '' }));
                }
              }}
              keyboardType="number-pad"
            />
            {errors.age && (
              <View style={styles.errorContainer}>
                <AlertCircle size={14} color={Colors.error} />
                <Text style={styles.errorText}>{errors.age}</Text>
              </View>
            )}
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

          {academicLevel === 'college' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Course <Text style={styles.required}>*</Text>
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                {getCoursesArray().map(c => (
                  <Pressable
                    key={c}
                    style={[styles.chip, course === c && styles.chipActive]}
                    onPress={() => {
                      setCourse(c);
                      if (errors.course) {
                        setErrors(prev => ({ ...prev, course: '' }));
                      }
                    }}
                  >
                    <Text style={[styles.chipText, course === c && styles.chipTextActive]}>
                      {c}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
              {errors.course && (
                <View style={styles.errorContainer}>
                  <AlertCircle size={14} color={Colors.error} />
                  <Text style={styles.errorText}>{errors.course}</Text>
                </View>
              )}
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              {academicLevel === 'school' ? 'Standard' : 'Year'}{' '}
              <Text style={styles.required}>*</Text>
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {(academicLevel === 'school' ? SCHOOL_STANDARDS : validYears).map(std => (
                <Pressable
                  key={std}
                  style={[styles.chip, standard === std && styles.chipActive]}
                  onPress={() => {
                    setStandard(std);
                    if (errors.standard) {
                      setErrors(prev => ({ ...prev, standard: '' }));
                    }
                  }}
                >
                  <Text style={[styles.chipText, standard === std && styles.chipTextActive]}>
                    {std}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            {errors.standard && (
              <View style={styles.errorContainer}>
                <AlertCircle size={14} color={Colors.error} />
                <Text style={styles.errorText}>{errors.standard}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skills & Interests</Text>
          
          {suggestedSkills.length > 0 && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Suggested Skills for {course}</Text>
              <View style={styles.skillsGrid}>
                {suggestedSkills.map(skill => (
                  <Pressable
                    key={skill}
                    style={[styles.skillChip, skills.includes(skill) && styles.skillChipActive]}
                    onPress={() => toggleSkill(skill)}
                  >
                    <Text
                      style={[
                        styles.skillChipText,
                        skills.includes(skill) && styles.skillChipTextActive,
                      ]}
                    >
                      {skill}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
          {errors.skills && (
            <View style={styles.errorContainer}>
              <AlertCircle size={14} color={Colors.error} />
              <Text style={styles.errorText}>{errors.skills}</Text>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Goals <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, styles.textArea, errors.goals && styles.inputError]}
              placeholder="What do you want to achieve?"
              value={goals}
              onChangeText={(text) => {
                setGoals(text);
                if (errors.goals) {
                  setErrors(prev => ({ ...prev, goals: '' }));
                }
              }}
              multiline
            />
            {errors.goals && (
              <View style={styles.errorContainer}>
                <AlertCircle size={14} color={Colors.error} />
                <Text style={styles.errorText}>{errors.goals}</Text>
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Ambitions <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, styles.textArea, errors.ambitions && styles.inputError]}
              placeholder="What are your long-term ambitions?"
              value={ambitions}
              onChangeText={(text) => {
                setAmbitions(text);
                if (errors.ambitions) {
                  setErrors(prev => ({ ...prev, ambitions: '' }));
                }
              }}
              multiline
            />
            {errors.ambitions && (
              <View style={styles.errorContainer}>
                <AlertCircle size={14} color={Colors.error} />
                <Text style={styles.errorText}>{errors.ambitions}</Text>
              </View>
            )}
          </View>
        </View>

        <Pressable style={styles.continueButton} onPress={validateAndContinue}>
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
  inputError: {
    borderColor: Colors.error,
    borderWidth: 2,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    flex: 1,
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
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  skillChipActive: {
    backgroundColor: Colors.primary + '20',
    borderColor: Colors.primary,
  },
  skillChipText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  skillChipTextActive: {
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
