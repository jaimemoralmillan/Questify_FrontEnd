<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Home - Questify</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="goToProfile" class="profile-button">
            <ion-icon slot="start" :icon="personCircleOutline"></ion-icon>
            Profile
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
            <h2>Welcome, {{ userProfile.user?.username || 'User' }}!</h2>
            <p>Total XP: {{ userProfile.total_xp }}</p>
            <p v-if="userProfile.level !== undefined">Level: {{ userProfile.level }}</p>
            <div v-if="userProfile.level !== undefined && userProfile.xp_needed_for_level_up !== undefined && userProfile.xp_needed_for_level_up > 0" class="xp-section">
              <div class="xp-bar-container">
                <ion-progress-bar
                  class="pixel-xp-bar"
                  :value="userProfile.xp_progress_in_current_level / userProfile.xp_needed_for_level_up">
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
          <ion-item lines="none">
            <ion-label position="floating">Title</ion-label>
            <ion-input v-model="newTaskTitle" type="text"></ion-input>
          </ion-item>
          <ion-item lines="none">
            <ion-label position="floating">Description (Optional)</ion-label>
            <ion-input v-model="newTaskDescription" type="text"></ion-input>
          </ion-item>
          <ion-button expand="block" @click="handleCreateTask" class="ion-margin-top">Create Task</ion-button>
          <div v-if="createTaskErrorMessage" class="error-message-pixel">{{ createTaskErrorMessage }}</div>

          <h2 style="margin-top: 20px;">Your Tasks</h2>
          <ion-list v-if="tasks.length > 0">
            <ion-item v-for="task in tasks" :key="task.id" :class="{ 'task-completed': task.completed }" class="task-item-pixel" lines="none">
              <ion-checkbox slot="start" :checked="task.completed" @ionChange="handleToggleCompleteTask(task)"></ion-checkbox>
              <ion-label>
                <h3 :style="{ textDecoration: task.completed ? 'line-through' : 'none' }">{{ task.title }}</h3>
                <p :style="{ textDecoration: task.completed ? 'line-through' : 'none' }">{{ task.description }}</p>
                <p>XP: {{ task.xp_value }} | Completed: {{ task.completed ? 'Yes' : 'No' }}</p>
              </ion-label>
              <ion-button slot="end" color="primary" @click="openEditModal(task)">
                <ion-icon slot="icon-only" :icon="pencilOutline"></ion-icon>
              </ion-button>
              <ion-button slot="end" color="danger" @click="handleDeleteTask(task.id)">
                <ion-icon slot="icon-only" :icon="trashOutline"></ion-icon>
              </ion-button>
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
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonButton, IonButtons, IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonList, IonItem, IonLabel, IonInput, onIonViewDidEnter, IonCheckbox, IonIcon, alertController, toastController, IonSpinner, IonModal, IonProgressBar } from '@ionic/vue';
import { useRouter } from 'vue-router';
import { ref } from 'vue';
import { trashOutline, pencilOutline, personCircleOutline } from 'ionicons/icons';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

interface Task {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  xp_value: number;
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
  unlocked_achievements?: Achievement[]; // Mantener opcional o asegurar que siempre se envíe desde el backend
}

const router = useRouter();
const tasks = ref<Task[]>([]);
const userProfile = ref<UserProfile | null>(null); // Re-added userProfile ref
const errorMessage = ref('');
const isLoading = ref(false);

// Refs para el formulario de nueva tarea
const newTaskTitle = ref('');
const newTaskDescription = ref('');
const createTaskErrorMessage = ref('');

// Refs para el modal de edición de tarea
const isEditModalOpen = ref(false);
const editingTask = ref<Task | null>(null);
const editTaskTitle = ref('');
const editTaskDescription = ref('');
const editTaskErrorMessage = ref('');

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
  router.push('/login');
};

const goToProfile = () => {
  router.push('/profile');
};

// Re-added fetchUserProfile function
const fetchUserProfile = async () => {
  // Not setting isLoading here as it will be part of a Promise.all
  const token = localStorage.getItem('authToken');
  if (!token) {
    // Avoid setting global errorMessage here if tasks might still load
    // or if profile data is considered optional for the main page view.
    // router.push('/login'); // Optionally redirect if profile is critical and no token
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
        console.warn('User profile not found or empty response for HomePage.');
      }
    } else {
      console.error('Failed to load user profile for HomePage:', response.statusText);
      if (response.status === 401) {
        // Potentially redirect or show a global auth error
        // router.push('/login'); 
      }
    }
  } catch (error) {
    console.error('Fetch user profile error for HomePage:', error);
  }
};

