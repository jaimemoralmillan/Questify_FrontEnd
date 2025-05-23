<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title class="header-title">
          Questify
        </ion-title>
        <ion-buttons slot="end">
          <ion-button @click="goToProfile" class="profile-button">
            <ion-icon slot="start" :icon="personCircleOutline"></ion-icon>
            Profile
          </ion-button>
          <ion-button @click="goToRewards" class="rewards-button"> <!-- Nuevo Botón -->
            <ion-icon slot="start" :icon="starOutline"></ion-icon> <!-- Icono de ejemplo -->
            Rewards
          </ion-button>
          <ion-button @click="handleLogout" class="logout-button">Logout</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding home-page-content">
      <div class="page-container">
        <div v-if="isLoading" class="spinner-container">
          <ion-spinner></ion-spinner>
        </div>

        <template v-if="!isLoading">
          <!-- User Profile Section -->
          <div v-if="userProfile" class="section-container profile-summary-container">
            <div class="profile-header">
              <img v-if="selectedAvatarUrl" :src="selectedAvatarUrl" alt="Selected Avatar" class="profile-avatar-main" />
              <div class="profile-info">
                <h2>Welcome, {{ userProfile.user?.username || 'User' }}!</h2>
                <p>Total XP: {{ userProfile.total_xp }}</p>
                <p v-if="userProfile.level !== undefined">Level: {{ userProfile.level }}</p>
              </div>
            </div>
            <div v-if="userProfile.level !== undefined && userProfile.xp_needed_for_level_up !== undefined && userProfile.xp_needed_for_level_up > 0" class="xp-section">
              <div class="xp-bar-container">
                <ion-progress-bar
                  class="pixel-xp-bar"
                  :value="animatedXpFraction">
                </ion-progress-bar>
              </div>
              <p class="xp-text">
                XP: {{ userProfile.xp_progress_in_current_level }} / {{ userProfile.xp_needed_for_level_up }}
              </p>
            </div>
          </div>
          
          <div v-if="errorMessage && !tasks.length && errorMessage !== 'You have no tasks yet.'" class="error-message-pixel">{{ errorMessage }}</div>

          <!-- Formulario para crear nueva tarea -->
          <h2>Create New Task</h2>
          <ion-button expand="block" @click="openCreateTaskModal" class="ion-margin-top">Create Task</ion-button>

          <h2 style="margin-top: 20px;">Your Tasks</h2>
          <ion-list v-if="tasks.length > 0">
            <ion-item v-for="task in tasks" :key="task.id" :class="{ 'task-completed': task.completed }" class="task-item-pixel" :data-difficulty="task.difficulty" lines="none">
              <ion-checkbox
                slot="start"
                :checked="task.completed"
                @ionChange="handleToggleCompleteTask(task, $event)"
                :disabled="!task.completed && typeof task.duration === 'number' && task.duration > 0 && typeof task.remainingTime === 'number' && task.remainingTime > 0"
                aria-label="Complete task"
              ></ion-checkbox>

              <ion-label @click="openEditModal(task)" class="task-label-clickable">
                <h2>{{ task.title }}</h2>
                <p v-if="task.description">{{ task.description }}</p>
                <p class="task-meta">
                  <span>XP: {{ task.xp_value }}</span> | <span>Dificultad: {{ task.difficulty }}</span>
                </p>
                <div v-if="task.duration && task.duration > 0" class="task-timer-info">
                  <p v-if="task.completed">
                    Duración: {{ task.duration }} min (Completada)
                  </p>
                  <p v-else-if="task.remainingTime !== undefined && task.remainingTime > 0">
                    <ion-icon :icon="timerOutline" aria-hidden="true"></ion-icon>
                    Tiempo restante: {{ formatTime(task.remainingTime) }}
                  </p>
                  <p v-else-if="task.remainingTime === 0">
                    <ion-icon :icon="checkmarkCircleOutline" aria-hidden="true" style="color: var(--ion-color-success);"></ion-icon>
                    ¡Temporizador finalizado! Lista para completar.
                  </p>
                  <p v-else>
                    Duración: {{ task.duration }} min
                  </p>
                </div>
                <div v-else-if="task.duration === undefined || task.duration === null || task.duration === 0" class="task-timer-info">
                   <p>Tarea sin duración específica.</p>
                </div>
              </ion-label>

              <div class="task-actions" slot="end">
                <ion-button fill="clear" @click="openEditModal(task)" class="edit-task-button" aria-label="Edit task">
                  <ion-icon slot="icon-only" :icon="pencilOutline" aria-hidden="true"></ion-icon>
                </ion-button>
                <ion-button fill="clear" @click="handleDeleteTask(task.id)" class="delete-task-button" aria-label="Delete task">
                  <ion-icon slot="icon-only" :icon="trashOutline" aria-hidden="true"></ion-icon>
                </ion-button>
              </div>
            </ion-item>
          </ion-list>
          <p v-if="!tasks.length && !errorMessage" class="info-message">
            No tasks found. Create some!
          </p>
          <p v-if="!tasks.length && errorMessage && errorMessage !== 'You have no tasks yet.'" class="error-message-pixel">
            {{ errorMessage }}
          </p>
      </template>
        
        <!-- Edit Task Modal -->
        <ion-modal :is-open="isEditModalOpen" @didDismiss="isEditModalOpen = false">
          <ion-header>
            <ion-toolbar>
              <ion-title>Edit Task</ion-title>
              <ion-buttons slot="end">
                <ion-button @click="isEditModalOpen = false">Cancel</ion-button>
              </ion-buttons>
            </ion-toolbar>
          </ion-header>
          <ion-content class="ion-padding">
            <ion-item lines="none">
              <ion-label position="floating">Title</ion-label>
              <ion-input v-model="editTaskTitle" type="text"></ion-input>
            </ion-item>
            <ion-item lines="none">
              <ion-label position="floating">Description</ion-label>
              <ion-input v-model="editTaskDescription" type="text"></ion-input>
            </ion-item>
            <ion-button expand="block" @click="handleUpdateTask" class="ion-margin-top">Save Changes</ion-button>
            <div v-if="editTaskErrorMessage" class="error-message-pixel">{{ editTaskErrorMessage }}</div>
          </ion-content>
        </ion-modal>

        <!-- Create Task Modal - New Feature -->
        <ion-modal :is-open="isCreateTaskModalOpen" @didDismiss="isCreateTaskModalOpen = false">
          <ion-header>
            <ion-toolbar>
              <ion-title>Create New Task</ion-title>
              <ion-buttons slot="end">
                <ion-button @click="isCreateTaskModalOpen = false">Cancel</ion-button>
              </ion-buttons>
            </ion-toolbar>
          </ion-header>
          <ion-content class="ion-padding">
            <ion-item lines="none">
              <ion-label position="floating">Title</ion-label>
              <ion-input v-model="newTaskTitle" type="text" required></ion-input>
            </ion-item>
            <ion-item lines="none">
              <ion-label position="floating">Description (Optional)</ion-label>
              <ion-input v-model="newTaskDescription" type="text"></ion-input>
            </ion-item>
            <ion-item lines="none">
              <ion-label position="floating">Duration (minutes, optional)</ion-label>
              <ion-input v-model.number="newTaskDuration" type="number" min="0"></ion-input>
            </ion-item>
            <ion-item lines="none">
              <ion-label>Difficulty</ion-label>
              <ion-segment v-model="newTaskDifficulty" value="NORMAL">
                <ion-segment-button value="EASY">
                  <ion-label>Easy</ion-label>
                </ion-segment-button>
                <ion-segment-button value="NORMAL">
                  <ion-label>Normal</ion-label>
                </ion-segment-button>
                <ion-segment-button value="HARD">
                  <ion-label>Hard</ion-label>
                </ion-segment-button>
              </ion-segment>
            </ion-item>
            <ion-button expand="block" @click="handleCreateTaskInModal" class="ion-margin-top">Create Task</ion-button>
            <div v-if="createTaskModalErrorMessage" class="error-message-pixel">{{ createTaskModalErrorMessage }}</div>
          </ion-content>
        </ion-modal>
      </div>

      <!-- Create Task Modal -->
      <ion-modal :is-open="isCreateTaskModalOpen" @didDismiss="isCreateTaskModalOpen = false">
        <ion-header>
          <ion-toolbar>
            <ion-title>Create New Task</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="isCreateTaskModalOpen = false">Cancel</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <ion-item lines="none">
            <ion-label position="floating">Title</ion-label>
            <ion-input v-model="newTaskTitle" type="text" required></ion-input>
          </ion-item>
          <ion-item lines="none">
            <ion-label position="floating">Description (Optional)</ion-label>
            <ion-input v-model="newTaskDescription" type="text"></ion-input>
          </ion-item>
          <ion-item lines="none">
            <ion-label position="floating">Duration (minutes, optional)</ion-label>
            <ion-input v-model.number="newTaskDuration" type="number" min="0"></ion-input>
          </ion-item>
          <ion-item lines="none">
            <ion-label>Difficulty</ion-label>
            <ion-segment v-model="newTaskDifficulty" value="NORMAL">
              <ion-segment-button value="EASY">
                <ion-label>Easy</ion-label>
              </ion-segment-button>
              <ion-segment-button value="NORMAL">
                <ion-label>Normal</ion-label>
              </ion-segment-button>
              <ion-segment-button value="HARD">
                <ion-label>Hard</ion-label>
              </ion-segment-button>
            </ion-segment>
          </ion-item>
          <ion-button expand="block" @click="handleCreateTaskInModal" class="ion-margin-top">Create Task</ion-button>
          <div v-if="createTaskModalErrorMessage" class="error-message-pixel">{{ createTaskModalErrorMessage }}</div>
        </ion-content>
      </ion-modal>

    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonButton, IonButtons, IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonList, IonItem, IonLabel, IonInput, onIonViewDidEnter, onIonViewDidLeave, IonCheckbox, IonIcon, alertController, toastController, IonSpinner, IonModal, IonProgressBar, IonSegment, IonSegmentButton } from '@ionic/vue'; // Added onIonViewDidLeave, IonSegment, IonSegmentButton
