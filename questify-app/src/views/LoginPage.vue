<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Login</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <ion-item>
        <ion-label position="floating">Username</ion-label>
        <ion-input v-model="username" type="text"></ion-input>
      </ion-item>
      <ion-item>
        <ion-label position="floating">Password</ion-label>
        <ion-input v-model="password" type="password"></ion-input>
      </ion-item>
      <ion-button expand="block" @click="handleLogin" class="ion-margin-top">Login</ion-button>
      <p v-if="errorMessage" style="color: red;">{{ errorMessage }}</p>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, IonInput, IonButton } from '@ionic/vue';
import { useRouter } from 'vue-router';

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
    const errorMessage = ref('');

    const handleLogin = async () => {
      errorMessage.value = ''; // Clear previous errors
      try {
        const response = await fetch('http://localhost:8000/api-token-auth/', { // Asegúrate que esta URL es correcta para tu backend
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

    return {
      username,
      password,
      handleLogin,
      errorMessage,
    };
  },
});
</script>