const fetchTasks = async () => {
  // No need to set isLoading here if called within a broader loading context
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
      const data = await response.json();
      tasks.value = data;
      if (data.length === 0 && !errorMessage.value) { // Solo mostrar si no hay otro error
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

const handleCreateTask = async () => {
  // ... No change to isLoading here, as it's a specific action, not initial page load ...
  createTaskErrorMessage.value = '';
  const token = localStorage.getItem('authToken');

  if (!token) {
    createTaskErrorMessage.value = 'Authentication token not found. Please login again.';
    showToast('Authentication token not found. Please login again.', 'danger');
    return;
  }

  if (!newTaskTitle.value.trim()) {
    createTaskErrorMessage.value = 'Title is required.';
    showToast('Title is required.', 'warning');
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/tasks/`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: newTaskTitle.value,
        description: newTaskDescription.value, 
        // xp_value y completed usarán los defaults del backend
      }),
    });

    if (response.ok) {
      // Limpiar formulario
      newTaskTitle.value = '';
      newTaskDescription.value = '';
      // Recargar la lista de tareas para mostrar la nueva
      await fetchTasks(); 
      if (errorMessage.value === 'You have no tasks yet.') {
        errorMessage.value = ''; 
      }
      showToast('Task created successfully!', 'success');
    } else {
      const errorData = await response.json();
      let detailedError = 'Failed to create task.';
      if (errorData.title) detailedError += ` Title: ${errorData.title.join(', ')}`;
      if (errorData.description) detailedError += ` Description: ${errorData.description.join(', ')}`;
      if (errorData.detail) detailedError = errorData.detail;
      createTaskErrorMessage.value = detailedError;
      showToast(detailedError, 'danger');
      if (response.status === 401) {
        router.push('/login');
      }
    }
  } catch (error) {
    createTaskErrorMessage.value = 'An error occurred while creating the task.';
    showToast('An error occurred while creating the task.', 'danger');
    console.error('Create task error:', error);
  }
};

const handleToggleCompleteTask = async (task: Task) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    errorMessage.value = 'Authentication token not found. Please login again.';
    showToast('Authentication token not found. Please login again.', 'danger');
    return;
  }

  // Optimistic update (opcional, pero mejora la UX)
  // const originalCompletedStatus = task.completed;
  // task.completed = !task.completed;

  try {
    const response = await fetch(`${API_BASE_URL}/api/tasks/${task.id}/`, {
      method: 'PATCH', // O PUT si actualizas el objeto completo
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        completed: !task.completed, // Enviar el nuevo estado
      }),
    });

    if (response.ok) {
      const responseData = await response.json(); // Contiene { task: {...}, newly_unlocked_achievements: [...] }
      
      // Actualizar la tarea en la lista local con los datos del backend
      const index = tasks.value.findIndex(t => t.id === task.id);
      if (index !== -1) {
        tasks.value[index] = responseData.task;
      }

      showToast(`Task '${responseData.task.title}' ${responseData.task.completed ? 'completed' : 'marked as incomplete'}.`, 
                responseData.task.completed ? 'success' : 'medium');

      // Manejar logros desbloqueados con toasts (estado anterior al modal)
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
            errorMessage.value = 'Authentication token not found. Please login again.';
            showToast('Authentication token not found. Please login again.', 'danger');
            return;
          }

          try {
            const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}/`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Token ${token}`,
              },
            });

            if (response.ok) {
              await fetchTasks(); 
              if (tasks.value.length > 0 && errorMessage.value === 'You have no tasks yet.') {
                errorMessage.value = '';
              }
              showToast('Task deleted successfully!', 'success');
            } else {
              const errorData = await response.json();
              errorMessage.value = `Failed to delete task: ${errorData.detail || response.statusText}`;
              showToast(`Failed to delete task: ${errorData.detail || response.statusText}`, 'danger');
              if (response.status === 401) {
                router.push('/login');
              }
            }
          } catch (error) {
            errorMessage.value = 'An error occurred while deleting the task.';
            showToast('An error occurred while deleting the task.', 'danger');
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
  isLoading.value = true;
  errorMessage.value = ''; 
  createTaskErrorMessage.value = ''; 
  try {
    await Promise.all([
      fetchTasks(), 
      fetchUserProfile() // Re-added fetchUserProfile to Promise.all
    ]);
  } catch (error) {
    console.error("Error during initial data load:", error);
    errorMessage.value = "Failed to load page data."; // General error for combined loading
  } finally {
    isLoading.value = false;
  }
});

</script>

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

.section-container {
  background-color: var(--pixel-bg-medium); /* Usar el nuevo color de fondo medio */
  padding: 20px;
  margin-bottom: 25px;
  border: 3px solid var(--pixel-border-dark);
  box-shadow: 4px 4px 0px var(--pixel-border-dark); /* Pixel shadow effect */
  border-radius: 0; /* Ensure no rounded corners */
}

.section-container h2 {
  text-align: center;
  margin-top: 0;
  margin-bottom: 20px;
  color: var(--pixel-text-light); /* Asegurar que usa el color de texto claro */
  font-size: 1.5em; /* Ensure headings are prominent */
}

/* Profile Summary Specifics */
.profile-summary-container p {
  color: var(--pixel-text-light); /* Asegurar que usa el color de texto claro */
  text-align: center;
  margin-bottom: 8px;
  opacity: 0.9; /* Ligera opacidad para diferenciar del título si es necesario */
}
.xp-section {
  margin-top: 15px;
}

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
</style>
