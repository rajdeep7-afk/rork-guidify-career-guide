import { useRouter } from 'expo-router';
import { ArrowLeft, Briefcase, Building2, DollarSign, FileText, MapPin, Plus, Star, Upload, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import Colors from '@/constants/colors';
import { trpc } from '@/lib/trpc';
import { extractTextFromFile } from '@/lib/resume-parser';

type ProfileType = 'fresher' | 'experienced' | null;

interface FresherProfile {
  type: 'fresher';
  resumeText: string;
  skills: string[];
  summary: string;
  cgpa: number | null;
  education_stream: string;
  institute_name: string;
  preferred_location: string;
}

interface ExperiencedProfile {
  type: 'experienced';
  resumeText: string;
  skills: string[];
  summary: string;
  previous_company: string;
  years_of_experience: number;
  previous_salary: number | null;
  projects: string;
  preferred_location: string;
}

interface Job {
  company: string;
  role: string;
  expected_salary: number;
  locations: string[];
  nearest_office: string;
  employment_rating: number;
  management_rating: number;
  why_fit: string;
}

export default function JobFinderScreen() {
  const router = useRouter();
  const [step, setStep] = useState<'type' | 'resume' | 'profile' | 'results'>('type');
  const [profileType, setProfileType] = useState<ProfileType>(null);
  const [resumeFile, setResumeFile] = useState<{ name: string; text: string } | null>(null);
  const [isParsingResume, setIsParsingResume] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);

  const [fresherData, setFresherData] = useState<Partial<FresherProfile>>({
    skills: [],
    summary: '',
    cgpa: null,
    education_stream: '',
    institute_name: '',
    preferred_location: '',
  });

  const [experiencedData, setExperiencedData] = useState<Partial<ExperiencedProfile>>({
    skills: [],
    summary: '',
    previous_company: '',
    years_of_experience: 0,
    previous_salary: null,
    projects: '',
    preferred_location: '',
  });

  const [newSkill, setNewSkill] = useState('');

  const parseResumeMutation = trpc.resume.parse.useMutation({
    onSuccess: (data) => {
      console.log('[Job Finder] Resume parsed successfully:', data);
      
      if (profileType === 'fresher') {
        const profile = {
          skills: data.skills || [],
          summary: data.summary || '',
          cgpa: data.cgpa || null,
          education_stream: data.education_stream || '',
          institute_name: data.institute_name || '',
          preferred_location: data.preferred_location || '',
        };
        setFresherData(profile);
        console.log('[Job Finder] Fresher data populated from resume');
      } else {
        const profile = {
          skills: data.skills || [],
          summary: data.summary || '',
          previous_company: data.previous_company || '',
          years_of_experience: data.years_of_experience || 0,
          previous_salary: data.previous_salary || null,
          projects: data.projects || '',
          preferred_location: data.preferred_location || '',
        };
        setExperiencedData(profile);
        console.log('[Job Finder] Experienced data populated from resume');
      }
      
      setIsParsingResume(false);
      setStep('profile');
      
      Alert.alert(
        'Resume Parsed', 
        'Please review and complete your profile information before getting job recommendations.',
        [{ text: 'OK' }]
      );
    },
    onError: (error) => {
      console.error('[Job Finder] Resume parsing error:', error);
      setIsParsingResume(false);
      Alert.alert(
        'Parsing Failed', 
        'Could not extract information from the resume. Please enter your details manually.',
        [{
          text: 'OK',
          onPress: () => setStep('profile'),
        }]
      );
    },
  });

  const jobRecommendMutation = trpc.jobs.recommend.useMutation({
    onSuccess: (data) => {
      setJobs(data);
      setStep('results');
    },
    onError: (error) => {
      console.error('Job recommendation error:', error);
      Alert.alert('Error', 'Failed to get job recommendations. Please try again.');
    },
  });

  const handlePickResume = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];
        
        console.log('[Job Finder] File picked:', file.name);
        setIsParsingResume(true);

        const resumeText = await extractTextFromFile(file.uri, file.name);
        
        setResumeFile({
          name: file.name,
          text: resumeText,
        });

        parseResumeMutation.mutate({
          resumeText,
          profileType: profileType as 'fresher' | 'experienced',
        });
      }
    } catch (error) {
      console.error('[Job Finder] Error picking document:', error);
      setIsParsingResume(false);
      Alert.alert('Error', 'Failed to pick resume file');
    }
  };

  const addSkill = () => {
    if (!newSkill.trim()) return;

    if (profileType === 'fresher') {
      setFresherData(prev => ({
        ...prev,
        skills: [...(prev.skills || []), newSkill.trim()],
      }));
    } else {
      setExperiencedData(prev => ({
        ...prev,
        skills: [...(prev.skills || []), newSkill.trim()],
      }));
    }

    setNewSkill('');
  };

  const removeSkill = (index: number) => {
    if (profileType === 'fresher') {
      setFresherData(prev => ({
        ...prev,
        skills: prev.skills?.filter((_, i) => i !== index) || [],
      }));
    } else {
      setExperiencedData(prev => ({
        ...prev,
        skills: prev.skills?.filter((_, i) => i !== index) || [],
      }));
    }
  };

  const handleSubmit = () => {
    if (!resumeFile) {
      Alert.alert('Error', 'Please upload your resume');
      return;
    }

    if (profileType === 'fresher') {
      const profile: FresherProfile = {
        type: 'fresher',
        resumeText: resumeFile.text,
        skills: fresherData.skills || [],
        summary: fresherData.summary || '',
        cgpa: fresherData.cgpa || null,
        education_stream: fresherData.education_stream || '',
        institute_name: fresherData.institute_name || '',
        preferred_location: fresherData.preferred_location || '',
      };

      if (!profile.summary || !profile.education_stream || !profile.institute_name || !profile.preferred_location) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      jobRecommendMutation.mutate(profile);
    } else {
      const profile: ExperiencedProfile = {
        type: 'experienced',
        resumeText: resumeFile.text,
        skills: experiencedData.skills || [],
        summary: experiencedData.summary || '',
        previous_company: experiencedData.previous_company || '',
        years_of_experience: experiencedData.years_of_experience || 0,
        previous_salary: experiencedData.previous_salary || null,
        projects: experiencedData.projects || '',
        preferred_location: experiencedData.preferred_location || '',
      };

      if (!profile.summary || !profile.previous_company || !profile.projects || !profile.preferred_location || profile.years_of_experience === 0) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      jobRecommendMutation.mutate(profile);
    }
  };

  const renderTypeSelection = () => (
    <View style={styles.centerContainer}>
      <View style={styles.iconContainer}>
        <Briefcase size={48} color={Colors.primary} />
      </View>
      <Text style={styles.title}>Find Your Perfect Job</Text>
      <Text style={styles.subtitle}>
        Get personalized job recommendations based on your profile and resume
      </Text>

      <View style={styles.typeOptions}>
        <Pressable
          style={({ pressed }) => [
            styles.typeCard,
            pressed && styles.typeCardPressed,
          ]}
          onPress={() => {
            setProfileType('fresher');
            setStep('resume');
          }}
        >
          <View style={styles.typeIcon}>
            <FileText size={32} color={Colors.primary} />
          </View>
          <Text style={styles.typeTitle}>Fresher</Text>
          <Text style={styles.typeDescription}>
            Recent graduate looking for entry-level opportunities
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.typeCard,
            pressed && styles.typeCardPressed,
          ]}
          onPress={() => {
            setProfileType('experienced');
            setStep('resume');
          }}
        >
          <View style={styles.typeIcon}>
            <Briefcase size={32} color={Colors.secondary} />
          </View>
          <Text style={styles.typeTitle}>Experienced</Text>
          <Text style={styles.typeDescription}>
            Professional with work experience seeking new opportunities
          </Text>
        </Pressable>
      </View>
    </View>
  );

  const renderResumeUpload = () => (
    <View style={styles.formContainer}>
      <Text style={styles.stepTitle}>Upload Your Resume</Text>
      <Text style={styles.stepSubtitle}>
        We&apos;ll automatically extract all information and find matching jobs
      </Text>

      {isParsingResume || jobRecommendMutation.isPending ? (
        <View style={styles.parsingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.parsingTitle}>
            {isParsingResume ? 'Parsing Your Resume...' : 'Finding Perfect Jobs...'}
          </Text>
          <Text style={styles.parsingSubtitle}>
            {isParsingResume 
              ? 'AI is extracting your skills, experience, and other details'
              : 'Matching your profile with the best opportunities'}
          </Text>
        </View>
      ) : !resumeFile ? (
        <Pressable
          style={({ pressed }) => [
            styles.uploadBox,
            pressed && styles.uploadBoxPressed,
          ]}
          onPress={handlePickResume}
        >
          <Upload size={48} color={Colors.primary} />
          <Text style={styles.uploadTitle}>Tap to Upload Resume</Text>
          <Text style={styles.uploadSubtitle}>PDF, DOC, DOCX, or TXT</Text>
          <Text style={[styles.uploadSubtitle, { marginTop: 12, fontSize: 13 }]}>
            No manual entry needed - just upload and we&apos;ll handle the rest!
          </Text>
        </Pressable>
      ) : null}
    </View>
  );

  const renderFresherProfile = () => (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.stepTitle}>Complete Your Profile</Text>
      <Text style={styles.stepSubtitle}>Help us find the best jobs for you</Text>

      <View style={styles.formSection}>
        <Text style={styles.label}>Summary (≤ 40 words) *</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Brief description of yourself and career goals"
          placeholderTextColor={Colors.textSecondary}
          value={fresherData.summary}
          onChangeText={(text) => setFresherData(prev => ({ ...prev, summary: text }))}
          multiline
          maxLength={200}
        />
      </View>

      <View style={styles.formSection}>
        <Text style={styles.label}>Skills *</Text>
        <View style={styles.skillsInputContainer}>
          <TextInput
            style={styles.skillInput}
            placeholder="Add a skill"
            placeholderTextColor={Colors.textSecondary}
            value={newSkill}
            onChangeText={setNewSkill}
            onSubmitEditing={addSkill}
          />
          <Pressable style={styles.addSkillButton} onPress={addSkill}>
            <Plus size={20} color={Colors.white} />
          </Pressable>
        </View>
        <View style={styles.skillsContainer}>
          {fresherData.skills?.map((skill, index) => (
            <View key={index} style={styles.skillChip}>
              <Text style={styles.skillText}>{skill}</Text>
              <Pressable onPress={() => removeSkill(index)}>
                <X size={16} color={Colors.accent} />
              </Pressable>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.formSection}>
        <Text style={styles.label}>Education Stream *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Computer Science, Mechanical Engineering"
          placeholderTextColor={Colors.textSecondary}
          value={fresherData.education_stream}
          onChangeText={(text) => setFresherData(prev => ({ ...prev, education_stream: text }))}
        />
      </View>

      <View style={styles.formSection}>
        <Text style={styles.label}>Institute Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="Your college/university name"
          placeholderTextColor={Colors.textSecondary}
          value={fresherData.institute_name}
          onChangeText={(text) => setFresherData(prev => ({ ...prev, institute_name: text }))}
        />
      </View>

      <View style={styles.formSection}>
        <Text style={styles.label}>CGPA (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., 8.5"
          placeholderTextColor={Colors.textSecondary}
          keyboardType="decimal-pad"
          value={fresherData.cgpa?.toString() || ''}
          onChangeText={(text) => {
            const num = parseFloat(text);
            setFresherData(prev => ({ ...prev, cgpa: isNaN(num) ? null : num }));
          }}
        />
      </View>

      <View style={styles.formSection}>
        <Text style={styles.label}>Preferred Location *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Bangalore, Mumbai, Remote"
          placeholderTextColor={Colors.textSecondary}
          value={fresherData.preferred_location}
          onChangeText={(text) => setFresherData(prev => ({ ...prev, preferred_location: text }))}
        />
      </View>

      <Pressable
        style={styles.primaryButton}
        onPress={handleSubmit}
        disabled={jobRecommendMutation.isPending}
      >
        {jobRecommendMutation.isPending ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <Text style={styles.primaryButtonText}>Get Job Recommendations</Text>
        )}
      </Pressable>

      <View style={styles.spacer} />
    </ScrollView>
  );

  const renderExperiencedProfile = () => (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.stepTitle}>Complete Your Profile</Text>
      <Text style={styles.stepSubtitle}>Help us find the best jobs for you</Text>

      <View style={styles.formSection}>
        <Text style={styles.label}>Summary (≤ 40 words) *</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Brief description of your experience and expertise"
          placeholderTextColor={Colors.textSecondary}
          value={experiencedData.summary}
          onChangeText={(text) => setExperiencedData(prev => ({ ...prev, summary: text }))}
          multiline
          maxLength={200}
        />
      </View>

      <View style={styles.formSection}>
        <Text style={styles.label}>Skills *</Text>
        <View style={styles.skillsInputContainer}>
          <TextInput
            style={styles.skillInput}
            placeholder="Add a skill"
            placeholderTextColor={Colors.textSecondary}
            value={newSkill}
            onChangeText={setNewSkill}
            onSubmitEditing={addSkill}
          />
          <Pressable style={styles.addSkillButton} onPress={addSkill}>
            <Plus size={20} color={Colors.white} />
          </Pressable>
        </View>
        <View style={styles.skillsContainer}>
          {experiencedData.skills?.map((skill, index) => (
            <View key={index} style={styles.skillChip}>
              <Text style={styles.skillText}>{skill}</Text>
              <Pressable onPress={() => removeSkill(index)}>
                <X size={16} color={Colors.accent} />
              </Pressable>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.formSection}>
        <Text style={styles.label}>Previous Company *</Text>
        <TextInput
          style={styles.input}
          placeholder="Your current or most recent employer"
          placeholderTextColor={Colors.textSecondary}
          value={experiencedData.previous_company}
          onChangeText={(text) => setExperiencedData(prev => ({ ...prev, previous_company: text }))}
        />
      </View>

      <View style={styles.formSection}>
        <Text style={styles.label}>Years of Experience *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., 3"
          placeholderTextColor={Colors.textSecondary}
          keyboardType="number-pad"
          value={experiencedData.years_of_experience?.toString() || ''}
          onChangeText={(text) => {
            const num = parseInt(text);
            setExperiencedData(prev => ({ ...prev, years_of_experience: isNaN(num) ? 0 : num }));
          }}
        />
      </View>

      <View style={styles.formSection}>
        <Text style={styles.label}>Previous Salary (LPA, Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., 8"
          placeholderTextColor={Colors.textSecondary}
          keyboardType="decimal-pad"
          value={experiencedData.previous_salary?.toString() || ''}
          onChangeText={(text) => {
            const num = parseFloat(text);
            setExperiencedData(prev => ({ ...prev, previous_salary: isNaN(num) ? null : num }));
          }}
        />
      </View>

      <View style={styles.formSection}>
        <Text style={styles.label}>Projects *</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Describe your key projects and achievements"
          placeholderTextColor={Colors.textSecondary}
          value={experiencedData.projects}
          onChangeText={(text) => setExperiencedData(prev => ({ ...prev, projects: text }))}
          multiline
        />
      </View>

      <View style={styles.formSection}>
        <Text style={styles.label}>Preferred Location *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Bangalore, Mumbai, Remote"
          placeholderTextColor={Colors.textSecondary}
          value={experiencedData.preferred_location}
          onChangeText={(text) => setExperiencedData(prev => ({ ...prev, preferred_location: text }))}
        />
      </View>

      <Pressable
        style={styles.primaryButton}
        onPress={handleSubmit}
        disabled={jobRecommendMutation.isPending}
      >
        {jobRecommendMutation.isPending ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <Text style={styles.primaryButtonText}>Get Job Recommendations</Text>
        )}
      </Pressable>

      <View style={styles.spacer} />
    </ScrollView>
  );

  const renderResults = () => (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsTitle}>{jobs.length} Jobs Found</Text>
        <Text style={styles.resultsSubtitle}>
          Personalized recommendations based on your profile
        </Text>
      </View>

      {jobs.map((job, index) => (
        <View key={index} style={styles.jobCard}>
          <View style={styles.jobCardHeader}>
            <View style={styles.jobCardHeaderLeft}>
              <Text style={styles.jobRole}>{job.role}</Text>
              <Text style={styles.jobCompany}>{job.company}</Text>
            </View>
            <View style={styles.ratingBadge}>
              <Star size={14} color={Colors.warning} fill={Colors.warning} />
              <Text style={styles.ratingText}>{job.employment_rating}</Text>
            </View>
          </View>

          <View style={styles.jobMeta}>
            <View style={styles.metaItem}>
              <MapPin size={14} color={Colors.textSecondary} />
              <Text style={styles.metaText}>{job.nearest_office}</Text>
            </View>
            <View style={styles.metaItem}>
              <DollarSign size={14} color={Colors.success} />
              <Text style={[styles.metaText, { color: Colors.success, fontWeight: '700' as const }]}>
                ₹{job.expected_salary} LPA
              </Text>
            </View>
          </View>

          <View style={styles.jobFit}>
            <Text style={styles.jobFitLabel}>Why you&apos;re a great fit:</Text>
            <Text style={styles.jobFitText}>{job.why_fit}</Text>
          </View>

          <View style={styles.jobLocations}>
            <Text style={styles.jobLocationsLabel}>Available Locations:</Text>
            <View style={styles.locationChips}>
              {job.locations.map((location, i) => (
                <View key={i} style={styles.locationChip}>
                  <Text style={styles.locationChipText}>{location}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.ratingsRow}>
            <View style={styles.ratingItem}>
              <Building2 size={14} color={Colors.primary} />
              <Text style={styles.ratingItemLabel}>Employment</Text>
              <Text style={styles.ratingItemValue}>{job.employment_rating}/100</Text>
            </View>
            <View style={styles.ratingItem}>
              <Star size={14} color={Colors.secondary} />
              <Text style={styles.ratingItemLabel}>Management</Text>
              <Text style={styles.ratingItemValue}>{job.management_rating}/100</Text>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [styles.applyButton, pressed && styles.buttonPressed]}
            onPress={() => Alert.alert('Apply', `To apply for ${job.role} at ${job.company}, visit their careers page or job portals like Naukri, LinkedIn, etc.`)}
          >
            <Text style={styles.applyButtonText}>View Details</Text>
          </Pressable>
        </View>
      ))}

      <Pressable
        style={styles.secondaryButton}
        onPress={() => {
          setStep('type');
          setProfileType(null);
          setResumeFile(null);
          setJobs([]);
        }}
      >
        <Text style={styles.secondaryButtonText}>Start New Search</Text>
      </Pressable>

      <View style={styles.spacer} />
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => {
            if (step === 'type') {
              router.back();
            } else if (step === 'resume') {
              setStep('type');
              setProfileType(null);
            } else if (step === 'profile') {
              setStep('resume');
            } else {
              setStep('type');
              setProfileType(null);
              setResumeFile(null);
              setJobs([]);
            }
          }} style={styles.backButton}>
            <ArrowLeft size={24} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Job Finder</Text>
          <View style={styles.placeholder} />
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {step === 'type' && renderTypeSelection()}
        {step === 'resume' && renderResumeUpload()}
        {step === 'profile' && profileType === 'fresher' && renderFresherProfile()}
        {step === 'profile' && profileType === 'experienced' && renderExperiencedProfile()}
        {step === 'results' && renderResults()}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  typeOptions: {
    width: '100%',
    gap: 16,
  },
  typeCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  typeCardPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  typeIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  typeTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  typeDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  formContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 32,
    lineHeight: 24,
  },
  uploadBox: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    padding: 48,
    alignItems: 'center',
    marginBottom: 24,
  },
  uploadBoxPressed: {
    opacity: 0.7,
  },
  uploadTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  uploadSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  uploadedFile: {
    backgroundColor: Colors.success + '10',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.success,
  },
  uploadedFileInfo: {
    flex: 1,
  },
  uploadedFileName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  uploadedFileStatus: {
    fontSize: 14,
    color: Colors.success,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  formSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
  },
  textArea: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  skillsInputContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  skillInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
  },
  addSkillButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    width: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillChip: {
    backgroundColor: Colors.accent + '20',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  skillText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.accent,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  secondaryButton: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 16,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  spacer: {
    height: 40,
  },
  resultsHeader: {
    marginBottom: 24,
  },
  resultsTitle: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  resultsSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  jobCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  jobCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  jobCardHeaderLeft: {
    flex: 1,
    marginRight: 12,
  },
  jobRole: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  jobCompany: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  ratingBadge: {
    backgroundColor: Colors.warning + '20',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.warning,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: Colors.warning,
  },
  jobMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  jobFit: {
    backgroundColor: Colors.primary + '10',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  jobFitLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.primary,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  jobFitText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  jobLocations: {
    marginBottom: 16,
  },
  jobLocationsLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  locationChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  locationChip: {
    backgroundColor: Colors.secondary + '20',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.secondary,
  },
  locationChipText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.secondary,
  },
  ratingsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  ratingItem: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingItemLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  ratingItemValue: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  applyButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  parsingContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 48,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: Colors.primary + '40',
  },
  parsingTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 24,
    marginBottom: 8,
  },
  parsingSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
