import { ref, readonly } from 'vue';

// Define la estructura de un tema
export interface Theme {
  id: string;
  name: string;
  xpRequired: number;
  colors: {
    '--pixel-bg-dark'?: string; // Made optional
    '--pixel-bg-medium'?: string; // Made optional
    '--pixel-border-dark'?: string; // Made optional
    '--pixel-border-light'?: string; // Made optional
    '--pixel-text-light'?: string; // Made optional
    '--pixel-primary'?: string;
    '--pixel-primary-shade'?: string;
    '--pixel-accent'?: string;
    '--pixel-danger'?: string;
    '--pixel-xp-bar-fill'?: string;
    '--pixel-xp-bar-bg'?: string;
    '--current-bg-for-grid'?: string;
    '--current-border-for-grid'?: string;
    // Add any other theme-specific variables here as optional
  };
}

// Tema por defecto (Morado)
export const defaultThemeColors = {
  '--pixel-bg-dark': '#302c4d',
  '--pixel-bg-medium': '#4f4a75',
  '--pixel-border-dark': '#000000',
  '--pixel-border-light': '#8880b7',
  '--pixel-text-light': '#E0E0E0',
  '--pixel-primary': '#4e378d', // Morado primario
  '--pixel-accent': '#FFD700', // Amarillo Dorado
  '--pixel-xp-bar-fill': '#3AE73A', // Verde Neón
  '--pixel-xp-bar-bg': '#25213a', // Morado oscuro para fondo de barra de XP
};

// Lista de temas disponibles
export const availableThemes: readonly Theme[] = [
  {
    id: 'default-purple',
    name: 'Default Purple',
    xpRequired: 0,
    colors: defaultThemeColors
  },
  {
    id: 'forest-green',
    name: 'Forest Green',
    xpRequired: 100, // Example XP requirement
    colors: {
      '--pixel-bg-dark': '#2F4F2F', // Dark Green
      '--pixel-bg-medium': '#556B2F', // Olive Drab
      '--pixel-border-dark': '#003300', // Very Dark Green
      '--pixel-text-light': '#E8F5E9', // Light Greenish White
      '--pixel-primary': '#388E3C', // Primary Green
      '--pixel-primary-shade': '#2E7D32', // Darker Primary Green
      '--pixel-accent': '#FFC107', // Amber Accent
      '--pixel-danger': '#D32F2F', // Standard Red for Danger
      '--current-bg-for-grid': '#2F4F2F',
      '--current-border-for-grid': '#003300',
      '--pixel-xp-bar-bg': '#556B2F',
      '--pixel-xp-bar-fill': '#388E3C',
    }
  },
  {
    id: 'ocean-blue',
    name: 'Ocean Blue',
    xpRequired: 250,
    colors: {
      '--pixel-bg-dark': '#004D40', // Dark Teal
      '--pixel-bg-medium': '#00796B', // Medium Teal
      '--pixel-border-dark': '#00251A', // Very Dark Teal
      '--pixel-text-light': '#E0F2F1', // Light Bluish White
      '--pixel-primary': '#0288D1', // Primary Blue
      '--pixel-primary-shade': '#0277BD', // Darker Primary Blue
      '--pixel-accent': '#FFD600', // Yellow Accent
      '--pixel-danger': '#D32F2F',
      '--current-bg-for-grid': '#004D40',
      '--current-border-for-grid': '#00251A',
      '--pixel-xp-bar-bg': '#00796B',
      '--pixel-xp-bar-fill': '#0288D1',
    }
  },
  {
    id: 'sunset-orange',
    name: 'Sunset Orange',
    xpRequired: 400,
    colors: {
      '--pixel-bg-dark': '#BF360C', // Deep Orange Dark
      '--pixel-bg-medium': '#E64A19', // Deep Orange Medium
      '--pixel-border-dark': '#870000', // Very Dark Orange/Red
      '--pixel-text-light': '#FFF3E0', // Light Orange White
      '--pixel-primary': '#FF5722', // Primary Orange
      '--pixel-primary-shade': '#E64A19', // Darker Primary Orange (same as medium for variety)
      '--pixel-accent': '#FFCA28', // Amber Accent
      '--pixel-danger': '#D32F2F',
      '--current-bg-for-grid': '#BF360C',
      '--current-border-for-grid': '#870000',
      '--pixel-xp-bar-bg': '#E64A19',
      '--pixel-xp-bar-fill': '#FF5722',
    }
  },
  {
    id: 'crimson-red',
    name: 'Crimson Red',
    xpRequired: 600,
    colors: {
      '--pixel-bg-dark': '#4A0404',
      '--pixel-bg-medium': '#8C0F0F',
      '--pixel-border-dark': '#2C0707',
      '--pixel-text-light': '#FADBD8',
      '--pixel-primary': '#D9534F',
      '--pixel-primary-shade': '#C9302C',
      '--pixel-accent': '#F0AD4E',
      '--pixel-danger': '#FF6B6B',
      '--current-bg-for-grid': '#4A0404',
      '--current-border-for-grid': '#2C0707',
      '--pixel-xp-bar-bg': '#8C0F0F',
      '--pixel-xp-bar-fill': '#D9534F',
    }
  },
  {
    id: 'royal-gold',
    name: 'Royal Gold',
    xpRequired: 800,
    colors: {
      '--pixel-bg-dark': '#5C3D03',
      '--pixel-bg-medium': '#B8860B',
      '--pixel-border-dark': '#3B2708',
      '--pixel-text-light': '#FFF8DC',
      '--pixel-primary': '#FFD700',
      '--pixel-primary-shade': '#DAA520',
      '--pixel-accent': '#CD853F',
      '--pixel-danger': '#FF7F50',
      '--current-bg-for-grid': '#5C3D03',
      '--current-border-for-grid': '#3B2708',
      '--pixel-xp-bar-bg': '#B8860B',
      '--pixel-xp-bar-fill': '#FFD700',
    }
  },
  {
    id: 'cyberpunk-neon',
    name: 'Cyberpunk Neon',
    xpRequired: 1000,
    colors: {
      '--pixel-bg-dark': '#0D0221',
      '--pixel-bg-medium': '#240046',
      '--pixel-border-dark': '#03000A',
      '--pixel-text-light': '#F0F0F0',
      '--pixel-primary': '#FF00E4',
      '--pixel-primary-shade': '#C700B1',
      '--pixel-accent': '#00F6FF',
      '--pixel-danger': '#FA3939',
      '--current-bg-for-grid': '#0D0221',
      '--current-border-for-grid': '#03000A',
      '--pixel-xp-bar-bg': '#240046',
      '--pixel-xp-bar-fill': '#FF00E4',
    }
  },
  {
    id: 'monochrome-gray',
    name: 'Monochrome Gray',
    xpRequired: 1200,
    colors: {
      '--pixel-bg-dark': '#2E2E2E',
      '--pixel-bg-medium': '#555555',
      '--pixel-border-dark': '#1C1C1C',
      '--pixel-text-light': '#E0E0E0',
      '--pixel-primary': '#888888',
      '--pixel-primary-shade': '#6B6B6B',
      '--pixel-accent': '#A0A0A0',
      '--pixel-danger': '#D32F2F', // Standard red for visibility
      '--current-bg-for-grid': '#2E2E2E',
      '--current-border-for-grid': '#1C1C1C',
      '--pixel-xp-bar-bg': '#555555',
      '--pixel-xp-bar-fill': '#888888',
    }
  }
];

