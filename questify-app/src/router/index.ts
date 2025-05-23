import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import HomePage from '../views/HomePage.vue'
import LoginPage from '../views/LoginPage.vue'; // Importar LoginPage

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/login' // Redirigir la raíz a login
  },
  {
    path: '/home',
    name: 'Home',
    component: HomePage,
    meta: { requiresAuth: true } // Añadir meta para rutas protegidas
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginPage
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/ProfilePage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/rewards', // Nueva ruta
    name: 'Rewards',
    component: () => import('@/views/RewardsPage.vue'),
    meta: { requiresAuth: true } // Añadir meta para rutas protegidas
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

// Guard de navegación
router.beforeEach((to, from, next) => {
  const loggedIn = localStorage.getItem('authToken');

  if (to.matched.some(record => record.meta.requiresAuth) && !loggedIn) {
    next('/login');
  } else {
    next();
  }
});

export default router
