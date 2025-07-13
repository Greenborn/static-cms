import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { 
  User, 
  Page, 
  ContentType, 
  View, 
  MediaFile, 
  Formatter, 
  BuildStatus, 
  DashboardStats,
  ApiResponse,
  PaginatedResponse 
} from '../types'

class ApiService {
  private api: AxiosInstance

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
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }
    )
  }

  // Autenticación
  async requestAccess(telegramId: string): Promise<ApiResponse<{ message: string }>> {
    const response = await this.api.post('/auth/request-access', { telegram_id: telegramId })
    return response.data
  }

  async verifyAccess(code: string): Promise<ApiResponse<{ user: User; token: string }>> {
    const response = await this.api.post('/auth/verify-access', { code })
    return response.data
  }

  async logout(): Promise<ApiResponse<{ message: string }>> {
    const response = await this.api.post('/auth/logout')
    return response.data
  }

  async getProfile(): Promise<ApiResponse<User>> {
    const response = await this.api.get('/auth/profile')
    return response.data
  }

  // Páginas
  async getPages(page = 1, limit = 10, status?: string): Promise<PaginatedResponse<Page>> {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() })
    if (status) params.append('status', status)
    
    const response = await this.api.get(`/pages?${params}`)
    return response.data
  }

  async getPage(id: number): Promise<ApiResponse<Page>> {
    const response = await this.api.get(`/pages/${id}`)
    return response.data
  }

  async createPage(data: Partial<Page>): Promise<ApiResponse<Page>> {
    const response = await this.api.post('/pages', data)
    return response.data
  }

  async updatePage(id: number, data: Partial<Page>): Promise<ApiResponse<Page>> {
    const response = await this.api.put(`/pages/${id}`, data)
    return response.data
  }

  async deletePage(id: number): Promise<ApiResponse<{ message: string }>> {
    const response = await this.api.delete(`/pages/${id}`)
    return response.data
  }

  async updatePageStatus(id: number, status: string): Promise<ApiResponse<Page>> {
    const response = await this.api.patch(`/pages/${id}/status`, { status })
    return response.data
  }

  async getPageStats(): Promise<ApiResponse<{ total: number; published: number; draft: number; archived: number }>> {
    const response = await this.api.get('/pages/stats')
    return response.data
  }

  // Tipos de contenido
  async getContentTypes(): Promise<ApiResponse<ContentType[]>> {
    const response = await this.api.get('/content-types')
    return response.data
  }

  async getContentType(id: number): Promise<ApiResponse<ContentType>> {
    const response = await this.api.get(`/content-types/${id}`)
    return response.data
  }

  async createContentType(data: Partial<ContentType>): Promise<ApiResponse<ContentType>> {
    const response = await this.api.post('/content-types', data)
    return response.data
  }

  async updateContentType(id: number, data: Partial<ContentType>): Promise<ApiResponse<ContentType>> {
    const response = await this.api.put(`/content-types/${id}`, data)
    return response.data
  }

  async deleteContentType(id: number): Promise<ApiResponse<{ message: string }>> {
    const response = await this.api.delete(`/content-types/${id}`)
    return response.data
  }

  // Vistas
  async getViews(): Promise<ApiResponse<View[]>> {
    const response = await this.api.get('/views')
    return response.data
  }

  async getView(id: number): Promise<ApiResponse<View>> {
    const response = await this.api.get(`/views/${id}`)
    return response.data
  }

  async createView(data: Partial<View>): Promise<ApiResponse<View>> {
    const response = await this.api.post('/views', data)
    return response.data
  }

  async updateView(id: number, data: Partial<View>): Promise<ApiResponse<View>> {
    const response = await this.api.put(`/views/${id}`, data)
    return response.data
  }

  async deleteView(id: number): Promise<ApiResponse<{ message: string }>> {
    const response = await this.api.delete(`/views/${id}`)
    return response.data
  }

  async previewView(data: { template: string; content?: any }): Promise<ApiResponse<{ html: string }>> {
    const response = await this.api.post('/views/preview', data)
    return response.data
  }

  // Multimedia
  async getMedia(page = 1, limit = 20): Promise<PaginatedResponse<MediaFile>> {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() })
    const response = await this.api.get(`/media?${params}`)
    return response.data
  }

  async uploadMedia(file: File): Promise<ApiResponse<MediaFile>> {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await this.api.post('/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  }

  async updateMedia(id: number, data: Partial<MediaFile>): Promise<ApiResponse<MediaFile>> {
    const response = await this.api.put(`/media/${id}`, data)
    return response.data
  }

  async deleteMedia(id: number): Promise<ApiResponse<{ message: string }>> {
    const response = await this.api.delete(`/media/${id}`)
    return response.data
  }

  async getMediaStats(): Promise<ApiResponse<{ total: number; total_size: number; by_type: Record<string, number> }>> {
    const response = await this.api.get('/media/stats')
    return response.data
  }

  // Formateadores
  async getFormatters(): Promise<ApiResponse<Formatter[]>> {
    const response = await this.api.get('/formatters')
    return response.data
  }

  async getFormatter(id: number): Promise<ApiResponse<Formatter>> {
    const response = await this.api.get(`/formatters/${id}`)
    return response.data
  }

  async createFormatter(data: Partial<Formatter>): Promise<ApiResponse<Formatter>> {
    const response = await this.api.post('/formatters', data)
    return response.data
  }

  async updateFormatter(id: number, data: Partial<Formatter>): Promise<ApiResponse<Formatter>> {
    const response = await this.api.put(`/formatters/${id}`, data)
    return response.data
  }

  async deleteFormatter(id: number): Promise<ApiResponse<{ message: string }>> {
    const response = await this.api.delete(`/formatters/${id}`)
    return response.data
  }

  async testFormatter(id: number, content: string): Promise<ApiResponse<{ formatted_content: string }>> {
    const response = await this.api.post(`/formatters/${id}/test`, { content })
    return response.data
  }

  // Constructor de sitio
  async getBuildStatus(): Promise<ApiResponse<BuildStatus>> {
    const response = await this.api.get('/site-builder/status')
    return response.data
  }

  async startBuild(): Promise<ApiResponse<{ message: string }>> {
    const response = await this.api.post('/site-builder/build')
    return response.data
  }

  async buildPage(pageId: number): Promise<ApiResponse<{ message: string }>> {
    const response = await this.api.post(`/site-builder/build-page/${pageId}`)
    return response.data
  }

  async cleanBuild(): Promise<ApiResponse<{ message: string }>> {
    const response = await this.api.post('/site-builder/clean')
    return response.data
  }

  async getTemplates(): Promise<ApiResponse<string[]>> {
    const response = await this.api.get('/site-builder/templates')
    return response.data
  }

  async previewTemplate(template: string, data?: any): Promise<ApiResponse<{ html: string }>> {
    const response = await this.api.post('/site-builder/preview', { template, data })
    return response.data
  }

  async getBuildStats(): Promise<ApiResponse<{ total_builds: number; avg_duration: number; last_builds: any[] }>> {
    const response = await this.api.get('/site-builder/stats')
    return response.data
  }

  // Dashboard
  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    const response = await this.api.get('/dashboard/stats')
    return response.data
  }
}

export const apiService = new ApiService()
export default apiService 