import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import MedVetLogin from '@/components/MedVetLogin.vue'
import DashboardView from '@/views/DashboardView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'login',
      component: MedVetLogin,
    },
    {
      path: '/cadastro',
      name: 'cadastro',
      component: () => import('@/views/CadastroView.vue'),
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
      meta: { requiresAuth: true },
    },
    {
      path: '/tutores',
      name: 'tutores',
      component: () => import('@/views/TutoresView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/pacientes',
      name: 'pacientes',
      component: () => import('@/views/PacientesView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/formularios',
      name: 'formularios',
      component: () => import('@/views/FormulariosView.vue'),
      meta: { requiresAuth: true },
    },
  ],
})

// Navigation guard para proteger rotas
router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/')
  } else if ((to.name === 'login' || to.name === 'cadastro') && authStore.isAuthenticated) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
