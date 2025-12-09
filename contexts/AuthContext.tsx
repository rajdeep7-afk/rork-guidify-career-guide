import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';
import { useEffect, useState } from 'react';
import { UserProfile } from '@/types/user';

const USER_KEY = '@guidify_user';

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentEmail = await AsyncStorage.getItem('@guidify_current_user');
      if (!currentEmail) {
        setIsLoading(false);
        return;
      }
      
      const stored = await AsyncStorage.getItem(USER_KEY);
      if (stored) {
        const allUsers: Record<string, { password: string; profile: UserProfile }> = JSON.parse(stored);
        const userRecord = allUsers[currentEmail];
        if (userRecord) {
          setUser(userRecord.profile);
        }
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveUser = async (userData: UserProfile) => {
    try {
      const currentEmail = await AsyncStorage.getItem('@guidify_current_user');
      if (!currentEmail) return;
      
      const stored = await AsyncStorage.getItem(USER_KEY);
      if (!stored) return;
      
      const allUsers: Record<string, { password: string; profile: UserProfile }> = JSON.parse(stored);
      if (allUsers[currentEmail]) {
        allUsers[currentEmail].profile = userData;
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(allUsers));
        setUser(userData);
      }
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const stored = await AsyncStorage.getItem(USER_KEY);
      let allUsers: Record<string, { password: string; profile: UserProfile }> = {};
      
      if (stored) {
        allUsers = JSON.parse(stored);
      }
      
      if (allUsers[email]) {
        Alert.alert('Error', 'User already exists. Please login.');
        return false;
      }
      
      const newUser: UserProfile = {
        id: Date.now().toString(),
        email,
        name: '',
        age: 0,
        skills: [],
        learningPreferences: [],
        quizCompleted: false,
        onboardingCompleted: false,
        authProvider: 'email',
      };
      
      allUsers[email] = { password, profile: newUser };
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(allUsers));
      await AsyncStorage.setItem('@guidify_current_user', email);
      setUser(newUser);
      router.replace('/onboarding/personal-info');
      return true;
    } catch (error) {
      console.error('Signup error:', error);
      Alert.alert('Error', 'Failed to create account');
      return false;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const stored = await AsyncStorage.getItem(USER_KEY);
      if (!stored) {
        Alert.alert('Error', 'No account found. Please sign up.');
        return false;
      }
      
      const allUsers: Record<string, { password: string; profile: UserProfile }> = JSON.parse(stored);
      const userRecord = allUsers[email];
      
      if (!userRecord) {
        Alert.alert('Error', 'Email not found. Please sign up.');
        return false;
      }
      
      if (userRecord.password !== password) {
        Alert.alert('Error', 'Incorrect password.');
        return false;
      }
      
      await AsyncStorage.setItem('@guidify_current_user', email);
      setUser(userRecord.profile);
      
      if (userRecord.profile.onboardingCompleted) {
        router.replace('/dashboard');
      } else if (userRecord.profile.quizCompleted) {
        router.replace('/onboarding/quiz-results');
      } else {
        router.replace('/onboarding/personal-info');
      }
      return true;
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Failed to login');
      return false;
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    const updatedUser = { ...user, ...updates };
    await saveUser(updatedUser);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('@guidify_current_user');
    setUser(null);
    router.replace('/');
  };

  return {
    user,
    isLoading,
    signUp,
    login,
    updateProfile,
    logout,
    isAuthenticated: !!user,
  };
});
