<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/home"></ion-back-button>
        </ion-buttons>
        <ion-title>Rewards - Questify</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding rewards-page-content">
      <div class="page-container">
        <div v-if="isLoading" class="spinner-container">
          <ion-spinner></ion-spinner>
        </div>

        <template v-if="!isLoading">
          <div class="section-container themes-section">
            <h2>Themes</h2>
            <p class="xp-info">Your Total XP: {{ userProfile?.total_xp ?? 0 }}</p>
            <div v-if="themes.length > 0" class="themes-grid">
              <div 
                v-for="theme in themes" 
                :key="theme.id"
                class="theme-card" 
                :class="{ 
                  'unlocked': isThemeUnlocked(theme),
                  'locked': !isThemeUnlocked(theme),
                  'active': isActiveTheme(theme) 
                }"
                @click="isThemeUnlocked(theme) ? handleSelectTheme(theme) : showThemeLockedToast()"
              >
                <div class="theme-preview" :style="getThemePreviewStyle(theme)">
                  <span v-if="!isThemeUnlocked(theme)" class="lock-icon"></span>
                </div>
                <p class="theme-name">{{ theme.name }}</p>
                <p v-if="!isThemeUnlocked(theme)" class="theme-unlock-xp">Requires: {{ theme.xpRequired }} XP</p>
                <p v-if="isThemeUnlocked(theme) && !isActiveTheme(theme)" class="theme-select-text">Click to select</p>
                <p v-if="isActiveTheme(theme)" class="theme-active-text">Active</p>
              </div>
            </div>
            <p v-else class="info-message">No themes available at the moment.</p>
          </div>

          <!-- New Avatars Section -->
          <div class="section-container avatars-section">
            <h2>Avatars</h2>
            <p class="xp-info">Your Total XP: {{ userProfile?.total_xp ?? 0 }}</p>
            <div v-if="avatars.length > 0" class="avatars-grid">
              <div 
                v-for="avatar in avatars" 
                :key="avatar.id"
                class="avatar-card" 
                :class="{
                  'unlocked': isAvatarUnlocked(avatar),
                  'locked': !isAvatarUnlocked(avatar),
                  'active': isActiveAvatar(avatar)
                }"
                @click="isAvatarUnlocked(avatar) ? handleSelectAvatar(avatar) : showAvatarLockedToast()"
              >
                <div class="avatar-preview">
                  <img :src="avatar.imageUrl" :alt="avatar.name" class="avatar-image" />
                  <span v-if="!isAvatarUnlocked(avatar)" class="lock-icon"></span>
                </div>
                <p class="avatar-name">{{ avatar.name }}</p>
                <p v-if="!isAvatarUnlocked(avatar)" class="avatar-unlock-xp">Requires: {{ avatar.xpRequired }} XP</p>
                <p v-if="isAvatarUnlocked(avatar) && !isActiveAvatar(avatar)" class="avatar-select-text">Click to select</p>
                <p v-if="isActiveAvatar(avatar)" class="avatar-active-text">Active</p>
              </div>
            </div>
            <p v-else class="info-message">No avatars available at the moment.</p>
          </div>
        </template>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton, IonSpinner, onIonViewDidEnter, toastController } from '@ionic/vue';
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useTheme, type Theme } from '../composables/useTheme';
import { useAvatar, type Avatar } from '../composables/useAvatar'; // Import useAvatar

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

interface UserProfile {
  id: number;
  user: { id: number; username: string; }; // Asegurar que user.id está aquí
  total_xp: number;
  selected_theme_id?: string | null;
  selected_avatar_id?: string | null; // Línea añadida
  // selected_avatar_id: string | null; // Will be added later when backend is ready
}

const router = useRouter();
const userProfile = ref<UserProfile | null>(null);
const isLoading = ref(false);

const { 
  themes, // Obtener la lista de temas del composable
  currentThemeId, // Obtener el ID del tema actual
  setTheme, // Función para establecer un nuevo tema
  loadThemeFromStorage // Función para cargar el tema desde el almacenamiento
} = useTheme();