import { useRouter } from 'vue-router';
import { ref, computed, watch } from 'vue'; // Added watch
import { trashOutline, pencilOutline, personCircleOutline, starOutline, timerOutline, checkmarkCircleOutline } from 'ionicons/icons'; // Added timerOutline, checkmarkCircleOutline
import { useTheme } from '@/composables/useTheme';
import { useAvatar } from '@/composables/useAvatar'; // Import useAvatar

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

interface Task {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  xp_value: number;
  duration?: number; // Already added
  difficulty?: 'EASY' | 'NORMAL' | 'HARD'; // Already added
  remainingTime?: number; // Tiempo restante en segundos
  timerId?: any; // Para almacenar el ID del intervalo del temporizador
}

interface User {
  id: number;
  username: string;
}

// --- Interface para Logros (debe ser consistente con ProfilePage.vue) ---
interface Achievement { // Asegúrate que esta interfaz existe y es correcta
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
  selected_theme_id?: string | null; // Add this line
  selected_avatar_id?: string | null; // Línea añadida
  unlocked_achievements?: Achievement[]; // Mantener opcional o asegurar que siempre se envíe desde el backend
}

const router = useRouter();
const tasks = ref<Task[]>([]);
const userProfile = ref<UserProfile | null>(null); // Re-added userProfile ref
const errorMessage = ref('');
const isLoading = ref(false);

// Refs para el formulario de nueva tarea (now for modal)
const newTaskTitle = ref('');
const newTaskDescription = ref('');
const newTaskDuration = ref<number | null>(null); // Already added
const newTaskDifficulty = ref<'EASY' | 'NORMAL' | 'HARD'>('NORMAL'); // Already added
const isCreateTaskModalOpen = ref(false); // Already added
const createTaskModalErrorMessage = ref(''); // New ref for modal errors

// Refs para el modal de edición de tarea
const isEditModalOpen = ref(false);
const editingTask = ref<Task | null>(null);
const editTaskTitle = ref('');
const editTaskDescription = ref('');
const editTaskErrorMessage = ref('');

const animatedXpFraction = ref(0);

const targetXpFraction = computed(() => {
  if (userProfile.value && userProfile.value.xp_needed_for_level_up !== undefined && userProfile.value.xp_needed_for_level_up > 0) {
    return userProfile.value.xp_progress_in_current_level / userProfile.value.xp_needed_for_level_up;
  }
  return 0;
});