const currentThemeId = ref<string>('default-purple'); // Ensure this matches an actual theme ID

// API Base URL (consider moving to a config file or env variable if not already)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Función principal del composable
export function useTheme() {

  // Function to get user-specific or generic local storage key
  const getLocalStorageKey = (baseKey: string): string => {
    try {
      // Attempt 1: Direct userId from localStorage
      const userId = localStorage.getItem('userId');
      if (userId) {
        return `${baseKey}_${userId}`;
      }

      // Attempt 2: userId from userProfile in localStorage
      const profileString = localStorage.getItem('userProfile');
      if (profileString) {
        const profileData = JSON.parse(profileString);
        // Handle if profileData is an array (as seen in RewardsPage) or an object
        const userProfile = Array.isArray(profileData) ? profileData[0] : profileData;
        if (userProfile && userProfile.user && userProfile.user.id) {
          return `${baseKey}_${userProfile.user.id}`;
        }
      }
    } catch (error) {
      console.error('Error parsing userProfile from localStorage:', error);
      // Fallback to generic key if parsing fails or structure is unexpected
    }
    // Fallback to a generic key if no user-specific identifier is found
    // This might happen if the user is not logged in or data is missing
    console.warn(`No userId found for localStorage key: ${baseKey}. Using generic key.`);
    return `${baseKey}_guest`; // Or just baseKey if preferred for non-logged-in users
  };
  
  const setTheme = async (themeId: string) => {
    const theme = availableThemes.find(t => t.id === themeId);
    if (theme) {
      currentThemeId.value = theme.id;
      applyThemeColors(theme.colors);
      localStorage.setItem(getLocalStorageKey('selectedThemeId'), theme.id); // Still useful for quick local lookup

      // API Call to save theme to backend
      const token = localStorage.getItem('authToken');
      const userProfileString = localStorage.getItem('userProfile');
      let profileId: number | null = null;
      let parsedUserProfile: any = null;

      if (userProfileString) {
        try {
          parsedUserProfile = JSON.parse(userProfileString); // Should be an object
          // Ensure we have the UserProfile ID (not the user.id inside it)
          if (parsedUserProfile && typeof parsedUserProfile.id === 'number') {
            profileId = parsedUserProfile.id;
          } else {
            console.error('Parsed userProfile from localStorage does not have a numeric .id field for profileId.');
          }
        } catch (e) {
          console.error('Error parsing userProfile from localStorage for theme saving:', e);
        }
      }

      if (token && profileId !== null) {
        try {
          const response = await fetch(`${API_BASE_URL}/api/profile/${profileId}/`, { // CORRECTED URL
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Token ${token}`,
            },
            body: JSON.stringify({ selected_theme_id: theme.id }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.error('Failed to save theme to backend:', response.statusText, errorData);
          } else {
            console.log('Theme saved to backend successfully');
            // Update local userProfile in localStorage with the new selected_theme_id
            if (parsedUserProfile) {
              parsedUserProfile.selected_theme_id = theme.id;
              localStorage.setItem('userProfile', JSON.stringify(parsedUserProfile));
            }
          }
        } catch (error) {
          console.error('Error saving theme to backend:', error);
        }
      } else {
        if (!token) console.warn('No auth token found, cannot save theme to backend.');
        if (profileId === null) console.warn('No profileId found (or userProfile not structured as expected), cannot save theme to backend.');
      }

    } else {
      console.warn(`Theme with id '${themeId}' not found. Cannot set theme.`);
    }
  };

  const applyThemeColors = (colors: Theme['colors']) => {
    const root = document.documentElement;
    Object.entries(colors).forEach(([variable, value]) => {
      if (value) root.style.setProperty(variable, value);
    });

    // Actualizar variables para la cuadrícula del fondo
    const currentBgDark = colors['--pixel-bg-dark'] || defaultThemeColors['--pixel-bg-dark'];
    const currentBorderDark = colors['--pixel-border-dark'] || defaultThemeColors['--pixel-border-dark'];
    root.style.setProperty('--current-bg-for-grid', currentBgDark);
    root.style.setProperty('--current-border-for-grid', currentBorderDark);
  };

  // Función para aplicar un tema por su ID
  const applyThemeById = (themeId: string) => {
    const themeToApply = availableThemes.find(t => t.id === themeId);
    if (themeToApply) {
      applyThemeColors(themeToApply.colors);
      currentThemeId.value = themeId;
    } else {
      console.warn(`Theme with id '${themeId}' not found. Applying default theme.`);
      applyDefaultTheme();
    }
  };

  const applyDefaultTheme = () => {
    applyThemeColors(defaultThemeColors);
    currentThemeId.value = 'default-purple';
  };

  const loadThemeFromStorage = () => {
    let themeIdToLoad: string | null = null;
    const userProfileString = localStorage.getItem('userProfile');

    if (userProfileString) {
      try {
        const profileData = JSON.parse(userProfileString);
        // Handle if profileData is an array (as seen in RewardsPage) or an object
        const userProfile = Array.isArray(profileData) ? profileData[0] : profileData;

        if (userProfile && userProfile.selected_theme_id) {
          themeIdToLoad = userProfile.selected_theme_id;
        }
      } catch (error) {
        console.error('Error parsing userProfile from localStorage for theme loading:', error);
      }
    }

    // If not found in userProfile, try the specific localStorage key
    if (!themeIdToLoad) {
      const storedThemeId = localStorage.getItem(getLocalStorageKey('selectedThemeId'));
      if (storedThemeId && availableThemes.some(t => t.id === storedThemeId)) {
        themeIdToLoad = storedThemeId;
      }
    }

    if (themeIdToLoad) {
      // Corrected: Only apply the theme locally, do not call setTheme which tries to save to backend.
      applyThemeById(themeIdToLoad);
    } else {
      applyDefaultTheme();
      // If you want to ensure the default theme is also set on the backend
      // if no theme is found for the user, you could consider calling setTheme('default-purple') here,
      // but be mindful of doing it only once or under specific conditions.
      // For now, just applying default locally is safer.
    }
  };

  const resetThemeToDefaultAndClearStorage = () => {
    applyDefaultTheme();
    // Clear both user-specific and generic keys for activeThemeId
    const userSpecificKey = getLocalStorageKey('activeThemeId');
    localStorage.removeItem(userSpecificKey);
    if (userSpecificKey !== 'activeThemeId') { // Ensure we also remove the base key if it was used due to no userId
      localStorage.removeItem('activeThemeId');
    }
    // No need to remove 'userId' here, as it's managed by login/logout processes primarily.
    // However, if a theme is reset, it implies user context might be changing or preferences cleared.
    // For now, let's keep userId removal in the logout logic of pages.
  };


  return {
    themes: readonly(availableThemes),
    currentThemeId: readonly(currentThemeId),
    applyThemeById,
    applyDefaultTheme,
    loadThemeFromStorage,
    setTheme,
    resetThemeToDefaultAndClearStorage,
    getLocalStorageKey // Exponer para uso externo si es necesario
  };
}