const { 
  avatars, 
  selectedAvatarId, 
  setSelectedAvatarId, 
  loadSelectedAvatarFromStorage 
} = useAvatar(); // Destructure avatar functions

const fetchUserProfile = async () => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    router.push('/login');
    return;
  }
  try {
    const response = await fetch(`${API_BASE_URL}/api/profile/`, {
      headers: { 'Authorization': `Token ${token}` },
    });
    if (response.ok) {
      const data = await response.json();
      if (data && data.length > 0) {
        userProfile.value = data[0];
        // Store userProfile and userId for theme composable
        localStorage.setItem('userProfile', JSON.stringify(data[0])); // Store the first profile object
        if (data[0].user && data[0].user.id) {
          localStorage.setItem('userId', data[0].user.id.toString());
        }
      } else {
        console.warn('User profile not found for RewardsPage.');
        localStorage.removeItem('userProfile');
      }
    } else {
      console.error('Failed to load user profile for RewardsPage:', response.statusText);
      localStorage.removeItem('userProfile');
    }
  } catch (error) {
    console.error('Fetch user profile error for RewardsPage:', error);
    localStorage.removeItem('userProfile');
  }
};

const isThemeUnlocked = (theme: Theme): boolean => {
  return (userProfile.value?.total_xp ?? 0) >= theme.xpRequired;
};

// Usar currentThemeId del composable para determinar el tema activo
const isActiveTheme = (theme: Theme): boolean => {
  return currentThemeId.value === theme.id;
};

const handleSelectTheme = async (theme: Theme) => {
  if (!isThemeUnlocked(theme)) { // Doble verificación, aunque el click handler ya lo hace
    await showThemeLockedToast();
    return;
  }
  setTheme(theme.id); // Usar la función setTheme del composable
  const toast = await toastController.create({
    message: `${theme.name} theme selected!`,
    duration: 2000,
    color: 'success',
    position: 'top'
  });
  toast.present();
};

const showThemeLockedToast = async () => {
  const toast = await toastController.create({
    message: 'Theme locked! Keep earning XP.',
    duration: 2000,
    color: 'warning',
    position: 'top'
  });
  toast.present();
};

const getThemePreviewStyle = (theme: Theme) => {
  return {
    backgroundColor: theme.colors['--pixel-bg-medium'],
    borderColor: theme.colors['--pixel-border-light'],
    // Puedes añadir más estilos para simular el tema
  };
};

// Avatar specific logic
const isAvatarUnlocked = (avatar: Avatar): boolean => {
  return (userProfile.value?.total_xp ?? 0) >= avatar.xpRequired;
};

const isActiveAvatar = (avatar: Avatar): boolean => {
  return selectedAvatarId.value === avatar.id;
};

const handleSelectAvatar = async (avatar: Avatar) => {
  if (!isAvatarUnlocked(avatar)) {
    await showAvatarLockedToast();
    return;
  }
  setSelectedAvatarId(avatar.id);
  // For now, we are not calling an API to save to backend
  const toast = await toastController.create({
    message: `${avatar.name} avatar selected!`,
    duration: 2000,
    color: 'success',
    position: 'top'
  });
  toast.present();
};

const showAvatarLockedToast = async () => {
  const toast = await toastController.create({
    message: 'Avatar locked! Keep earning XP.',
    duration: 2000,
    color: 'warning',
    position: 'top'
  });
  toast.present();
};

onIonViewDidEnter(async () => {
  isLoading.value = true;
  await fetchUserProfile(); // Fetch profile first to ensure userId is available
  // Now that userProfile (and potentially userId) is in localStorage, load themes
  const themeComposable = useTheme();
  themeComposable.loadThemeFromStorage();

  // Load avatar
  const avatarComposable = useAvatar();
  avatarComposable.loadSelectedAvatarFromStorage();
  
  isLoading.value = false;
});

</script>

<style scoped>
.page-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 15px;
}

.section-container {
  background-color: var(--pixel-bg-medium);
  padding: 20px;
  margin-bottom: 25px;
  border: 3px solid var(--pixel-border-dark);
  box-shadow: 4px 4px 0px var(--pixel-border-dark);
  border-radius: 0;
}

