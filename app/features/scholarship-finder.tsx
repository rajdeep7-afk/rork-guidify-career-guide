import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ArrowLeft, Award, Calendar, DollarSign, ExternalLink, Filter } from 'lucide-react-native';
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
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';

interface Scholarship {
  name: string;
  provider: string;
  amount: string;
  type: 'Government' | 'Private';
  eligibility: string;
  deadline: string;
  applicationLink: string;
  benefit: string;
}

type TabType = 'Government' | 'Private';

const indianStates = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

const educationLevels = [
  'School (8th-10th)', 'School (11th-12th)', 
  'Undergraduate (UG)', 'Postgraduate (PG)', 
  'Doctoral (PhD)', 'Diploma/ITI'
];

const categories = ['General', 'OBC', 'SC', 'ST', 'EWS'];

export default function ScholarshipFinderScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('Government');
  
  const [showFilters, setShowFilters] = useState(true);
  const [state, setState] = useState('');
  const [educationLevel, setEducationLevel] = useState('');
  const [category, setCategory] = useState('');
  const [familyIncome, setFamilyIncome] = useState('');
  
  const [scholarships, setScholarships] = useState<Scholarship[] | null>(null);

  const scholarshipMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('No user profile found');

      const prompt = `Based on the following student profile and filters, recommend 15 suitable scholarships (mix of Government and Private).

Student Profile:
- Academic Level: ${user.academicLevel === 'school' ? 'School' : 'College'}
- Standard/Year: ${user.standard}
${user.course ? `- Course: ${user.course}` : ''}
- Career Recommendation: ${user.careerRecommendation || 'Not specified'}

User Filters:
- State: ${state || 'Not specified'}
- Education Level: ${educationLevel || 'Not specified'}
- Category: ${category || 'Not specified'}
- Family Income: ${familyIncome || 'Not specified'}

Provide diverse scholarships including:
1. GOVERNMENT: National Scholarship Portal, state schemes, central schemes, minority scholarships
2. PRIVATE: Corporate (Tata, Reliance, Google, Microsoft), NGO, foundation scholarships

For each scholarship, provide:
- Accurate name and provider
- Realistic award amount in INR
- Clear eligibility criteria
- Application deadline or "Rolling"
- Actual application link
- Brief benefit summary

Format as JSON array:
[
  {
    "name": "Scholarship Name",
    "provider": "Provider/Organization",
    "amount": "₹XX,XXX - ₹YY,YYY",
    "type": "Government" or "Private",
    "eligibility": "Clear eligibility",
    "deadline": "Month YYYY or Rolling",
    "applicationLink": "https://example.com",
    "benefit": "What this scholarship provides"
  }
]

Return ONLY valid JSON, no other text.`;

      const response = await generateText(prompt);
      console.log('AI Response:', response);
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error('Invalid response format');

      return JSON.parse(jsonMatch[0]) as Scholarship[];
    },
    onSuccess: (data) => {
      setScholarships(data);
      setShowFilters(false);
    },
    onError: () => {
      Alert.alert('Error', 'Failed to find scholarships. Please try again.');
    },
  });

  const handleSearch = () => {
    if (!state || !educationLevel || !category || !familyIncome) {
      Alert.alert('Missing Information', 'Please fill in all filter fields');
      return;
    }
    setScholarships(null);
    scholarshipMutation.mutate();
  };

  const filteredScholarships = scholarships?.filter(s => s.type === activeTab);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Scholarship Finder</Text>
          <Pressable 
            onPress={() => setShowFilters(!showFilters)} 
            style={styles.filterButton}
          >
            <Filter size={20} color={Colors.text} />
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {showFilters && (
          <View style={styles.filtersCard}>
            <Text style={styles.filtersTitle}>Personalize Your Search</Text>
            <Text style={styles.filtersSubtitle}>Help us find the best scholarships for you</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>State *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                {indianStates.map((s) => (
                  <Pressable
                    key={s}
                    style={[styles.chip, state === s && styles.chipActive]}
                    onPress={() => setState(s)}
                  >
                    <Text style={[styles.chipText, state === s && styles.chipTextActive]}>
                      {s}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Education Level *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                {educationLevels.map((level) => (
                  <Pressable
                    key={level}
                    style={[styles.chip, educationLevel === level && styles.chipActive]}
                    onPress={() => setEducationLevel(level)}
                  >
                    <Text style={[styles.chipText, educationLevel === level && styles.chipTextActive]}>
                      {level}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Category *</Text>
              <View style={styles.categoryGrid}>
                {categories.map((cat) => (
                  <Pressable
                    key={cat}
                    style={[styles.categoryChip, category === cat && styles.categoryChipActive]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text style={[styles.categoryChipText, category === cat && styles.categoryChipTextActive]}>
                      {cat}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Annual Family Income *</Text>
              <TextInput
                style={styles.input}
                value={familyIncome}
                onChangeText={setFamilyIncome}
                placeholder="e.g., ₹3,00,000 per year"
                placeholderTextColor={Colors.textSecondary}
                keyboardType="default"
              />
            </View>

            <Pressable
              style={[styles.searchButton, scholarshipMutation.isPending && styles.buttonDisabled]}
              onPress={handleSearch}
              disabled={scholarshipMutation.isPending}
            >
              <Text style={styles.searchButtonText}>
                {scholarshipMutation.isPending ? 'Searching...' : 'Find Scholarships'}
              </Text>
            </Pressable>
          </View>
        )}

        {scholarshipMutation.isPending && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>
              Finding scholarships tailored to your profile...
            </Text>
          </View>
        )}

        {scholarships && scholarships.length > 0 && (
          <>
            <View style={styles.tabsContainer}>
              <Pressable
                style={[styles.tab, activeTab === 'Government' && styles.tabActive]}
                onPress={() => setActiveTab('Government')}
              >
                <Text style={[styles.tabText, activeTab === 'Government' && styles.tabTextActive]}>
                  Government ({scholarships.filter(s => s.type === 'Government').length})
                </Text>
              </Pressable>
              <Pressable
                style={[styles.tab, activeTab === 'Private' && styles.tabActive]}
                onPress={() => setActiveTab('Private')}
              >
                <Text style={[styles.tabText, activeTab === 'Private' && styles.tabTextActive]}>
                  Private ({scholarships.filter(s => s.type === 'Private').length})
                </Text>
              </Pressable>
            </View>

            <Text style={styles.resultsTitle}>
              {filteredScholarships?.length || 0} Scholarships Found
            </Text>

            {filteredScholarships?.map((scholarship, index) => (
              <View key={index} style={styles.scholarshipCard}>
                <View style={styles.scholarshipHeader}>
                  <View style={styles.iconBadge}>
                    <Award size={24} color={Colors.secondary} />
                  </View>
                  <View style={styles.scholarshipHeaderContent}>
                    <Text style={styles.scholarshipName}>{scholarship.name}</Text>
                    <Text style={styles.providerText}>{scholarship.provider}</Text>
                  </View>
                </View>

                <View style={styles.scholarshipDetails}>
                  <View style={styles.detailRow}>
                    <DollarSign size={18} color={Colors.success} />
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>Award Amount</Text>
                      <Text style={styles.detailValue}>{scholarship.amount}</Text>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <Calendar size={18} color={Colors.accent} />
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>Deadline</Text>
                      <Text style={styles.detailValue}>{scholarship.deadline}</Text>
                    </View>
                  </View>

                  <View style={styles.detailColumn}>
                    <Text style={styles.detailLabel}>Eligibility</Text>
                    <Text style={styles.detailValue}>{scholarship.eligibility}</Text>
                  </View>

                  <View style={styles.detailColumn}>
                    <Text style={styles.detailLabel}>Benefit</Text>
                    <Text style={styles.detailValue}>{scholarship.benefit}</Text>
                  </View>
                </View>

                <Pressable
                  style={({ pressed }) => [styles.applyButton, pressed && styles.buttonPressed]}
                  onPress={async () => {
                    try {
                      await Linking.openURL(scholarship.applicationLink);
                    } catch {
                      Alert.alert('Error', 'Unable to open link. Please check the URL.');
                    }
                  }}
                >
                  <ExternalLink size={18} color={Colors.white} />
                  <Text style={styles.applyButtonText}>View Details & Apply</Text>
                </Pressable>
              </View>
            ))}

            <View style={styles.noteCard}>
              <Text style={styles.noteText}>
                Always verify scholarship details and deadlines on official websites before applying.
                Check eligibility criteria carefully and prepare required documents in advance.
              </Text>
            </View>
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
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  filtersCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filtersTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  filtersSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  chipScroll: {
    marginHorizontal: -4,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.background,
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
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.white,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryChip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  categoryChipTextActive: {
    color: Colors.white,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  searchButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.white,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  scholarshipCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  scholarshipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.secondary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  scholarshipHeaderContent: {
    flex: 1,
  },
  scholarshipName: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  providerText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  scholarshipDetails: {
    gap: 14,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  detailColumn: {
    gap: 4,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  applyButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  applyButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  noteCard: {
    backgroundColor: Colors.primary + '10',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  noteText: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 20,
  },
});
