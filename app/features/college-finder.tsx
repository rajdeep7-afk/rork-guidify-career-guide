import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ArrowLeft, Award, Building2, ChevronDown, ExternalLink, MapPin, TrendingUp } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { generateText } from '@rork-ai/toolkit-sdk';
import Colors from '@/constants/colors';

interface College {
  name: string;
  state: string;
  type: 'Government' | 'Private';
  acceptedExams: string[];
  eligibleBranches: string[];
  cutoffRange: string;
  fees: string;
  officialWebsite: string;
}

const competitiveExams = [
  'JEE Main', 'JEE Advanced', 'NEET UG', 'NEET PG', 'CUET', 'CLAT',
  'GATE', 'CAT', 'XAT', 'MAT', 'NIFT', 'NID', 'NATA', 'UCEED'
];

const categories = ['General', 'OBC-NCL', 'SC', 'ST', 'EWS'];

export default function CollegeFinderScreen() {
  const router = useRouter();
  const [colleges, setColleges] = useState<College[] | null>(null);
  const [examName, setExamName] = useState('');
  const [rankPercentile, setRankPercentile] = useState('');
  const [category, setCategory] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'Government' | 'Private'>('all');
  const [showExamDropdown, setShowExamDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const collegeMutation = useMutation({
    mutationFn: async () => {
      if (!examName || !rankPercentile || !category) {
        throw new Error('Please fill all required fields');
      }

      const prompt = `You are an expert college counselor with deep knowledge of Indian college admissions and cutoff trends.

Student Profile:
- Competitive Exam: ${examName}
- Rank/Percentile: ${rankPercentile}
- Category: ${category}

IMPORTANT INSTRUCTIONS:
1. Analyze the ACTUAL rank/percentile provided and recommend ONLY colleges that are REALISTICALLY achievable with this score
2. Use actual cutoff data and trends from recent years
3. For example:
   - 91 percentile in JEE Main will NOT get IITs or top NITs - recommend lower NITs, IIITs, state colleges, or private universities
   - 95+ percentile in JEE Main might get lower NITs and good IIITs
   - 98+ percentile in JEE Main might get top NITs
   - NEET scores below 600 will not get AIIMS or top government medical colleges - recommend state colleges or private medical colleges
4. Account for category-wise cutoffs - reserved categories (SC/ST/OBC) get benefits
5. Provide branch-wise eligibility (e.g., "CSE at NIT Trichy needs 97+ percentile, but Civil Engineering needs 92 percentile")
6. Mix government and private institutions based on what's realistic
7. Include official website URLs (use format: https://www.collegename.ac.in or https://collegename.edu.in)

Provide 12-15 realistic college recommendations.

Format as JSON array:
[
  {
    "name": "College Full Name",
    "state": "State Name",
    "type": "Government" or "Private",
    "acceptedExams": ["${examName}"],
    "eligibleBranches": ["Branch 1 (Cutoff: XX percentile)", "Branch 2 (Cutoff: YY percentile)"],
    "cutoffRange": "XX-YY percentile for ${category} category",
    "fees": "₹XX,XXX - ₹YY,YYY per year",
    "officialWebsite": "https://www.example.ac.in"
  }
]

Return ONLY valid JSON, no other text.`;

      const response = await generateText(prompt);
      console.log('AI Response:', response);
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error('Invalid response format');

      return JSON.parse(jsonMatch[0]) as College[];
    },
    onSuccess: (data) => {
      setColleges(data);
      setShowExamDropdown(false);
      setShowCategoryDropdown(false);
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to find colleges. Please try again.');
    },
  });

  const handleSearch = () => {
    if (!examName || !rankPercentile || !category) {
      Alert.alert('Missing Information', 'Please fill in all required fields');
      return;
    }
    setColleges(null);
    collegeMutation.mutate();
  };

  const filteredColleges = colleges?.filter(
    college => selectedType === 'all' || college.type === selectedType
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>College Finder</Text>
          <View style={styles.placeholder} />
        </View>
      </SafeAreaView>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {!colleges && (
          <View style={styles.inputSection}>
            <View style={styles.headerSection}>
              <Award size={32} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Find Your College</Text>
              <Text style={styles.sectionSubtitle}>
                Get accurate recommendations based on your exam performance
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Competitive Exam *</Text>
              <Pressable
                style={styles.dropdown}
                onPress={() => setShowExamDropdown(!showExamDropdown)}
              >
                <Text style={[styles.dropdownText, !examName && styles.placeholderText]}>
                  {examName || 'Select exam'}
                </Text>
                <ChevronDown size={20} color={Colors.textSecondary} />
              </Pressable>
              {showExamDropdown && (
                <View style={styles.dropdownMenu}>
                  <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                    {competitiveExams.map((exam) => (
                      <Pressable
                        key={exam}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setExamName(exam);
                          setShowExamDropdown(false);
                        }}
                      >
                        <Text style={styles.dropdownItemText}>{exam}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Rank or Percentile *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 91 percentile or AIR 5000"
                value={rankPercentile}
                onChangeText={setRankPercentile}
                keyboardType="default"
                placeholderTextColor={Colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Category *</Text>
              <Pressable
                style={styles.dropdown}
                onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
              >
                <Text style={[styles.dropdownText, !category && styles.placeholderText]}>
                  {category || 'Select category'}
                </Text>
                <ChevronDown size={20} color={Colors.textSecondary} />
              </Pressable>
              {showCategoryDropdown && (
                <View style={styles.dropdownMenu}>
                  {categories.map((cat) => (
                    <Pressable
                      key={cat}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setCategory(cat);
                        setShowCategoryDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{cat}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            <Pressable
              style={[styles.searchButton, collegeMutation.isPending && styles.buttonDisabled]}
              onPress={handleSearch}
              disabled={collegeMutation.isPending}
            >
              <Text style={styles.searchButtonText}>
                {collegeMutation.isPending ? 'Finding Colleges...' : 'Find Colleges'}
              </Text>
            </Pressable>
          </View>
        )}

        {collegeMutation.isPending && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>
              Analyzing your profile and finding best colleges...
            </Text>
          </View>
        )}

        {colleges && colleges.length > 0 && (
          <>
            <View style={styles.filterSection}>
              <Text style={styles.resultsTitle}>
                {filteredColleges?.length || 0} Colleges Found
              </Text>
              <View style={styles.filterChips}>
                <Pressable
                  style={[styles.filterChip, selectedType === 'all' && styles.filterChipActive]}
                  onPress={() => setSelectedType('all')}
                >
                  <Text style={[styles.filterChipText, selectedType === 'all' && styles.filterChipTextActive]}>
                    All ({colleges.length})
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.filterChip, selectedType === 'Government' && styles.filterChipActive]}
                  onPress={() => setSelectedType('Government')}
                >
                  <Text style={[styles.filterChipText, selectedType === 'Government' && styles.filterChipTextActive]}>
                    Government ({colleges.filter(c => c.type === 'Government').length})
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.filterChip, selectedType === 'Private' && styles.filterChipActive]}
                  onPress={() => setSelectedType('Private')}
                >
                  <Text style={[styles.filterChipText, selectedType === 'Private' && styles.filterChipTextActive]}>
                    Private ({colleges.filter(c => c.type === 'Private').length})
                  </Text>
                </Pressable>
              </View>
            </View>

            {filteredColleges?.map((college, index) => (
              <View key={index} style={styles.collegeCard}>
                <View style={styles.collegeHeader}>
                  <View style={styles.collegeTitleSection}>
                    <Text style={styles.collegeName}>{college.name}</Text>
                    <View style={styles.collegeLocation}>
                      <MapPin size={14} color={Colors.textSecondary} />
                      <Text style={styles.locationText}>{college.state}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.collegeType}>
                  <Building2 size={16} color={college.type === 'Government' ? Colors.success : Colors.accent} />
                  <Text style={[styles.typeText, { color: college.type === 'Government' ? Colors.success : Colors.accent }]}>
                    {college.type}
                  </Text>
                </View>

                <View style={styles.collegeDetails}>
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Accepted Exams</Text>
                    <Text style={styles.detailValue}>{college.acceptedExams.join(', ')}</Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Eligible Branches</Text>
                    {college.eligibleBranches.map((branch, idx) => (
                      <Text key={idx} style={styles.branchText}>• {branch}</Text>
                    ))}
                  </View>

                  <View style={styles.cutoffSection}>
                    <TrendingUp size={16} color={Colors.primary} />
                    <View style={styles.cutoffContent}>
                      <Text style={styles.detailLabel}>Cutoff Range ({category})</Text>
                      <Text style={styles.cutoffValue}>{college.cutoffRange}</Text>
                    </View>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Annual Fees</Text>
                    <Text style={styles.detailValue}>{college.fees}</Text>
                  </View>
                </View>

                <Pressable
                  style={styles.websiteButton}
                  onPress={async () => {
                    try {
                      await Linking.openURL(college.officialWebsite);
                    } catch {
                      Alert.alert('Error', 'Unable to open website. Please check your connection.');
                    }
                  }}
                >
                  <ExternalLink size={18} color={Colors.white} />
                  <Text style={styles.websiteButtonText}>Visit Official Website</Text>
                </Pressable>
              </View>
            ))}

            <Pressable
              style={styles.resetButton}
              onPress={() => {
                setColleges(null);
                setExamName('');
                setRankPercentile('');
                setCategory('');
                setSelectedType('all');
              }}
            >
              <Text style={styles.resetButtonText}>New Search</Text>
            </Pressable>
          </>
        )}
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
  inputSection: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.text,
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
    zIndex: 100,
  },
  label: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dropdown: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 16,
    color: Colors.text,
  },
  placeholderText: {
    color: Colors.textSecondary,
  },
  dropdownMenu: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    maxHeight: 200,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dropdownItemText: {
    fontSize: 15,
    color: Colors.text,
  },
  searchButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  searchButtonText: {
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
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 16,
    textAlign: 'center',
  },
  filterSection: {
    marginBottom: 20,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  filterChips: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: Colors.white,
  },
  collegeCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  collegeHeader: {
    marginBottom: 12,
  },
  collegeTitleSection: {
    flex: 1,
  },
  collegeName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  collegeLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  collegeType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  typeText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  collegeDetails: {
    gap: 14,
    marginBottom: 16,
  },
  detailSection: {
    gap: 4,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  branchText: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 20,
    marginLeft: 8,
  },
  cutoffSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: Colors.primary + '10',
    borderRadius: 12,
    padding: 12,
  },
  cutoffContent: {
    flex: 1,
  },
  cutoffValue: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  websiteButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  websiteButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  resetButton: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 8,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
});
