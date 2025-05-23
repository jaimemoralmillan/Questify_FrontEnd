import { ref, readonly, computed } from 'vue';

export interface Avatar {
  id: string;
  name: string;
  imageUrl: string;
  xpRequired: number;
}

// Interface for UserProfile stored in localStorage (ensure it matches what's stored)
interface UserProfileForAvatar {
  id: number; // This is the UserProfile ID from the backend
  selected_avatar_id?: string | null;
  // Add other fields if they are accessed or relevant, otherwise keep minimal
}

// Function to get user-specific local storage key
const getLocalStorageKey = (baseKey: string): string => {
  const userId = localStorage.getItem('userId');
  if (userId) {
    return `${baseKey}_${userId}`;
  }
  // Fallback for when userId might not be immediately available or for a generic key
  // console.warn('UserId not found for avatar localStorage key, using generic key.');
  return `${baseKey}_guest`; // Or handle as an error, depending on requirements
};

const availableAvatarsList: readonly Avatar[] = [
  {
    id: 'monk',
    name: 'Monk',
    imageUrl: '/assets/avatars/monk.png',
    xpRequired: 0,
  },
  {
    id: 'astrologian',
    name: 'Astrologian',
    imageUrl: '/assets/avatars/astrologian.png',
    xpRequired: 0,
  },
  {
    id: 'bard',
    name: 'Bard',
    imageUrl: '/assets/avatars/bard.png',
    xpRequired: 0,
  },
  {
    id: 'blackmage',
    name: 'Black Mage',
    imageUrl: '/assets/avatars/blackmage.png',
    xpRequired: 0,
  },
  {
    id: 'darkknight',
    name: 'Dark Knight',
    imageUrl: '/assets/avatars/darkknight.png',
    xpRequired: 0,
  },
  {
    id: 'dragoon',
    name: 'Dragoon',
    imageUrl: '/assets/avatars/dragoon.png',
    xpRequired: 0,
  },
  {
    id: 'machinist',
    name: 'Machinist',
    imageUrl: '/assets/avatars/machinist.png',
    xpRequired: 0,
  },
  {
    id: 'ninja',
    name: 'Ninja',
    imageUrl: '/assets/avatars/ninja.png',
    xpRequired: 0,
  },
  {
    id: 'paladin',
    name: 'Paladin',
    imageUrl: '/assets/avatars/paladin.png',
    xpRequired: 0,
  },
  {
    id: 'scholar',
    name: 'Scholar',
    imageUrl: '/assets/avatars/scholar.png',
    xpRequired: 0,
  },
  {
    id: 'summoner',
    name: 'Summoner',
    imageUrl: '/assets/avatars/summoner.png',
    xpRequired: 0,
  },
  {
    id: 'warrior',
    name: 'Warrior',
    imageUrl: '/assets/avatars/warrior.png',
    xpRequired: 0,
  },
  {
    id: 'whitemage',
    name: 'White Mage',
    imageUrl: '/assets/avatars/whitemage.png',
    xpRequired: 0,
  },
  // Add more avatars here later
];

const selectedAvatarId = ref<string | null>(null);
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export function useAvatar() {
  const avatars = readonly(availableAvatarsList);

  const setSelectedAvatarId = async (avatarId: string | null) => {
    selectedAvatarId.value = avatarId; // Update reactive ref immediately

    // Persist to user-specific localStorage for immediate local effect and fallback
    if (avatarId) {
      localStorage.setItem(getLocalStorageKey('selectedAvatarId'), avatarId);
    } else {
      localStorage.removeItem(getLocalStorageKey('selectedAvatarId'));
    }

    // Attempt to save to backend
    const token = localStorage.getItem('authToken');
    const userProfileString = localStorage.getItem('userProfile');

    if (token && userProfileString) {
      try {
        const userProfile = JSON.parse(userProfileString) as UserProfileForAvatar;
        if (userProfile && typeof userProfile.id === 'number') { // Check if userProfile.id is a number
          const response = await fetch(`${API_BASE_URL}/api/profile/${userProfile.id}/`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Token ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ selected_avatar_id: avatarId }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.error('Failed to save avatar selection to backend:', response.status, errorData);
            // Optionally, revert local change or notify user
          } else {
            // console.log('Avatar selection saved to backend successfully.');
            // Update the userProfile in localStorage with the new selected_avatar_id
            const updatedProfile = { ...userProfile, selected_avatar_id: avatarId };
            localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
          }
        } else {
          console.warn('User profile ID not found in localStorage, cannot save avatar to backend.');
        }
      } catch (error) {
        console.error('Error saving avatar selection to backend:', error);
      }
    } else {
      console.warn('Auth token or user profile not found, cannot save avatar to backend. Selection saved locally.');
    }
  };

  const loadSelectedAvatarFromStorage = () => {
    let loadedAvatarId: string | null = null;
    const userProfileString = localStorage.getItem('userProfile');

    if (userProfileString) {
      try {
        const userProfile = JSON.parse(userProfileString) as UserProfileForAvatar;
        // Prioritize avatar ID from the comprehensive userProfile object
        if (userProfile && userProfile.selected_avatar_id !== undefined) {
          loadedAvatarId = userProfile.selected_avatar_id;
        }
      } catch (error) {
        console.error('Error parsing userProfile from localStorage:', error);
      }
    }

    // If not found in userProfile, try the specific localStorage key (fallback or older value)
    if (loadedAvatarId === null) {
      const storedAvatarId = localStorage.getItem(getLocalStorageKey('selectedAvatarId'));
      if (storedAvatarId) {
        loadedAvatarId = storedAvatarId;
      }
    }
    
    selectedAvatarId.value = loadedAvatarId;

    // If still null, and you want a default, set it here.
    // Example: if (!selectedAvatarId.value && avatars.length > 0) {
    //   setSelectedAvatarId(avatars[0].id); // This would also trigger a save
    // }
  };

  const selectedAvatar = computed(() => {
    if (!selectedAvatarId.value) return null;
    return avatars.find(avatar => avatar.id === selectedAvatarId.value) || null;
  });
  
  const resetAvatarToDefaultAndClearStorage = () => {
    const key = getLocalStorageKey('selectedAvatarId');
    localStorage.removeItem(key);
    
    // Also clear from the cached userProfile in localStorage if present
    const userProfileString = localStorage.getItem('userProfile');
    if (userProfileString) {
      try {
        const userProfile = JSON.parse(userProfileString) as UserProfileForAvatar;
        if (userProfile && userProfile.selected_avatar_id !== undefined) {
          delete userProfile.selected_avatar_id; // Or set to null
          localStorage.setItem('userProfile', JSON.stringify(userProfile));
        }
      } catch (error) {
        console.error('Error clearing avatar from cached userProfile:', error);
      }
    }
    selectedAvatarId.value = null; 
    // If you have a concept of a "default" avatar that's not 'null', set it here.
    // For now, clearing it means no avatar is actively selected from storage.
  };


  return {
    avatars,
    selectedAvatarId,
    selectedAvatar,
    setSelectedAvatarId,
    loadSelectedAvatarFromStorage,
    resetAvatarToDefaultAndClearStorage,
  };
}