watch(targetXpFraction, (newFraction, oldFraction) => {
  // console.log(`[XP Watcher] Triggered. Target: ${newFraction}, Current Animated: ${animatedXpFraction.value}, Old Target: ${oldFraction}`);

  if (newFraction === animatedXpFraction.value) {
    // console.log("[XP Watcher] New target is the same as current animated value. No animation needed.");
    return;
  }

  if (oldFraction === undefined) {
    // console.log("[XP Watcher] oldFraction is undefined. This might be initial setup. Ensuring animatedXpFraction matches newFraction if they differ.");
    if (animatedXpFraction.value !== newFraction) {
        animatedXpFraction.value = newFraction;
    }
    return;
  }
  
  // console.log("[XP Watcher] Proceeding with animation.");
  const startFraction = animatedXpFraction.value; 
  const duration = 100; 
  let startTime: number | null = null;
  // let frameCount = 0; // No longer needed

  const animate = (currentTime: number) => {
    if (startTime === null) {
      startTime = currentTime;
      // console.log(`[XP Animation] Start. From: ${startFraction}, To: ${newFraction}, Duration: ${duration}ms`);
    }
    const elapsedTime = currentTime - startTime;
    const animationProgress = Math.min(elapsedTime / duration, 1);
    
    animatedXpFraction.value = startFraction + (newFraction - startFraction) * animationProgress;
    // frameCount++; // No longer needed
    // console.log(`[XP Animation] Frame: ${frameCount}, Elapsed: ${elapsedTime.toFixed(0)}ms, Progress: ${animationProgress.toFixed(2)}, CurrentValue: ${animatedXpFraction.value.toFixed(2)}`);

    if (animationProgress < 1) {
      requestAnimationFrame(animate);
    } else {
      animatedXpFraction.value = newFraction; 
      // console.log(`[XP Animation] Finished. Frames: ${frameCount}, FinalValue: ${animatedXpFraction.value.toFixed(2)}`);
    }
  };
  requestAnimationFrame(animate);
});

const { loadThemeFromStorage, resetThemeToDefaultAndClearStorage } = useTheme();
const { selectedAvatar, loadSelectedAvatarFromStorage, resetAvatarToDefaultAndClearStorage } = useAvatar(); // Destructure avatar functions

const selectedAvatarUrl = computed(() => selectedAvatar.value?.imageUrl || null);

const fetchUserProfile = async (isBackgroundRefresh = false) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    router.push('/login');
    return;
  }
  if (!isBackgroundRefresh) {
    isLoading.value = true;
  }
  try {
    const response = await fetch(`${API_BASE_URL}/api/profile/`, {
      headers: { 'Authorization': `Token ${token}` },
    });
    if (response.ok) {
      const data = await response.json();
      if (data && data.length > 0) {
        userProfile.value = data[0];
        localStorage.setItem('userProfile', JSON.stringify(data[0])); 
        if (data[0].user && data[0].user.id) {
          localStorage.setItem('userId', data[0].user.id.toString());
        }

        // Only set animatedXpFraction directly on initial load (not background refresh)
        if (!isBackgroundRefresh) {
          if (userProfile.value && userProfile.value.xp_needed_for_level_up !== undefined && userProfile.value.xp_needed_for_level_up > 0) {
            animatedXpFraction.value = userProfile.value.xp_progress_in_current_level / userProfile.value.xp_needed_for_level_up;
          } else {
            animatedXpFraction.value = 0;
          }
          // console.log(`[FetchUserProfile] Initial load. Set animatedXpFraction to: ${animatedXpFraction.value}`);
        } else {
          // console.log(`[FetchUserProfile] Background refresh. userProfile updated. Watcher will handle animation from current animated value: ${animatedXpFraction.value} to new target.`);
        }

        loadThemeFromStorage(); 
        loadSelectedAvatarFromStorage();
      } else {
        console.warn('User profile not found.');
        errorMessage.value = 'User profile not found.';
        localStorage.removeItem('userProfile'); // Clear stale profile
        localStorage.removeItem('userId');
      }
    } else {
      console.error('Failed to load user profile:', response.statusText);
      errorMessage.value = 'Failed to load user profile.';
      localStorage.removeItem('userProfile'); // Clear stale profile
      localStorage.removeItem('userId');
    }
  } catch (error) {
    console.error('Fetch user profile error:', error);
    errorMessage.value = 'Error fetching user profile.';
    localStorage.removeItem('userProfile'); // Clear stale profile
    localStorage.removeItem('userId');
  } finally {
    if (!isBackgroundRefresh) {
      isLoading.value = false;
    }
  }
};

const showToast = async (message: string, color: string, duration: number = 2000) => {
  const toast = await toastController.create({
    message: message,
    duration: duration,
    color: color,
    position: 'top'
  });
  toast.present();
};

const handleLogout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userProfile');
  localStorage.removeItem('userId'); // Clear direct userId on logout
  resetThemeToDefaultAndClearStorage();
  resetAvatarToDefaultAndClearStorage(); // Reset avatar on logout
  router.push('/login');
};

const goToProfile = () => {
  router.push('/profile');
};

const goToRewards = () => { // Nueva función
  router.push('/rewards');
};

