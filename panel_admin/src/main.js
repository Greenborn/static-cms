import { createApp } from 'vue'
import App from './App.vue'
import router from './router.js'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './main.css'

// Importar Bootstrap JS
import 'bootstrap/dist/js/bootstrap.bundle.min.js'

const app = createApp(App)

app.use(router)

app.mount('#app') 