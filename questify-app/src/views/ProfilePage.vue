<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/home"></ion-back-button>
        </ion-buttons>
        <ion-title>Profile</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true" class="ion-padding">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Profile</ion-title>
        </ion-toolbar>
      </ion-header>
      
      <div v-if="isLoading" class="spinner-container">
        <ion-spinner></ion-spinner>
      </div>

      <div v-if="!isLoading && userProfile" style="margin-bottom: 20px;">
        <h2>Your Profile</h2>
        <p>Total XP: {{ userProfile.total_xp }}</p>
        <p v-if="userProfile.user">Username: {{ userProfile.user.username }}</p>
        <p v-if="userProfile.level !== undefined">Level: {{ userProfile.level }}</p>
        <!-- XP Progress Bar -->
        <div v-if="userProfile.level !== undefined && userProfile.xp_needed_for_level_up !== undefined && userProfile.xp_needed_for_level_up > 0" style="margin-top: 10px;">
          <ion-progress-bar :value="userProfile.xp_progress_in_current_level / userProfile.xp_needed_for_level_up"></ion-progress-bar>
          <p style="font-size: 0.9em; margin-top: 5px;">
            XP: {{ userProfile.xp_progress_in_current_level }} / {{ userProfile.xp_needed_for_level_up }}
          </p>
        </div>

        <!-- Mostrar Logros Desbloqueados -->
        <div v-if="userProfile.unlocked_achievements && userProfile.unlocked_achievements.length > 0" style="margin-top: 20px;">
          <h3><ion-icon :icon="ribbonOutline" style="margin-right: 5px;"></ion-icon>Achievements Unlocked:</h3>
          <ion-list>
            <ion-item v-for="ach in userProfile.unlocked_achievements" :key="ach.name">
              <ion-icon 
                v-if="ach.icon && iconMap[ach.icon]" 
                :icon="iconMap[ach.icon]" 
                slot="start">
              </ion-icon>
              <ion-icon 
                v-else-if="ach.icon" 
                :icon="helpCircleOutline" 
                slot="start">
                <!-- Icono de fallback si ach.icon existe pero no está en iconMap -->
              </ion-icon>
              <ion-icon 
                v-else 
                :icon="starOutline" 
                slot="start">
                <!-- Icono por defecto si ach.icon es null/undefined -->
              </ion-icon>
              <ion-label>
                <h4>{{ ach.name }}</h4>
                <p>{{ ach.description }}</p>
                <p v-if="ach.xp_reward > 0">+{{ ach.xp_reward }} XP</p>
              </ion-label>
            </ion-item>
          </ion-list>
        </div>
        <div v-else-if="userProfile.unlocked_achievements && userProfile.unlocked_achievements.length === 0" style="margin-top: 10px;">
            <p>No achievements unlocked yet. Keep playing!</p>
        </div>

      </div>
      <div v-if="!isLoading && errorMessage" style="color: red; text-align: center;">
        <p>{{ errorMessage }}</p>
      </div>
      <div v-if="!isLoading && !userProfile && !errorMessage" style="text-align: center;">
        <p>No profile data to display.</p>
      </div>

    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton, onIonViewDidEnter, IonSpinner, IonProgressBar, IonList, IonItem, IonLabel, IonIcon } from '@ionic/vue';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
// Import icons for achievements
import { starOutline, ribbonOutline, trophyOutline, checkmarkCircleOutline, schoolOutline, medalOutline, helpCircleOutline } from 'ionicons/icons'; 

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'; // Fallback for local dev

// Icon map for achievements
const iconMap: { [key: string]: string } = {
  'star': starOutline,
  'ribbon': ribbonOutline,
  'trophy': trophyOutline,
  'checkmark-circle': checkmarkCircleOutline,
  'school': schoolOutline,
  'medal': medalOutline,
  'default': helpCircleOutline, // Fallback icon
};

// Define interfaces (can be imported or defined here if specific to profile)
interface User {
  id: number;
  username: string;
}

// --- Interface para Logros ---
interface Achievement {
  name: string;
  description: string;
  icon: string | null; 
  xp_reward: number;
}

interface UserProfile {
  id: number;
  user: User;
  total_xp: number;
  level: number;
  xp_at_current_level_start: number;
  xp_for_next_level: number;
  xp_progress_in_current_level: number;
  xp_needed_for_level_up: number;
  unlocked_achievements: Achievement[]; // Add this line
}

const router = useRouter();
const userProfile = ref<UserProfile | null>(null);
const errorMessage = ref('');
const isLoading = ref(false);

// Function to fetch user profile (will be moved/adapted from HomePage)
const fetchUserProfile = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  const token = localStorage.getItem('authToken');

  if (!token) {
    errorMessage.value = 'Authentication token not found. Please login again.';
    isLoading.value = false;
    router.push('/login'); // Redirect to login if no token
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/profile/`, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (response.ok) {
      const data = await response.json();
      if (data && data.length > 0) {
        userProfile.value = data[0];
      } else {
        userProfile.value = null;
        errorMessage.value = 'User profile not found.';
        console.warn('User profile not found or empty response.');
      }
    } else {
      const errorData = await response.json();
      errorMessage.value = 'Failed to load user profile: ' + (errorData.detail || response.statusText);
      if (response.status === 401) {
        router.push('/login');
      }
    }
  } catch (error) {
    errorMessage.value = 'An error occurred while fetching user profile.';
    console.error('Fetch user profile error:', error);
  } finally {
    isLoading.value = false;
  }
};

onIonViewDidEnter(() => {
  fetchUserProfile();
});

</script>

<style scoped>
#container {
  text-align: center;
}
.spinner-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}
</style>