const formatTime = (totalSeconds: number): string => {
  if (totalSeconds < 0) totalSeconds = 0;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const startOrUpdateTaskTimer = (task: Task) => {
  if (task.timerId) {
    clearInterval(task.timerId);
    task.timerId = null;
  }

  if (task.duration && task.duration > 0 && !task.completed) {
    let timeToUse: number;

    if (task.remainingTime === undefined) { // Si no hay tiempo restante previo (ej. tarea nueva)
      timeToUse = task.duration * 60;    // Inicializar desde la duración
    } else {
      timeToUse = task.remainingTime;      // Usar el tiempo restante existente (puede ser >0 o 0)
    }
    if (timeToUse < 0) timeToUse = 0; // Corregir si es negativo por alguna razón
    
    task.remainingTime = timeToUse; // Actualizar la tarea con el tiempo que se usará.

    if (task.remainingTime > 0) { 
      task.timerId = setInterval(() => {
        if (task.remainingTime !== undefined && task.remainingTime > 0) {
          task.remainingTime -= 1;
        }
        if (task.remainingTime !== undefined && task.remainingTime <= 0) {
          task.remainingTime = 0; // Asegurar que no sea negativo
          if (task.timerId) {
            clearInterval(task.timerId);
            task.timerId = null;
          }
          showToast(`¡Temporizador para '${task.title}' finalizado!`, 'medium');
        }
      }, 1000);
    } else {
      // Si el tiempo a usar es 0 o menos, nos aseguramos que remainingTime sea 0 y no haya temporizador.
      task.remainingTime = 0; 
      // El timerId ya se limpió al inicio de la función, así que no es necesario limpiarlo de nuevo aquí.
    }
  } else {
    // Si la tarea no debe tener un temporizador (sin duración, completada, etc.)
    // asegurar que remainingTime sea undefined y el timerId esté limpio.
    task.remainingTime = undefined; 
    // El timerId ya se limpió al inicio de la función.
  }
};

const clearAllTaskTimers = () => {
  tasks.value.forEach(task => {
    if (task.timerId) {
      clearInterval(task.timerId);
      task.timerId = null;
    }
  });
};

const initializeAllTaskTimers = () => {
  tasks.value.forEach(task => {
    startOrUpdateTaskTimer(task); 
  });
};

const fetchTasks = async () => {
  errorMessage.value = '';
  const token = localStorage.getItem('authToken');

  if (!token) {
    errorMessage.value = 'Authentication token not found. Please login again.';
    tasks.value = []; 
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/tasks/`, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const dataFromServer = await response.json();
      
      // 1. Crear un mapa del estado actual de los temporizadores (remainingTime) de las tareas en el cliente
      const clientTaskStates = new Map<number, { remainingTime: number }>();
      tasks.value.forEach(clientTask => {
        // Guardar remainingTime si es una tarea con duración, no completada, y tenía un tiempo restante válido (incluido 0).
        if (
          clientTask.id &&
          clientTask.duration && clientTask.duration > 0 &&
          !clientTask.completed &&
          clientTask.remainingTime !== undefined && clientTask.remainingTime >= 0 // Cambiado a >= 0
        ) {
          clientTaskStates.set(clientTask.id, { remainingTime: clientTask.remainingTime });
        }
      });

      // 2. Limpiar todos los temporizadores actuales (visuales/de intervalo)
      clearAllTaskTimers(); 

      // 3. Mapear los datos del servidor a la estructura de tareas del cliente
      tasks.value = dataFromServer.map((serverTaskData: Task) => { // Asumir que serverTaskData ya tiene la estructura de Task
        let currentRemainingTime: number | undefined = undefined;
        const clientState = clientTaskStates.get(serverTaskData.id);

        // Si la tarea del servidor no está completada, tiene duración,
        // y teníamos un estado de cliente válido para ella (temporizador activo con tiempo restante),
        // usamos el remainingTime del cliente.
        if (!serverTaskData.completed && serverTaskData.duration && serverTaskData.duration > 0 && clientState) {
          currentRemainingTime = clientState.remainingTime;
        }
        // Si no, currentRemainingTime permanecerá undefined, y startOrUpdateTaskTimer 
        // lo calculará desde serverTaskData.duration si es necesario.

        return { 
          ...serverTaskData,
          remainingTime: currentRemainingTime, 
          timerId: null // Se establecerá por initializeAllTaskTimers
        };
      });
      
      // 4. (Re)Inicializar todos los temporizadores basados en el nuevo tasks.value
      initializeAllTaskTimers(); 

      if (tasks.value.length === 0 && !errorMessage.value) {
        errorMessage.value = 'You have no tasks yet.';
      }
    } else {
      const errorData = await response.json();
      errorMessage.value = 'Failed to load tasks: ' + (errorData.detail || response.statusText);
      tasks.value = []; 
      if (response.status === 401) { 
        router.push('/login'); 
      }
    }
  } catch (error) {
    errorMessage.value = 'An error occurred while fetching tasks.';
    tasks.value = []; 
    console.error('Fetch tasks error:', error); 
  }
};

const openCreateTaskModal = () => {
  // Clear previous values
  newTaskTitle.value = '';
  newTaskDescription.value = '';
  newTaskDuration.value = null;
  newTaskDifficulty.value = 'NORMAL';
  createTaskModalErrorMessage.value = '';
  isCreateTaskModalOpen.value = true;
};

const handleCreateTask = async () => {
  // This function is now repurposed to just open the modal.
  // The actual creation logic is in handleCreateTaskInModal.
  // Kept for now if any old part of the template still calls it, but should be replaced by openCreateTaskModal
  openCreateTaskModal();
};

const handleCreateTaskInModal = async () => {
  createTaskModalErrorMessage.value = '';
  const token = localStorage.getItem('authToken');

  if (!token) {
    createTaskModalErrorMessage.value = 'Authentication token not found. Please login again.';
    showToast('Authentication token not found. Please login again.', 'danger');
    return;
  }

  if (!newTaskTitle.value.trim()) {
    createTaskModalErrorMessage.value = 'Title is required.';
    showToast('Title is required.', 'warning');
    return;
  }

  if (newTaskDuration.value !== null && newTaskDuration.value < 0) {
    createTaskModalErrorMessage.value = 'Duration cannot be negative.';
    showToast('Duration cannot be negative.', 'warning');
    return;
  }

  // XP Calculation
  let baseXP = 0;
  switch (newTaskDifficulty.value) {
    case 'EASY':
      baseXP = 10;
      break;
    case 'NORMAL':
      baseXP = 20;
      break;
    case 'HARD':
      baseXP = 30;
      break;
  }
  const durationBonusXP = (newTaskDuration.value || 0) * 10;
  const calculatedXp = baseXP + durationBonusXP;

  const taskPayload: any = {
    title: newTaskTitle.value,
    description: newTaskDescription.value,
    difficulty: newTaskDifficulty.value,
    xp_value: calculatedXp,
    // completed: false, // El backend debería manejar esto por defecto
  };

  // Solo incluir 'duration' si es un número positivo.
  // Si es 0 o null, se omite, y el backend usará el default (null).
  if (newTaskDuration.value !== null && newTaskDuration.value > 0) {
    taskPayload.duration = newTaskDuration.value;
  }
  // Si newTaskDuration.value es 0 o null, no se añade 'duration' al payload.
  // El backend tiene null=True para el campo duration, por lo que debería usar null como default.

  try {
    const response = await fetch(`${API_BASE_URL}/api/tasks/`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(taskPayload),
    });

    if (response.ok) {
      isCreateTaskModalOpen.value = false;
      // Form fields are cleared by openCreateTaskModal when it's next opened,
      // or we can clear them here explicitly.
      newTaskTitle.value = '';
      newTaskDescription.value = '';
      newTaskDuration.value = null;
      newTaskDifficulty.value = 'NORMAL';
      
      await fetchTasks(); 
      if (errorMessage.value === 'You have no tasks yet.') {
        errorMessage.value = ''; 
      }
      showToast('Task created successfully!', 'success');
      await fetchUserProfile(true); // Refresh profile for potential XP changes if tasks grant XP on creation (though unlikely for this model)
    } else {
      const errorData = await response.json();
      let detailedError = 'Failed to create task.';
      if (errorData.title) detailedError += ` Title: ${errorData.title.join(', ')}`;
      if (errorData.description) detailedError += ` Description: ${errorData.description.join(', ')}`;
      if (errorData.duration) detailedError += ` Duration: ${errorData.duration.join(', ')}`;
      if (errorData.difficulty) detailedError += ` Difficulty: ${errorData.difficulty.join(', ')}`;
      if (errorData.xp_value) detailedError += ` XP Value: ${errorData.xp_value.join(', ')}`;
      if (errorData.detail) detailedError = errorData.detail;
      createTaskModalErrorMessage.value = detailedError;
      showToast(detailedError, 'danger', 3000);
      if (response.status === 401) {
        router.push('/login');
      }
    }
  } catch (error) {
    createTaskModalErrorMessage.value = 'An error occurred while creating the task.';
    showToast('An error occurred while creating the task.', 'danger');
    console.error('Create task error:', error);
  }
};

const handleToggleCompleteTask = async (task: Task, event?: CustomEvent) => {
  const checkbox = event?.target as HTMLIonCheckboxElement | undefined;

  // Prevenir completar si es una tarea cronometrada y el temporizador no ha terminado
  if (!task.completed && task.duration && task.duration > 0 && task.remainingTime && task.remainingTime > 0) {
    showToast(`La tarea "${task.title}" no se puede completar aún. El temporizador sigue activo.`, 'warning');
    if (checkbox) {
      // Forzar la reversión visual del checkbox si Ionic no lo hace automáticamente.
      // Esto es necesario porque el evento @ionChange se dispara después del cambio.
      checkbox.checked = false;
    }
    return;
  }

  const token = localStorage.getItem('authToken');
  if (!token) {
    errorMessage.value = 'Authentication token not found. Please login again.';
    showToast('Authentication token not found. Please login again.', 'danger');
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/tasks/${task.id}/`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        completed: !task.completed,
      }),
    });

    if (response.ok) {
      const responseData = await response.json();
      const updatedTaskFromServer = responseData.task as Task;
      
      const index = tasks.value.findIndex(t => t.id === updatedTaskFromServer.id);
      if (index !== -1) {
        // Fusionar el estado del servidor con el estado del cliente (conservando timerId, remainingTime si no vienen del servidor)
        // Es importante que updatedTaskFromServer tenga la estructura correcta de Task.
        tasks.value[index] = { 
          ...tasks.value[index], // Conservar propiedades del cliente como timerId, remainingTime
          ...updatedTaskFromServer // Sobrescribir con el estado del servidor
        };
        // Re-evaluar el estado del temporizador basado en el nuevo estado de 'completed'
        startOrUpdateTaskTimer(tasks.value[index]);
      }

      showToast(`Tarea '${updatedTaskFromServer.title}' ${updatedTaskFromServer.completed ? 'completada' : 'marcada como incompleta'}.`, 
                updatedTaskFromServer.completed ? 'success' : 'medium');

      // Refetch user profile to update XP and level in the background
      await fetchUserProfile(true);

      if (responseData.newly_unlocked_achievements && responseData.newly_unlocked_achievements.length > 0) {
        for (const ach of responseData.newly_unlocked_achievements) {
          let toastMessage = `Achievement Unlocked: ${ach.name}! (${ach.description})`;
          if (ach.xp_reward > 0) {
            toastMessage += ` +${ach.xp_reward} XP`;
          }
          showToast(toastMessage, 'tertiary', 5000); // Un color distintivo para logros
        }
      }
      
      fetchUserProfile(); // Actualizar el perfil del usuario (XP, nivel, etc.)

    } else {
      // Revertir el cambio optimista si falló
      // if (task.completed !== originalCompletedStatus) task.completed = originalCompletedStatus;
      const errorData = await response.json();
      errorMessage.value = `Failed to update task: ${errorData.detail || response.statusText}`;
      showToast(errorMessage.value, 'danger');
      if (response.status === 401) {
        router.push('/login');
      }
    }
  } catch (error) {
    // Revertir el cambio optimista si falló
    // if (task.completed !== originalCompletedStatus) task.completed = originalCompletedStatus;
    errorMessage.value = 'An error occurred while updating the task.';
    showToast(errorMessage.value, 'danger');
    console.error('Update task error:', error);
  }
};

