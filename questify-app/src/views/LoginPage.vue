<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <!-- El título original, puedes mantenerlo o quitarlo si prefieres el título dentro del formulario -->
        <ion-title>{{ isRegisterMode ? 'Register' : 'Login' }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding login-page-content">
      <div class="form-container pixel-border-container">
        <h2 class="form-title">{{ isRegisterMode ? 'Register' : 'Login' }}</h2>

        <!-- Login Form -->
        <form v-if="!isRegisterMode" @submit.prevent="handleLogin" class="auth-form">
          <ion-item lines="none"> <!-- Remove default lines -->
            <ion-label position="floating">Username</ion-label>
            <ion-input v-model="username" type="text" required></ion-input>
          </ion-item>
          <ion-item lines="none"> <!-- Remove default lines -->
            <ion-label position="floating">Password</ion-label>
            <ion-input v-model="password" type="password" required></ion-input>
          </ion-item>
          <div class="button-wrapper">
            <ion-button type="submit" class="action-button">Login</ion-button>
          </div>
        </form>

        <!-- Register Form -->
        <form v-if="isRegisterMode" @submit.prevent="handleRegister" class="auth-form">
          <ion-item lines="none"> <!-- Remove default lines -->
            <ion-label position="floating">Username</ion-label>
            <ion-input v-model="username" type="text" required></ion-input>
          </ion-item>
          <ion-item lines="none"> <!-- Remove default lines -->
            <ion-label position="floating">Password</ion-label>
            <ion-input v-model="password" type="password" required></ion-input>
          </ion-item>
          <ion-item lines="none"> <!-- Remove default lines -->
            <ion-label position="floating">Confirm Password</ion-label>
            <ion-input v-model="password2" type="password" required></ion-input>
          </ion-item>
          <div class="button-wrapper">
            <ion-button type="submit" class="action-button">Register</ion-button>
          </div>
        </form>

        <div class="toggle-button-wrapper">
          <ion-button fill="clear" @click="toggleMode" class="toggle-button">
            {{ isRegisterMode ? 'Already have an account? Login' : "Don\'t have an account? Register" }}
          </ion-button>
        </div>
        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
      </div>
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
          headers:
           {
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

<style scoped>
.login-page-content {
  /* --background will be inherited from global styles in variables.css */
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%; /* Asegura que el contenedor ocupe todo el ancho */
}

.form-container {
  /* .pixel-border-container styles from variables.css will apply */
  width: 100%;
  max-width: 380px;
  /* padding is now in .pixel-border-container global class */
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-left: auto; /* Centra el contenedor del formulario */
  margin-right: auto; /* Centra el contenedor del formulario */
}

.form-title {
  /* color will be inherited from global styles */
  font-size: 1.7em;
  margin-bottom: 25px;
  text-align: center;
}

.auth-form {
  width: 100%;
}

/* ion-item styling is now primarily in variables.css */
/* We removed lines="none" in template, so default bottom border from variables.css will apply */

/* ion-label and ion-input styling is now primarily in variables.css */

.button-wrapper {
  width: 100%;
  display: flex;
  justify-content: center;
  margin-top: 25px; /* Increased margin a bit */
  margin-bottom: 15px; /* Added margin below button */
}

.action-button {
  /* Styles from variables.css will apply */
  min-width: 160px;
  font-size: 0.9em;
}

.toggle-button-wrapper {
  margin-top: 20px;
}

.toggle-button {
  color: var(--pixel-accent); /* Use palette accent color for better visibility */
  font-size: 0.85em;
  text-transform: none;
  --padding-start: 10px;
  --padding-end: 10px;
}

.toggle-button:hover {
  color: var(--pixel-accent);
}

.error-message {
  color: var(--pixel-danger); /* Use palette color */
  font-size: 0.85em;
  text-align: center;
  margin-top: 20px;
  min-height: 20px;
  width: 100%; /* Ensure it takes full width for centering */
}
</style>
