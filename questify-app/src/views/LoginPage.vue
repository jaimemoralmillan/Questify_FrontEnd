<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ isRegisterMode ? 'Register' : 'Login' }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <!-- Login Form -->
      <form v-if="!isRegisterMode" @submit.prevent="handleLogin">
        <ion-item>
          <ion-label position="floating">Username</ion-label>
          <ion-input v-model="username" type="text" required></ion-input>
        </ion-item>
        <ion-item>
          <ion-label position="floating">Password</ion-label>
          <ion-input v-model="password" type="password" required></ion-input>
        </ion-item>
        <ion-button expand="block" type="submit" class="ion-margin-top">Login</ion-button>
      </form>

      <!-- Register Form -->
      <form v-if="isRegisterMode" @submit.prevent="handleRegister">
        <ion-item>
          <ion-label position="floating">Username</ion-label>
          <ion-input v-model="username" type="text" required></ion-input>
        </ion-item>
        <ion-item>
          <ion-label position="floating">Password</ion-label>
          <ion-input v-model="password" type="password" required></ion-input>
        </ion-item>
        <ion-item>
          <ion-label position="floating">Confirm Password</ion-label>
          <ion-input v-model="password2" type="password" required></ion-input>
        </ion-item>
        <ion-button expand="block" type="submit" class="ion-margin-top">Register</ion-button>
      </form>

      <ion-button fill="clear" expand="block" @click="toggleMode" class="ion-margin-top">
        {{ isRegisterMode ? 'Already have an account? Login' : "Don't have an account? Register" }}
      </ion-button>
      <p v-if="errorMessage" style="color: red; text-align: center;">{{ errorMessage }}</p>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, IonInput, IonButton } from '@ionic/vue';
import { useRouter } from 'vue-router';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'; // Fallback for local dev

export default defineComponent({
  name: 'LoginPage',
  components: {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
  },
  setup() {
    const router = useRouter();
    const username = ref('');
    const password = ref('');
    const password2 = ref('');
    const errorMessage = ref('');
    const isRegisterMode = ref(false);

    const toggleMode = () => {
      isRegisterMode.value = !isRegisterMode.value;
      errorMessage.value = ''; // Clear errors when switching modes
      // Clear form fields
      username.value = '';
      password.value = '';
      password2.value = '';
    };

    const handleLogin = async () => {
      errorMessage.value = ''; // Clear previous errors
      try {
        const response = await fetch(`${API_BASE_URL}/api-token-auth/`, { // Use API_BASE_URL
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            username: username.value,
            password: password.value,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          localStorage.setItem('authToken', data.token); // Guardar el token
          console.log('Login successful, token:', data.token);
          // Redirigir a la página principal o dashboard después del login
          router.push('/home'); // Asumiendo que '/home' es tu página principal
        } else {
          const errorData = await response.json();
          errorMessage.value = 'Login failed: ' + (errorData.non_field_errors?.[0] || 'Invalid credentials');
          console.error('Login failed:', errorData);
        }
      } catch (error) {
        errorMessage.value = 'An error occurred during login.';
        console.error('Login error:', error);
      }
    };

    const handleRegister = async () => {
      errorMessage.value = ''; // Clear previous errors
      if (password.value !== password2.value) {
        errorMessage.value = 'Passwords do not match.';
        return;
      }
      try {
        const payload: any = {
          username: username.value,
          password: password.value,
          password2: password2.value,
        };

        const response = await fetch(`${API_BASE_URL}/api/users/register/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          // const data = await response.json(); // Optional: if backend sends data
          alert('Registration successful! Please login.'); // Or show a toast
          toggleMode(); // Switch to login mode
        } else {
          const errorData = await response.json();
          let errorMsg = 'Registration failed: ';
          if (errorData.username) errorMsg += `Username: ${errorData.username.join(', ')} `;
          if (errorData.password) errorMsg += `Password: ${errorData.password.join(', ')} `;
          if (errorData.non_field_errors) errorMsg += errorData.non_field_errors.join(', ');
          if (Object.keys(errorData).length === 0 || (Object.keys(errorData).length === 1 && errorData.detail)) {
             errorMsg = errorData.detail || 'Unknown error.'; // Handle cases where only a detail message is sent
          }
          errorMessage.value = errorMsg.trim();
          console.error('Registration failed:', errorData);
        }
      } catch (error) {
        errorMessage.value = 'An error occurred during registration.';
        console.error('Registration error:', error);
      }
    };

    return {
      username,
      password,
      password2,
      handleLogin,
      handleRegister,
      errorMessage,
      isRegisterMode,
      toggleMode,
    };
  },
});
</script>
