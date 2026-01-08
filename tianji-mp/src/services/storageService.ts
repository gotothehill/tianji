import type { UserProfile } from '@/models';

const STORAGE_KEY = 'tianji_profiles_v2';
const ACTIVE_PROFILE_KEY = 'tianji_active_profile_id';

export const getProfiles = (): UserProfile[] => {
  try {
    const data = uni.getStorageSync(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to load profiles", e);
    return [];
  }
};

export const saveProfile = (profile: UserProfile): void => {
  const profiles = getProfiles();
  const existingIndex = profiles.findIndex(p => p.id === profile.id);

  if (existingIndex >= 0) {
    profiles[existingIndex] = profile;
  } else {
    profiles.push(profile);
  }

  (uni as any).setStorageSync(STORAGE_KEY, JSON.stringify(profiles));
};

export const deleteProfile = (id: string): void => {
  const profiles = getProfiles().filter(p => p.id !== id);
  (uni as any).setStorageSync(STORAGE_KEY, JSON.stringify(profiles));
};

export const getActiveProfileId = (): string | null => {
  return (uni as any).getStorageSync(ACTIVE_PROFILE_KEY) || null;
};

export const setActiveProfileId = (id: string): void => {
  (uni as any).setStorageSync(ACTIVE_PROFILE_KEY, id);
};

// --- Report Persistence ---

export const saveLifeBookReport = (profileId: string, content: string) => {
  const profiles = getProfiles();
  const index = profiles.findIndex(p => p.id === profileId);
  if (index === -1) return;

  if (!profiles[index].reports) profiles[index].reports = {};
  profiles[index].reports!.lifeBook = {
    content,
    timestamp: Date.now()
  };

  (uni as any).setStorageSync(STORAGE_KEY, JSON.stringify(profiles));
};

export const getLifeBookReport = (profileId: string) => {
  const profiles = getProfiles();
  const profile = profiles.find(p => p.id === profileId);
  return profile?.reports?.lifeBook?.content || null;
};

export const saveSynastryReport = (profileId: string, partnerId: string, content: string) => {
  const profiles = getProfiles();
  const index = profiles.findIndex(p => p.id === profileId);
  if (index === -1) return;

  if (!profiles[index].reports) profiles[index].reports = {};
  if (!profiles[index].reports!.synastry) profiles[index].reports!.synastry = {};

  profiles[index].reports!.synastry![partnerId] = {
    content,
    timestamp: Date.now()
  };

  uni.setStorageSync(STORAGE_KEY, JSON.stringify(profiles));
};

export const getSynastryReport = (profileId: string, partnerId: string) => {
  const profiles = getProfiles();
  const profile = profiles.find(p => p.id === profileId);
  return profile?.reports?.synastry?.[partnerId]?.content || null;
};
