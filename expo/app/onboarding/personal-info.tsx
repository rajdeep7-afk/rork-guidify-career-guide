import { useRouter } from 'expo-router';
import { ArrowLeft, AlertCircle } from 'lucide-react-native';
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
import { useProfile } from '@/contexts/ProfileContext';
import Colors from '@/constants/colors';

const COMMON_SKILLS = [
  'Python', 'Java', 'JavaScript', 'React', 'Node.js',
  'Machine Learning', 'Data Science', 'SQL', 'Cloud Computing',
  'Mobile Development', 'UI/UX Design', 'Problem Solving',
  'Communication', 'Leadership', 'Teamwork', 'Critical Thinking',
];

export default function PersonalInfoScreen() {
  const router = useRouter();
  const { user, updateProfile: updateAuthProfile } = useAuth();
  const { profile, updateProfile, createProfile } = useProfile();
  
  const [name, setName] = useState(user?.name || '');
  const [age, setAge] = useState(user?.age?.toString() || '');
  const [skills, setSkills] = useState<string[]>(user?.skills || []);
  const [customSkills, setCustomSkills] = useState<string[]>([]);
  const [customSkillInput, setCustomSkillInput] = useState('');
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const toggleSkill = (skill: string) => {
    setSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const addCustomSkill = () => {
    if (customSkillInput.trim() && !skills.includes(customSkillInput.trim())) {
      const newSkill = customSkillInput.trim();
      setSkills(prev => [...prev, newSkill]);
      setCustomSkills(prev => [...prev, newSkill]);
      setCustomSkillInput('');
    }
  };

  const removeCustomSkill = (skill: string) => {
    setSkills(prev => prev.filter(s => s !== skill));
    setCustomSkills(prev => prev.filter(s => s !== skill));
  };

  const validateAndContinue = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    const ageNum = parseInt(age);
    if (!age || isNaN(ageNum) || ageNum < 10 || ageNum > 100) {
      newErrors.age = 'Please enter a valid age (10-100)';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      Alert.alert(
        'Validation Error',
        Object.values(newErrors)[0] || 'Please fix the errors and try again'
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
      skills,
    };

    const result = profile 
      ? await updateProfile(profileData)
      : await createProfile(profileData);
    
    if (result.success) {
      await updateAuthProfile(profileData);
      router.push('/onboarding/quiz' as never);
    } else {
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    }
  };

  const canGoBack = router.canGoBack();

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          {canGoBack && (
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color={Colors.text} />
            </Pressable>
          )}
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
          <Text style={styles.sectionTitle}>Skills & Interests</Text>
          <Text style={styles.sectionSubtitle}>
            Select your skills or add custom ones
          </Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Common Skills</Text>
            <View style={styles.skillsGrid}>
              {COMMON_SKILLS.map(skill => (
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

          {customSkills.length > 0 && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Your Custom Skills</Text>
              <View style={styles.skillsGrid}>
                {customSkills.map(skill => (
                  <Pressable
                    key={skill}
                    style={[styles.skillChip, styles.customSkillChip]}
                    onPress={() => removeCustomSkill(skill)}
                  >
                    <Text style={[styles.skillChipText, styles.customSkillChipText]}>
                      {skill} ✕
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Add Custom Skill</Text>
            <View style={styles.addSkillContainer}>
              <TextInput
                style={styles.customSkillInput}
                placeholder="Type a skill not listed above..."
                value={customSkillInput}
                onChangeText={setCustomSkillInput}
                onSubmitEditing={addCustomSkill}
              />
              <Pressable
                style={[styles.addButton, !customSkillInput.trim() && styles.addButtonDisabled]}
                onPress={addCustomSkill}
                disabled={!customSkillInput.trim()}
              >
                <Text style={styles.addButtonText}>
                  {customSkills.length === 0 ? 'Add+' : 'Add Another+'}
                </Text>
              </Pressable>
            </View>
          </View>

          {errors.skills && (
            <View style={styles.errorContainer}>
              <AlertCircle size={14} color={Colors.error} />
              <Text style={styles.errorText}>{errors.skills}</Text>
            </View>
          )}
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
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
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
  addSkillContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  customSkillInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  addButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    minWidth: 120,
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: Colors.border,
    opacity: 0.5,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  customSkillChip: {
    backgroundColor: Colors.primary + '30',
    borderColor: Colors.primary,
  },
  customSkillChipText: {
    color: Colors.primary,
  },
});
