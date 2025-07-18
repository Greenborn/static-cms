import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from './stores/auth.js'

// Importar componentes
import Login from './pages/Login.vue'
import Layout from './components/Layout.vue'
import Dashboard from './pages/Dashboard.vue'
import Pages from './pages/Pages.vue'
import ContentTypes from './pages/ContentTypes.vue'
import Content from './pages/Content.vue'
import ContentCreate from './pages/ContentCreate.vue'
import ContentEdit from './pages/ContentEdit.vue'
import ContentView from './pages/ContentView.vue'
import Views from './pages/Views.vue'
import Media from './pages/Media.vue'
import Formatters from './pages/Formatters.vue'
import SiteBuilder from './pages/SiteBuilder.vue'
import Settings from './pages/Settings.vue'


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
        path: 'content',
        name: 'Content',
        component: Content
      },
      {
        path: 'content/create',
        name: 'ContentCreate',
        component: ContentCreate
      },
      {
        path: 'content/edit/:id',
        name: 'ContentEdit',
        component: ContentEdit
      },
      {
        path: 'content/view/:id',
        name: 'ContentView',
        component: ContentView
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