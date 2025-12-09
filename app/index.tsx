import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Compass, Sparkles, Target, TrendingUp } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';

const { width } = Dimensions.get('window');

export default function LandingPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (!isLoading && user) {
      if (user.onboardingCompleted) {
        router.replace('/dashboard');
      } else if (!user.name) {
        router.replace('/onboarding/personal-info');
      } else if (!user.quizCompleted) {
        router.replace('/onboarding/quiz');
      } else {
        router.replace('/onboarding/quiz-results');
      }
    }
  }, [user, isLoading]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const features = [
    { icon: Compass, text: 'AI Career Guidance' },
    { icon: Target, text: 'Personalized Roadmaps' },
    { icon: Sparkles, text: 'Aptitude Analysis' },
    { icon: TrendingUp, text: 'College & Job Finder' },
  ];

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>GUIDIFY</Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={[Colors.primary, Colors.primaryDark, '#1E1B4B']} style={styles.gradient}>
      <SafeAreaView style={styles.container}>
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.heroSection}>
            <View style={styles.logoContainer}>
              <Compass size={60} color={Colors.white} strokeWidth={2} />
            </View>
            <Text style={styles.title}>GUIDIFY</Text>
            <Text style={styles.subtitle}>Your AI-Powered Career Companion</Text>
            <Text style={styles.description}>
              Discover your path, unlock your potential, and achieve your dreams with personalized
              guidance
            </Text>
          </View>

          <View style={styles.featuresGrid}>
            {features.map((feature, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.featureCard,
                  {
                    opacity: fadeAnim,
                    transform: [
                      {
                        translateY: slideAnim.interpolate({
                          inputRange: [0, 50],
                          outputRange: [0, 50 + index * 10],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <feature.icon size={28} color={Colors.secondary} strokeWidth={2} />
                <Text style={styles.featureText}>{feature.text}</Text>
              </Animated.View>
            ))}
          </View>

          <View style={styles.buttonContainer}>
            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
              onPress={() => router.push('/auth/signup')}
            >
              <Text style={styles.primaryButtonText}>Get Started</Text>
            </Pressable>
          </View>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary,
  },
  loadingText: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: Colors.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 20,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 48,
    fontWeight: '900' as const,
    color: Colors.white,
    letterSpacing: 2,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.secondary,
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  featureCard: {
    width: (width - 64) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  featureText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.white,
    textAlign: 'center',
    marginTop: 12,
  },
  buttonContainer: {
    gap: 16,
    marginTop: 'auto' as const,
  },
  primaryButton: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  buttonPressed: {
    opacity: 0.7,
  },
});
