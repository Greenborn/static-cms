import axios from 'axios'

class ApiService {
  constructor() {
    this.api = axios.create({
      baseURL: '/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Interceptor para agregar token de autenticación
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('auth_token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    })

    // Interceptor para manejar errores de autenticación
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('auth_token')
          localStorage.removeItem('user')
          // Redirigir usando hash mode y respetando la base
          window.location.assign('/admin/#/login')
        }
        return Promise.reject(error)
      }
    )
  }

  // Autenticación
  async requestAccess(telegramId) {
    const response = await this.api.post('/auth/request-access', { telegram_id: telegramId })
    return response.data
  }

  async verifyAccess(code) {
    const response = await this.api.post('/auth/verify', { token: code })
    return response.data
  }

  async logout() {
    const response = await this.api.post('/auth/logout')
    return response.data
  }

  async getProfile() {
    const response = await this.api.get('/auth/profile')
    return response.data
  }

  // Páginas
  async getPages(page = 1, limit = 10, status) {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() })
    if (status) params.append('status', status)
    
    const response = await this.api.get(`/pages?${params}`)
    return response.data
  }

  async getPage(id) {
    const response = await this.api.get(`/pages/${id}`)
    return response.data
  }

  async createPage(data) {
    const response = await this.api.post('/pages', data)
    return response.data
  }

  async updatePage(id, data) {
    const response = await this.api.put(`/pages/${id}`, data)
    return response.data
  }

  async deletePage(id) {
    const response = await this.api.delete(`/pages/${id}`)
    return response.data
  }

  // Tipos de contenido
  async getContentTypes(page = 1, limit = 10, search, sortBy = 'name', sortOrder = 'ASC') {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sortBy,
      sortOrder
    })
    
    if (search) {
      params.append('search', search)
    }
    
    const response = await this.api.get(`/content-types?${params}`)
    return response.data
  }

  async getContentType(id) {
    const response = await this.api.get(`/content-types/${id}`)
    return response.data
  }

  async createContentType(data) {
    const response = await this.api.post('/content-types', data)
    return response.data
  }

  async updateContentType(id, data) {
    const response = await this.api.put(`/content-types/${id}`, data)
    return response.data
  }

  async deleteContentType(id) {
    const response = await this.api.delete(`/content-types/${id}`)
    return response.data
  }

  async getContentTypeFields(id) {
    const response = await this.api.get(`/content/types/${id}/fields`)
    return response.data
  }

  // Vistas
  async getViews() {
    const response = await this.api.get('/views')
    return response.data
  }

  async getView(id) {
    const response = await this.api.get(`/views/${id}`)
    return response.data
  }

  async createView(data) {
    const response = await this.api.post('/views', data)
    return response.data
  }

  async updateView(id, data) {
    const response = await this.api.put(`/views/${id}`, data)
    return response.data
  }

  async deleteView(id) {
    const response = await this.api.delete(`/views/${id}`)
    return response.data
  }

  // Multimedia
  async getMedia(page = 1, limit = 20) {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() })
    const response = await this.api.get(`/media?${params}`)
    return response.data
  }

  async uploadMedia(file) {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await this.api.post('/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  }

  async updateMedia(id, data) {
    const response = await this.api.put(`/media/${id}`, data)
    return response.data
  }

  async deleteMedia(id) {
    const response = await this.api.delete(`/media/${id}`)
    return response.data
  }

  // Multimedia (categorías y archivos)
  async getMediaCategories() {
    const response = await this.api.get('/media/categories')
    return response.data
  }
  async getMediaFiles(categoryId) {
    const response = await this.api.get('/media/files?category_id=' + categoryId)
    return response.data
  }
  async createMediaCategory(name) {
    const response = await this.api.post('/media/categories', { name })
    return response.data
  }
  async deleteMediaCategory(id) {
    const response = await this.api.delete('/media/categories/' + id)
    return response.data
  }
  async uploadMediaFile(file, categoryId) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('category_id', categoryId)
    const response = await this.api.post('/media/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    return response.data
  }

  // Formateadores
  async getFormatters() {
    const response = await this.api.get('/formatters')
    return response.data
  }

  async getFormatter(id) {
    const response = await this.api.get(`/formatters/${id}`)
    return response.data
  }

  async createFormatter(data) {
    const response = await this.api.post('/formatters', data)
    return response.data
  }

  async updateFormatter(id, data) {
    const response = await this.api.put(`/formatters/${id}`, data)
    return response.data
  }

  async deleteFormatter(id) {
    const response = await this.api.delete(`/formatters/${id}`)
    return response.data
  }

  // Constructor de sitio
  async getBuildStatus() {
    const response = await this.api.get('/site-builder/status')
    return response.data
  }

  async startBuild() {
    const response = await this.api.post('/site-builder/build')
    return response.data
  }

  async buildPage(pageId) {
    const response = await this.api.post(`/site-builder/build-page/${pageId}`)
    return response.data
  }

  async cleanBuild() {
    const response = await this.api.post('/site-builder/clean')
    return response.data
  }

  // Dashboard
  async getDashboardStats() {
    const response = await this.api.get('/dashboard/stats')
    return response.data
  }

  async cloneSite(url) {
    // Ahora usa el endpoint real protegido para admin
    const response = await this.api.post('/clone-site', { url })
    console.log('API Service - Respuesta completa:', response)
    console.log('API Service - response.data:', response.data)
    return response.data
  }

  async processCloneResource(data) {
    return await this.api.post('/clone-site/process-resource', data)
  }

  async getCloneStatus(processId) {
    return await this.api.get(`/clone-site/status/${processId}`)
  }

  // Contenido
  async getContent(page = 1, limit = 10, search, content_type_id, status, sortBy = 'created_at', sortOrder = 'DESC') {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sortBy,
      sortOrder
    })
    
    if (search) params.append('search', search)
    if (content_type_id) params.append('content_type_id', content_type_id.toString())
    if (status) params.append('status', status)
    
    const response = await this.api.get(`/content?${params}`)
    return response.data
  }

  async getContentById(id) {
    const response = await this.api.get(`/content/${id}`)
    return response.data
  }

  async createContent(data) {
    const response = await this.api.post('/content', data)
    return response.data
  }

  async updateContent(id, data) {
    const response = await this.api.put(`/content/${id}`, data)
    return response.data
  }

  async deleteContent(id) {
    const response = await this.api.delete(`/content/${id}`)
    return response.data
  }

  // Breakpoints
  async getBreakpoints() {
    const response = await this.api.get('/breakpoints');
    return response.data;
  }

  async updateBreakpoint(nombre, valor_px) {
    const response = await this.api.put(`/breakpoints/${nombre}`, { valor_px });
    return response.data;
  }

  // Configuración
  async getSettings() {
    const response = await this.api.get('/settings')
    return response.data
  }
  async updateSiteTitle(siteTitle) {
    const response = await this.api.put('/settings/site-title', { siteTitle })
    return response.data
  }
  async updateLang(lang) {
    const response = await this.api.put('/settings/lang', { lang })
    return response.data
  }

  async getMediaPreviewBlob(id) {
    const response = await this.api.get(`/media/preview/${id}`, { responseType: 'blob' })
    return response.data
  }
}

export default ApiService; 