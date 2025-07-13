// Tipos de autenticación
export interface User {
  id: number
  username: string
  telegram_id?: string
  role: 'admin' | 'editor'
  created_at: string
  updated_at: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

// Tipos de páginas
export interface Page {
  id: number
  title: string
  slug: string
  content: string
  meta_description?: string
  status: 'draft' | 'published' | 'archived'
  content_type_id?: number
  view_id?: number
  created_at: string
  updated_at: string
  published_at?: string
}

export interface PageFormData {
  title: string
  slug: string
  content: string
  meta_description?: string
  status: 'draft' | 'published' | 'archived'
  content_type_id?: number
  view_id?: number
}

// Tipos de contenido
export interface ContentType {
  id: number
  name: string
  description?: string
  fields: ContentField[]
  created_at: string
  updated_at: string
}

export interface ContentField {
  id: number
  name: string
  type: 'text' | 'textarea' | 'number' | 'boolean' | 'date' | 'select' | 'multiselect' | 'file' | 'image' | 'url' | 'email' | 'color' | 'json'
  label: string
  required: boolean
  default_value?: any
  options?: string[]
  validation_rules?: string
  order: number
}

export interface ContentTypeFormData {
  name: string
  description?: string
  fields: Omit<ContentField, 'id'>[]
}

// Tipos de vistas
export interface View {
  id: number
  name: string
  description?: string
  template: string
  content_type_id?: number
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface ViewFormData {
  name: string
  description?: string
  template: string
  content_type_id?: number
  is_default: boolean
}

// Tipos de multimedia
export interface MediaFile {
  id: number
  filename: string
  original_name: string
  mime_type: string
  size: number
  path: string
  url: string
  thumbnail_url?: string
  alt_text?: string
  caption?: string
  uploaded_by: number
  created_at: string
  updated_at: string
}

export interface MediaUploadResponse {
  file: MediaFile
  message: string
}

// Tipos de formateadores
export interface Formatter {
  id: number
  name: string
  description?: string
  type: 'markdown' | 'html' | 'custom'
  config: Record<string, any>
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface FormatterFormData {
  name: string
  description?: string
  type: 'markdown' | 'html' | 'custom'
  config: Record<string, any>
  is_active: boolean
}

// Tipos del constructor de sitio
export interface BuildStatus {
  is_building: boolean
  last_build?: string
  build_duration?: number
  total_pages?: number
  generated_pages?: number
  errors?: string[]
}

export interface BuildProgress {
  current_page: number
  total_pages: number
  current_page_name: string
  status: 'building' | 'completed' | 'error'
  errors: string[]
}

// Tipos de estadísticas
export interface DashboardStats {
  total_pages: number
  published_pages: number
  draft_pages: number
  total_content_types: number
  total_views: number
  total_media_files: number
  total_formatters: number
  last_build?: string
  build_duration?: number
}

// Tipos de API
export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  errors?: Record<string, string[]>
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    current_page: number
    per_page: number
    total: number
    total_pages: number
  }
}

// Tipos de formularios
export interface FormField {
  name: string
  label: string
  type: 'text' | 'textarea' | 'number' | 'boolean' | 'select' | 'multiselect' | 'file' | 'date' | 'email' | 'url' | 'color'
  required?: boolean
  placeholder?: string
  options?: { value: string; label: string }[]
  validation?: {
    min?: number
    max?: number
    pattern?: string
    message?: string
  }
}

// Tipos de navegación
export interface NavItem {
  label: string
  href: string
  icon: string
  badge?: number
  children?: NavItem[]
}

// Tipos de notificaciones
export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
} 