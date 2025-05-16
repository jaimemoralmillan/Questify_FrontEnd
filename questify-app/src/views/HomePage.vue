<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Home - Questify</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="goToProfile">
            <ion-icon slot="icon-only" :icon="personCircleOutline"></ion-icon>
          </ion-button>
          <ion-button @click="handleLogout">Logout</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div v-if="isLoading" class="spinner-container">
        <ion-spinner></ion-spinner>
      </div>

      <template v-if="!isLoading">
        <!-- User Profile Section -->
        <div v-if="userProfile" style="margin-bottom: 20px;">
          <h2>Welcome, {{ userProfile.user?.username || 'User' }}!</h2>
          <p>Total XP: {{ userProfile.total_xp }}</p>
          <p v-if="userProfile.level !== undefined">Level: {{ userProfile.level }}</p>
          <div v-if="userProfile.level !== undefined && userProfile.xp_needed_for_level_up !== undefined && userProfile.xp_needed_for_level_up > 0" style="margin-top: 10px;">
            <ion-progress-bar :value="userProfile.xp_progress_in_current_level / userProfile.xp_needed_for_level_up"></ion-progress-bar>
            <p style="font-size: 0.9em; margin-top: 5px;">
              XP: {{ userProfile.xp_progress_in_current_level }} / {{ userProfile.xp_needed_for_level_up }}
            </p>
          </div>
        </div>
        
        <div v-if="errorMessage && !tasks.length && errorMessage !== 'You have no tasks yet.'" style="color: red; margin-bottom: 10px;">{{ errorMessage }}</div>

        <!-- Formulario para crear nueva tarea -->
        <h2>Create New Task</h2>
        <ion-item>
          <ion-label position="floating">Title</ion-label>
          <ion-input v-model="newTaskTitle" type="text"></ion-input>
        </ion-item>
        <ion-item>
          <ion-label position="floating">Description (Optional)</ion-label>
          <ion-input v-model="newTaskDescription" type="text"></ion-input>
        </ion-item>
        <ion-button expand="block" @click="handleCreateTask" class="ion-margin-top">Create Task</ion-button>
        <div v-if="createTaskErrorMessage" style="color: red; margin-top: 10px;">{{ createTaskErrorMessage }}</div>

        <h2 style="margin-top: 20px;">Your Tasks</h2>
        <ion-list v-if="tasks.length > 0">
          <ion-item v-for="task in tasks" :key="task.id" :class="{ 'task-completed': task.completed }">
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
        <p v-if="!tasks.length && !errorMessage">
          No tasks found. Create some!
        </p>
         <p v-if="!tasks.length && errorMessage && errorMessage !== 'You have no tasks yet.'" style="color: red; margin-top: 10px;">
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
          <ion-item>
            <ion-label position="floating">Title</ion-label>
            <ion-input v-model="editTaskTitle" type="text"></ion-input>
          </ion-item>
          <ion-item>
            <ion-label position="floating">Description</ion-label>
            <ion-input v-model="editTaskDescription" type="text"></ion-input>
          </ion-item>
          <ion-button expand="block" @click="handleUpdateTask" class="ion-margin-top">Save Changes</ion-button>
          <div v-if="editTaskErrorMessage" style="color: red; margin-top: 10px;">{{ editTaskErrorMessage }}</div>
        </ion-content>
      </ion-modal>

    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonButton, IonButtons, IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonList, IonItem, IonLabel, IonInput, onIonViewDidEnter, IonCheckbox, IonIcon, alertController, toastController, IonSpinner, IonModal, IonProgressBar } from '@ionic/vue'; // Re-added IonProgressBar
import { useRouter } from 'vue-router';
import { ref } from 'vue';
import { trashOutline, pencilOutline, personCircleOutline } from 'ionicons/icons';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'; // Fallback for local dev

interface Task {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  xp_value: number;
}

// Re-added User and UserProfile interfaces
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

  const previousCompletedStatus = task.completed;

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
      await fetchTasks();
      await fetchUserProfile(); // Re-added call to fetchUserProfile
      showToast('Task status updated!', 'success');
      if (!previousCompletedStatus && task.completed) { 
        const completedTask = tasks.value.find(t => t.id === task.id);
        if(completedTask && completedTask.completed){
            showToast(`+${completedTask.xp_value} XP gained!`, 'success', 2500);
        }
      }
    } else {
      const errorData = await response.json();
      errorMessage.value = `Failed to update task: ${errorData.detail || response.statusText}`;
      showToast(`Failed to update task: ${errorData.detail || response.statusText}`, 'danger');
      if (response.status === 401) {
        router.push('/login');
      }
    }
  } catch (error) {
    errorMessage.value = 'An error occurred while updating the task.';
    showToast('An error occurred while updating the task.', 'danger');
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

const handleUpdateTask = async () => {
  if (!editingTask.value) return;
  editTaskErrorMessage.value = '';
  const token = localStorage.getItem('authToken');

  if (!token) {
    editTaskErrorMessage.value = 'Authentication token not found. Please login again.';
    showToast('Authentication token not found. Please login again.', 'danger');
    return;
  }

  if (!editTaskTitle.value.trim()) {
    editTaskErrorMessage.value = 'Title is required.';
    showToast('Title is required.', 'warning');
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/tasks/${editingTask.value.id}/`, {
      method: 'PUT',
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: editTaskTitle.value,
        description: editTaskDescription.value,
      }),
    });

    if (response.ok) {
      await fetchTasks(); // Recargar la lista de tareas
      showToast('Task updated successfully!', 'success');
      isEditModalOpen.value = false; // Cerrar el modal
      // Limpiar refs de edición
      editingTask.value = null;
      editTaskTitle.value = '';
      editTaskDescription.value = '';
      editTaskErrorMessage.value = '';
    } else {
      const errorData = await response.json();
      let detailedError = 'Failed to update task.';
      if (errorData.title) detailedError += ` Title: ${errorData.title.join(', ')}`;
      if (errorData.description) detailedError += ` Description: ${errorData.description.join(', ')}`;
      if (errorData.detail) detailedError = errorData.detail;
      editTaskErrorMessage.value = detailedError;
      showToast(detailedError, 'danger');
      if (response.status === 401) {
        isEditModalOpen.value = false; // Close modal on auth error
        router.push('/login');
      }
    }
  } catch (error) {
    editTaskErrorMessage.value = 'An error occurred while updating the task.';
    showToast('An error occurred while updating the task.', 'danger');
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

.task-completed ion-label {
  opacity: 0.6;
}

.task-completed h3,
.task-completed p {
  text-decoration: line-through;
}
.spinner-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 50vh; /* Adjust as needed */
}
</style>
