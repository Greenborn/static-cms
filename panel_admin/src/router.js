import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from './stores/auth.js'

// Importar componentes
import Login from './pages/Login.vue'
import Layout from './components/Layout.vue'
import Dashboard from './pages/Dashboard.vue'
import Pages from './pages/Pages.vue'
import ContentTypes from './pages/ContentTypes.vue'
import Views from './pages/Views.vue'
import Media from './pages/Media.vue'
import Formatters from './pages/Formatters.vue'
import SiteBuilder from './pages/SiteBuilder.vue'
import Settings from './pages/Settings.vue'
import CloneSite from './pages/CloneSite.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: Layout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/dashboard'
      },
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: Dashboard
      },
      {
        path: 'pages',
        name: 'Pages',
        component: Pages
      },
      {
        path: 'content-types',
        name: 'ContentTypes',
        component: ContentTypes
      },
      {
        path: 'views',
        name: 'Views',
        component: Views
      },
      {
        path: 'media',
        name: 'Media',
        component: Media
      },
      {
        path: 'formatters',
        name: 'Formatters',
        component: Formatters
      },
      {
        path: 'site-builder',
        name: 'SiteBuilder',
        component: SiteBuilder
      },
      {
        path: 'settings',
        name: 'Settings',
        component: Settings
      },
      {
        path: 'clone-site',
        name: 'CloneSite',
        component: CloneSite
      }
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// Guardia de navegación
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated.value) {
    next('/login')
  } else if (to.path === '/login' && authStore.isAuthenticated.value) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router 