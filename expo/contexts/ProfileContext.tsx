import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { UserProfile } from '@/types/user';
import { validateProfile, validateField } from '@/lib/validation';

const PROFILE_KEY = '@guidify_profile';

export const [ProfileProvider, useProfile] = createContextHook(() => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      console.log('[ProfileContext] Loading profile from storage...');
      const currentEmail = await AsyncStorage.getItem('@guidify_current_user');
      
      if (!currentEmail) {
        console.log('[ProfileContext] No current user found');
        setIsLoading(false);
        return;
      }

      const stored = await AsyncStorage.getItem(PROFILE_KEY);
      if (stored) {
        const allProfiles: Record<string, UserProfile> = JSON.parse(stored);
        const userProfile = allProfiles[currentEmail];
        
        if (userProfile) {
          console.log('[ProfileContext] Profile loaded successfully:', {
            name: userProfile.name,
            skills: userProfile.skills?.length || 0,
          });
          setProfile(userProfile);
        } else {
          console.log('[ProfileContext] No profile found for user:', currentEmail);
        }
      }
    } catch (error) {
      console.error('[ProfileContext] Error loading profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveProfile = async (updatedProfile: UserProfile) => {
    try {
      setIsSyncing(true);
      console.log('[ProfileContext] Saving profile...', {
        name: updatedProfile.name,
        skills: updatedProfile.skills?.length || 0,
      });

      const currentEmail = await AsyncStorage.getItem('@guidify_current_user');
      if (!currentEmail) {
        console.error('[ProfileContext] Cannot save: No current user');
        return;
      }

      const stored = await AsyncStorage.getItem(PROFILE_KEY);
      const allProfiles: Record<string, UserProfile> = stored ? JSON.parse(stored) : {};
      
      allProfiles[currentEmail] = updatedProfile;
      await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(allProfiles));
      
      setProfile(updatedProfile);
      console.log('[ProfileContext] Profile saved successfully');
    } catch (error) {
      console.error('[ProfileContext] Error saving profile:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!profile) {
      console.error('[ProfileContext] Cannot update: No profile loaded');
      return { success: false, errors: [{ field: 'general', message: 'No profile loaded' }] };
    }

    const updatedProfile = { ...profile, ...updates };
    const validation = validateProfile(updatedProfile);

    console.log('[ProfileContext] Update validation:', validation);

    if (!validation.isValid) {
      return { success: false, errors: validation.errors };
    }

    await saveProfile(updatedProfile);
    return { success: true, errors: [] };
  };

  const updateField = async (field: keyof UserProfile, value: unknown) => {
    if (!profile) {
      console.error('[ProfileContext] Cannot update field: No profile loaded');
      return { success: false, error: { field: 'general', message: 'No profile loaded' } };
    }

    const error = validateField(field, value, { ...profile, [field]: value });
    
    if (error) {
      console.log('[ProfileContext] Field validation failed:', error);
      return { success: false, error };
    }

    const updatedProfile = { ...profile, [field]: value };
    await saveProfile(updatedProfile);
    return { success: true, error: null };
  };

  const createProfile = async (newProfile: UserProfile) => {
    console.log('[ProfileContext] Creating new profile...');
    const validation = validateProfile(newProfile);

    if (!validation.isValid) {
      console.log('[ProfileContext] Profile validation failed:', validation.errors);
      return { success: false, errors: validation.errors };
    }

    await saveProfile(newProfile);
    return { success: true, errors: [] };
  };

  const clearProfile = async () => {
    console.log('[ProfileContext] Clearing profile...');
    const currentEmail = await AsyncStorage.getItem('@guidify_current_user');
    if (!currentEmail) return;

    const stored = await AsyncStorage.getItem(PROFILE_KEY);
    if (stored) {
      const allProfiles: Record<string, UserProfile> = JSON.parse(stored);
      delete allProfiles[currentEmail];
      await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(allProfiles));
    }

    setProfile(null);
  };

  const hasField = (field: keyof UserProfile): boolean => {
    if (!profile) return false;
    const value = profile[field];
    
    if (value === undefined || value === null) return false;
    if (typeof value === 'string' && value.trim().length === 0) return false;
    if (Array.isArray(value) && value.length === 0) return false;
    if (typeof value === 'number' && value === 0) return false;
    
    return true;
  };

  const getFieldValue = <K extends keyof UserProfile>(field: K): UserProfile[K] | null => {
    return profile?.[field] || null;
  };

  return {
    profile,
    isLoading,
    isSyncing,
    updateProfile,
    updateField,
    createProfile,
    clearProfile,
    hasField,
    getFieldValue,
    validateProfile,
    validateField,
  };
});

export function useProfileField<K extends keyof UserProfile>(field: K): UserProfile[K] | null {
  const { profile } = useProfile();
  return profile?.[field] || null;
}

export function useHasProfileData(): boolean {
  const { profile } = useProfile();
  return !!profile && profile.onboardingCompleted;
}