const handleDeleteTask = async (taskId: number) => {
  // ... No change to isLoading here ...
  const alert = await alertController.create({
    header: 'Confirm Delete',
    message: 'Are you sure you want to delete this task?',
    buttons: [
      {
        text: 'Cancel',
        role: 'cancel',
      },
      {
        text: 'Delete',
        handler: async () => {
          const token = localStorage.getItem('authToken');
          if (!token) {
            showToast('Token de autenticación no encontrado.', 'danger');
            return;
          }
          try {
            const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}/`, {
              method: 'DELETE',
              headers: { 'Authorization': `Token ${token}` },
            });
            if (response.ok) {
              const taskIndex = tasks.value.findIndex(t => t.id === taskId);
              if (taskIndex !== -1) {
                const taskToDelete = tasks.value[taskIndex];
                if (taskToDelete.timerId) {
                  clearInterval(taskToDelete.timerId);
                }
                tasks.value.splice(taskIndex, 1);
              }
              showToast('Tarea eliminada correctamente.', 'success');
              if (tasks.value.length === 0) {
                errorMessage.value = 'You have no tasks yet.';
              }
            } else {
              const errorData = await response.json();
              showToast(`Error al eliminar la tarea: ${errorData.detail || response.statusText}`, 'danger');
            }
          } catch (error) {
            showToast('Ocurrió un error al eliminar la tarea.', 'danger');
            console.error('Delete task error:', error);
          }
        },
      },
    ],
  });
  await alert.present();
};

const openEditModal = (task: Task) => {
  editingTask.value = task;
  editTaskTitle.value = task.title;
  editTaskDescription.value = task.description;
  editTaskErrorMessage.value = '';
  isEditModalOpen.value = true;
};

// Make sure handleUpdateTask (if used for editing tasks and completing them via modal) also handles achievements
const handleUpdateTask = async () => {
  if (!editingTask.value) return;
  const token = localStorage.getItem('authToken');
  editTaskErrorMessage.value = '';

  if (!token) {
    editTaskErrorMessage.value = 'Authentication token not found.';
    showToast(editTaskErrorMessage.value, 'danger');
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/tasks/${editingTask.value.id}/`, {
      method: 'PUT', // O PATCH si solo envías campos modificados
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: editTaskTitle.value,
        description: editTaskDescription.value,
        completed: editingTask.value.completed // Asegúrate de enviar el estado de completado actual
        // Si el modal de edición permite cambiar 'completed', asegúrate que editingTask.value.completed se actualiza
      }),
    });

    if (response.ok) {
      const responseData = await response.json(); // { task: {...}, newly_unlocked_achievements: [...] }
      const index = tasks.value.findIndex(t => t.id === editingTask.value!.id);
      if (index !== -1) {
        tasks.value[index] = responseData.task;
      }
      isEditModalOpen.value = false;
      showToast('Task updated successfully!', 'success');
      
      // Manejar logros desbloqueados con toasts
      if (responseData.newly_unlocked_achievements && responseData.newly_unlocked_achievements.length > 0) {
        for (const ach of responseData.newly_unlocked_achievements) {
          let toastMessage = `Achievement Unlocked: ${ach.name}! (${ach.description})`;
          if (ach.xp_reward > 0) {
            toastMessage += ` +${ach.xp_reward} XP`;
          }
          showToast(toastMessage, 'tertiary', 5000);
        }
      }
      fetchUserProfile(); // Actualizar perfil
    } else {
      const errorData = await response.json();
      editTaskErrorMessage.value = `Failed to update task: ${errorData.detail || JSON.stringify(errorData)}`;
      showToast(editTaskErrorMessage.value, 'danger');
    }
  } catch (error) {
    editTaskErrorMessage.value = 'An error occurred while updating the task.';
    showToast(editTaskErrorMessage.value, 'danger');
    console.error('Update task error:', error);
  }
};


onIonViewDidEnter(async () => {
  // isLoading.value = true; // Ya se maneja en fetchUserProfile
  await fetchUserProfile(); // Asegura que el perfil esté cargado primero
  await fetchTasks(); // Cargará las tareas e inicializará/restaurará sus temporizadores
  // isLoading.value = false; // Ya se maneja en fetchUserProfile
});

onIonViewDidLeave(() => {
  // clearAllTaskTimers(); // Eliminado para que los temporizadores sigan en segundo plano
});

</script>

<style>
/* Targeting the progress bar part within ion-progress-bar */
.pixel-xp-bar::part(progress) {
  transition: transform 0.5s ease-in-out !important;
}
</style>

<style scoped>
/* Remove default padding from ion-content if page-container handles it */
.home-page-content {
  --padding-start: 0;
  --padding-end: 0;
  --padding-top: 10px; /* Add some top padding to the content itself */
  --padding-bottom: 10px; /* Add some bottom padding */

  /* Apply the pattern to ion-content's background through CSS variables */
  --background:
    linear-gradient(45deg, var(--pixel-border-dark) 25%, transparent 25%),
    linear-gradient(-45deg, var(--pixel-border-dark) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, var(--pixel-border-dark) 75%),
    linear-gradient(-45deg, transparent 75%, var(--pixel-border-dark) 75%) 0 0 / 16px 16px,
    var(--pixel-bg-dark); /* Base color for the page background */
  /* The background-size and background-position are now part of the --background shorthand */
  /* background-size: 16px 16px; */ /* This creates 8px x 8px squares of the pattern color */
  /* background-position: 0 0, 0 8px, 8px -8px, -8px 0px; */ /* Positions for the checkerboard effect */
}

.page-container {
  max-width: 700px; /* Max width for the main content area */
  margin: 0 auto; /* Center the container */
  padding: 0 15px; /* Horizontal padding for the container */
}

/* .profile-summary-container {
  background-color: var(--pixel-bg-medium);
  padding: 15px;
  margin-bottom: 20px;
  border: 3px solid var(--pixel-border-dark);
  box-shadow: 4px 4px 0px var(--pixel-border-dark);
  border-radius: 0; 
} */

.profile-header {
  display: flex;
  align-items: center; /* Align items vertically */
  margin-bottom: 15px; /* Space below header before XP bar */
}

.profile-avatar-main {
  width: 80px; /* Increased size */
  height: 80px; /* Increased size */
  border-radius: 8px; /* Slightly rounded corners for pixel art style */
  margin-right: 20px; /* Space between avatar and text info */
  border: 3px solid var(--pixel-border-dark);
  background-color: var(--pixel-bg-medium); /* Fallback bg */
  object-fit: cover; /* Ensure image covers the area */
}

.profile-info {
  display: flex;
  flex-direction: column;
}

.profile-info h2 {
  margin-bottom: 5px; /* Adjust as needed */
}

.profile-info p {
  margin-bottom: 3px; /* Adjust as needed */
}

.xp-section {
  width: 100%; /* Ensure XP bar takes full width available after avatar */
}

.header-title {
  display: flex;
  align-items: center;
  justify-content: center; /* Re-center title text now that avatar is removed */
}

/* Removed .header-avatar style as it's no longer in the header */

/* Create New Task Form Styling */
.create-task-form-wrapper {
  max-width: 450px; /* Narrower width for the form */
  margin-left: auto;
  margin-right: auto; /* Center the form container */
}

.create-task-form-wrapper ion-item {
  --background: var(--ion-color-light-tint, #ffffff); /* Input background */
  --padding-start: 10px;
  --inner-padding-end: 10px;
  --border-radius: 0;
  border: 2px solid var(--pixel-border-dark);
  margin-bottom: 15px;
}

.create-task-form-wrapper ion-label {
  color: var(--ion-color-medium-shade, #666);
  font-size: 0.9em;
}

.create-task-form-wrapper ion-input {
  --color: var(--ion-color-dark-contrast, #000); /* Text color inside input */
  font-size: 1em;
}

.create-task-form-wrapper ion-button {
  margin-top: 10px; /* Space above the button */
}

/* Tasks List Styling */
.tasks-list-wrapper ion-list {
  background-color: transparent; /* List itself shouldn't have a conflicting background */
  padding: 0;
}

.tasks-list-wrapper ion-item {
  --background: var(--ion-color-light-shade, #e9e9e9); /* Background for task items */
  --padding-start: 12px;
  --inner-padding-end: 12px;
  --border-radius: 0;
  border: 2px solid var(--pixel-border-dark);
  margin-bottom: 12px;
  box-shadow: 2px 2px 0px var(--pixel-border-dark); /* Subtle shadow for items */
}

.tasks-list-wrapper ion-item.task-completed {
  --background: var(--ion-color-medium-tint, #dcdcdc); /* Different bg for completed */
  /* opacity: 0.7; Replaced by text-decoration and label opacity */
}

.tasks-list-wrapper ion-checkbox {
  margin-right: 12px;
  --size: 22px;
  --border-color: var(--pixel-border-dark);
  --border-color-checked: var(--pixel-primary-shade);
  --checkmark-color: var(--pixel-text-light, #fff); /* Text light for checkmark */
  --background-checked: var(--pixel-primary);
  border-radius: 0; /* Ensure checkbox is square */
}
.tasks-list-wrapper ion-checkbox::part(container) { /* Target inner part for border radius */
  border-radius: 0;
}


.tasks-list-wrapper ion-label h3 {
  color: var(--ion-color-dark-contrast, #333);
  font-size: 1.1em;
  margin-bottom: 5px;
  font-weight: bold;
}

.tasks-list-wrapper ion-label p {
  color: var(--ion-color-medium-shade, #555);
  font-size: 0.9em;
  white-space: normal; /* Allow description to wrap */
}

/* Ensure action buttons in task items use pixel style */
.tasks-list-wrapper ion-item ion-button {
  --border-radius: 0;
  min-width: 44px; /* Ensure decent tap target size */
  height: 44px;
  margin-left: 5px;
}
.tasks-list-wrapper ion-item ion-button ion-icon {
  font-size: 22px; /* Adjust icon size if needed */
}


/* Error and Info Messages */
.error-message {
  color: var(--ion-color-danger-shade, #b91c1c); /* Fallback color */
  background-color: var(--ion-color-danger-tint, #fde8e8); /* Fallback color */
  border: 2px solid var(--ion-color-danger-shade, #b91c1c);
  padding: 10px;
  margin-top: 10px;
  margin-bottom: 15px;
  text-align: center;
  font-size: 0.9em;
  border-radius: 0;
}

.error-message-pixel {
  color: var(--pixel-danger);
  background-color: rgba(200, 75, 43, 0.1); /* Subtle background using --pixel-danger base */
  border: 1px dashed var(--pixel-danger);
  padding: 8px;
  margin-top: 10px;
  margin-bottom: 10px;
  font-size: 0.9em;
  text-align: center;
  /* box-shadow: 1px 1px 0px var(--pixel-border-dark); /* Optional: subtle shadow */
}

.info-message {
  color: var(--ion-color-medium-shade, #666);
  text-align: center;
  margin-top: 15px;
  font-size: 1em;
}


/* Existing styles - ensure they don't conflict or merge if necessary */
#container {
  text-align: center;
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
}

#container strong {
  font-size: 20px;
  line-height: 26px;
}

#container p {
  font-size: 16px;
  line-height: 22px;
  color: #8c8c8c;
  margin: 0;
}

#container a {
  text-decoration: none;
}

.task-completed ion-label { /* This applies to the label inside a completed task item */
  opacity: 0.6;
}

.task-completed h3,
.task-completed p { /* These specific styles for text decoration remain useful */
  text-decoration: line-through;
  /* color: var(--ion-color-medium-shade); /* Color is now handled by the label opacity and general text color */
}

.spinner-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px; /* Give spinner some space */
}

.profile-button {
  --padding-start: 10px;
  --padding-end: 10px;
  --min-height: 40px;
  margin-right: 8px;
  border: 2px solid var(--pixel-border-dark);
  background-color: var(--pixel-primary); /* Fondo Azul restaurado */
  --color: var(--pixel-text-light);      /* Color para el icono y el texto */
  border-radius: 0;
  font-size: 0.9em; /* Ajustar tamaño de fuente si es necesario */
  text-transform: uppercase; /* Added for consistency */
  box-shadow: 2px 2px 0 var(--pixel-border-dark); /* Added for pixel 3D effect */
  transition: background-color 0.1s ease, box-shadow 0.1s ease, transform 0.1s ease; /* Added for active state */
}

.profile-button ion-icon {
  font-size: 20px;
  margin-right: 6px;
}

.profile-button:active {
  background-color: var(--pixel-primary-shade);
  box-shadow: 1px 1px 0 var(--pixel-border-dark); /* Added */
  transform: translate(1px, 1px); /* Added */
}

/* Estilos para el nuevo botón de Recompensas */
.rewards-button {
  --padding-start: 10px;
  --padding-end: 10px;
  --min-height: 40px;
  margin-right: 8px; /* Espacio similar al botón de perfil */
  border: 2px solid var(--pixel-border-dark);
  background-color: var(--pixel-primary); /* Matched profile button's blue */
  --color: var(--pixel-text-light);      /* Matched profile button's text/icon color */
  border-radius: 0;
  font-size: 0.9em;
  text-transform: uppercase;
  box-shadow: 2px 2px 0 var(--pixel-border-dark);
  transition: background-color 0.1s ease, box-shadow 0.1s ease, transform 0.1s ease;
}

.rewards-button ion-icon {
  font-size: 20px;
  margin-right: 6px;
}

.rewards-button:active {
  background-color: var(--pixel-primary-shade); /* Matched profile button's active state */
  box-shadow: 1px 1px 0 var(--pixel-border-dark);
  transform: translate(1px, 1px);
}

.logout-button {
  --padding-start: 10px;
  --padding-end: 10px;
  --min-height: 40px;
  /* margin-right: 5px; /* Removed */
  border: 2px solid var(--pixel-border-dark);
  background-color: var(--pixel-primary); /* Matched profile button's blue */
  --color: var(--pixel-text-light);
  border-radius: 0;
  font-size: 0.9em; /* Matched profile button's font size */
  text-transform: uppercase;
  box-shadow: 2px 2px 0 var(--pixel-border-dark);
  transition: background-color 0.1s ease, box-shadow 0.1s ease, transform 0.1s ease;
}

.logout-button:active {
  background-color: var(--pixel-primary-shade); /* Matched profile button's active state */
  box-shadow: 1px 1px 0 var(--pixel-border-dark);
  transform: translate(1px, 1px);
}

.xp-section {
  margin-top: 15px;
}

/* Estilos para la barra de XP y texto ya están en variables.css */
/* .xp-bar-container, .pixel-xp-bar, .xp-text */

.header-title {
  display: flex;
  align-items: center;
  justify-content: center; /* Center title content */
}

.header-avatar {
  width: 30px; /* Adjust size as needed */
  height: 30px; /* Adjust size as needed */
  border-radius: 50%; /* Optional: if you want circular avatars in header */
  margin-right: 10px;
  border: 1px solid var(--pixel-border-light); /* Optional border */
}

/* Task Item Styling */
.task-item-pixel {
  border-radius: 12px;
  box-shadow: 0 5px 12px rgba(0, 0, 0, 0.08); /* Softer shadow */
  margin-bottom: 16px;
  padding: 12px 16px;
  background: var(--ion-item-background, var(--ion-background-color, #ffffff));
  transition: all 0.25s ease-in-out;
  border-left: 5px solid transparent; /* Accent border */
  position: relative; /* For potential pseudo-elements if needed */
}

.task-item-pixel:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.12);
}

/* Accent border based on difficulty */
.task-item-pixel[data-difficulty="EASY"] {
  border-left-color: var(--ion-color-success-tint, #a2d8a2);
}
.task-item-pixel[data-difficulty="NORMAL"] {
  border-left-color: var(--ion-color-warning-tint, #ffdDAA);
}
.task-item-pixel[data-difficulty="HARD"] {
  border-left-color: var(--ion-color-danger-tint, #fba3a3);
}

.task-item-pixel.task-completed {
  opacity: 0.65;
  background: var(--ion-color-light-tint, #f8f8f8);
  border-left-color: var(--ion-color-medium-shade, #cccccc);
  box-shadow: 0 2px 5px rgba(0,0,0,0.05);
}

.task-item-pixel.task-completed:hover {
  transform: translateY(0); /* No lift for completed tasks on hover */
  box-shadow: 0 2px 5px rgba(0,0,0,0.05);
}

.task-item-pixel.task-completed ion-label h2,
.task-item-pixel.task-completed ion-label p {
  text-decoration: line-through;
  color: var(--ion-color-medium-shade, #888888);
}

.task-label-clickable {
  cursor: pointer;
  flex: 1; /* Allow label to take available space */
  min-width: 0; /* Prevent overflow issues with flex children */
}

.task-item-pixel ion-label h2 {
  font-size: 1.15em;
  font-weight: 600;
  margin-top: 0;
  margin-bottom: 6px;
  color: var(--ion-text-color, #222222);
  white-space: normal; /* Allow title to wrap */
}

.task-item-pixel ion-label p {
  font-size: 0.9em;
  color: var(--ion-color-medium-shade, #555555);
  margin-bottom: 4px;
  white-space: normal; /* Allow description to wrap */
}

.task-item-pixel ion-label p.task-meta {
  font-style: italic;
  font-size: 0.8em;
  margin-top: 8px;
}
.task-item-pixel ion-label p.task-meta span {
  margin-right: 10px;
}
.task-item-pixel ion-label p.task-meta span:last-child {
  margin-right: 0;
}

.task-timer-info {
  margin-top: 8px;
}
.task-timer-info p {
  font-size: 0.85em;
  display: flex;
  align-items: center;
  color: var(--ion-color-dark-tint);
}
.task-timer-info ion-icon {
  margin-right: 6px;
  font-size: 1.2em; /* Make timer icons a bit more prominent */
}

.task-actions {
  display: flex;
  align-items: center;
  margin-left: 8px; /* Space between label and actions */
}

.task-item-pixel .delete-task-button ion-icon,
.task-item-pixel .edit-task-button ion-icon {
  font-size: 1.5em; /* Make icons a bit larger */
}

.task-item-pixel .delete-task-button ion-icon {
  color: var(--ion-color-medium-shade, #888888); /* Neutral color for delete icon */
  transition: color 0.2s ease-in-out;
}
.task-item-pixel .delete-task-button:hover ion-icon {
  color: var(--ion-color-danger, #eb445a); /* Danger color on hover */
}

.task-item-pixel .edit-task-button ion-icon {
  color: var(--ion-color-medium-shade, #888888); /* Neutral color for edit icon */
  transition: color 0.2s ease-in-out; /* Restored transition */
}
.task-item-pixel .edit-task-button:hover ion-icon {
  color: #333333; /* Changed to a dark gray for high contrast testing */
}

.task-item-pixel ion-checkbox {
  margin-right: 16px; /* More space between checkbox and label */
  --size: 24px; /* Slightly larger checkbox */
  align-self: flex-start; /* Align checkbox to the top if label content wraps extensively */
  margin-top: 2px; /* Fine-tune vertical alignment */
}

/* Ensure buttons in item don't have excessive padding if fill="clear" */
.task-item-pixel ion-button[fill="clear"] {
  --padding-start: 6px;
  --padding-end: 6px;
  margin-inline-start: 0; /* Reset Ionic's default margin for buttons in items */
  margin-inline-end: 0;
  height: auto; /* Allow icon size to dictate height */
}

/* Spinner and messages */
.spinner-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

/* Modal styling improvements (optional, but good practice) */
ion-modal ion-toolbar {
  --background: var(--ion-color-primary);
  --color: var(--ion-color-primary-contrast);
}
ion-modal ion-title {
  padding-inline: 10px; /* Add some padding to modal titles */
}
ion-modal ion-content {
  --background: var(--ion-background-color-step-150, #f8f8f8); /* Slightly off-white for modal content */
}
ion-modal ion-item {
  --background: transparent; /* Make items in modal transparent if content has bg */
  --padding-start: 0; /* Remove default padding if custom padding is handled */
  --inner-padding-end: 0;
}
ion-modal ion-label[position="floating"] {
  color: var(--ion-color-medium-shade);
}

</style>