.section-container h2 {
  text-align: center;
  margin-top: 0;
  margin-bottom: 15px;
  color: var(--pixel-text-light);
  font-size: 1.5em;
}

.xp-info {
  text-align: center;
  color: var(--pixel-text-light);
  margin-bottom: 20px;
  font-size: 1.1em;
}

.themes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 20px;
}

.theme-card {
  background-color: var(--pixel-bg-dark); /* Un poco más oscuro que el contenedor */
  border: 2px solid var(--pixel-border-light);
  padding: 15px;
  text-align: center;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  position: relative;
}

.theme-card.locked {
  cursor: not-allowed;
  opacity: 0.6;
}

.theme-card.unlocked:hover {
  transform: translateY(-3px);
  box-shadow: 0px 6px 0px var(--pixel-border-dark);
}

.theme-card.active {
  border-color: var(--pixel-accent, #FFD700); /* Resaltar tema activo */
  box-shadow: 0 0 0 3px var(--pixel-accent, #FFD700), 4px 4px 0px var(--pixel-border-dark);
}

.theme-preview {
  width: 100%;
  height: 80px;
  border: 2px solid var(--pixel-border-dark);
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-size: cover; /* Para futuros patrones o imágenes */
}

.lock-icon::before {
  content: '🔒'; /* Icono de candado simple */
  font-size: 2em;
  color: var(--pixel-text-light);
}

.theme-name {
  font-size: 1em;
  color: var(--pixel-text-light);
  margin-bottom: 5px;
  font-weight: bold;
}

.theme-unlock-xp {
  font-size: 0.8em;
  color: var(--pixel-accent, #FFD700); /* Color de acento para XP */
}

.theme-select-text {
  font-size: 0.8em;
  color: var(--pixel-primary, #4e378d);
  margin-top: 5px;
}

.theme-active-text {
  font-size: 0.9em;
  color: var(--pixel-accent, #FFD700);
  font-weight: bold;
  margin-top: 5px;
}

.avatars-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); /* Smaller cards for avatars */
  gap: 15px;
}

.avatar-card {
  background-color: var(--pixel-bg-dark);
  border: 2px solid var(--pixel-border-light);
  padding: 10px;
  text-align: center;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  position: relative;
}

.avatar-card.locked {
  cursor: not-allowed;
  opacity: 0.6;
}

.avatar-card.unlocked:hover {
  transform: translateY(-3px);
  box-shadow: 0px 4px 0px var(--pixel-border-dark);
}

.avatar-card.active {
  border-color: var(--pixel-accent, #FFD700);
  box-shadow: 0 0 0 2px var(--pixel-accent, #FFD700), 2px 2px 0px var(--pixel-border-dark);
}

.avatar-preview {
  width: 80px; /* Adjust size as needed */
  height: 80px; /* Adjust size as needed */
  border: 2px solid var(--pixel-border-dark);
  margin: 0 auto 10px auto;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden; /* Ensure image fits */
  background-color: var(--pixel-bg-medium); /* Fallback bg */
}

.avatar-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain; /* Or scale-down if you prefer */
}

.avatar-name {
  font-size: 0.9em;
  color: var(--pixel-text-light);
  margin-bottom: 4px;
  font-weight: bold;
}

.avatar-unlock-xp {
  font-size: 0.75em;
  color: var(--pixel-accent, #FFD700);
}

.avatar-select-text {
  font-size: 0.75em;
  color: var(--pixel-primary, #4e378d);
  margin-top: 3px;
}

.avatar-active-text {
  font-size: 0.8em;
  color: var(--pixel-accent, #FFD700);
  font-weight: bold;
  margin-top: 3px;
}

/* Ensure lock icon is visible on avatar preview if needed */
.avatar-preview .lock-icon::before {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -80%); /* Adjust to center on preview */
  font-size: 1.5em; /* Smaller lock for avatar */
}

.spinner-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

.info-message {
  color: var(--pixel-text-light);
  text-align: center;
  margin-top: 15px;
  font-size: 1em;
  opacity: 0.8;
}

ion-back-button {
  color: var(--pixel-text-light);
}

</style>
