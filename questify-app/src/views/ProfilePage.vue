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
      
      <div v-if="isLoading" class="spinner-container" style="display: flex; justify-content: center; align-items: center; height: 100%;">
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
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton, onIonViewDidEnter, IonSpinner, IonProgressBar } from '@ionic/vue';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

// Define interfaces (can be imported or defined here if specific to profile)
interface User {
  id: number;
  username: string;
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
    const response = await fetch('http://localhost:8000/api/profile/', {
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
</style>
