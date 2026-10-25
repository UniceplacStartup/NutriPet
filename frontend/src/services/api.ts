// API base configuration
// Em produção, defina VITE_API_URL no momento do build
const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'

/* eslint-disable @typescript-eslint/no-explicit-any */

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean
}

// Helper para fazer requisições com tratamento de erros
async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { requiresAuth = false, ...fetchOptions } = options

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  // Se requer autenticação, adiciona o token
  if (requiresAuth) {
    const token = localStorage.getItem('medvet_token')
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
  }

  const url = `${API_BASE_URL}${endpoint}`

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    })

    // Se resposta não for ok, tenta extrair mensagem de erro
    if (!response.ok) {
      let errorMessage = `Erro ${response.status}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.error || errorData.message || errorMessage
      } catch {
        errorMessage = await response.text().catch(() => errorMessage)
      }
      throw new Error(errorMessage)
    }

    // Se for 204 (No Content), retorna null
    if (response.status === 204) {
      return null as T
    }

    return await response.json()
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Erro de conexão com o servidor')
  }
}

// ========== AUTH ==========
export const authAPI = {
  async login(email: string, password: string) {
    return request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  },

  async register(data: {
    clinic_id: number
    nome: string
    email: string
    password: string
    role: string
  }) {
    return request<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
}

// ========== CLÍNICAS ==========
export const clinicasAPI = {
  async list() {
    return request<any[]>('/clinicas', { requiresAuth: true })
  },

  async getById(id: number) {
    return request<any>(`/clinicas/${id}`, { requiresAuth: true })
  },

  async create(data: any) {
    return request<any>('/clinicas', {
      method: 'POST',
      body: JSON.stringify(data),
      requiresAuth: true,
    })
  },

  async update(id: number, data: any) {
    return request<any>(`/clinicas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      requiresAuth: true,
    })
  },

  async delete(id: number) {
    return request<void>(`/clinicas/${id}`, {
      method: 'DELETE',
      requiresAuth: true,
    })
  },
}

// ========== TUTORES ==========
export const tutoresAPI = {
  async list() {
    return request<any[]>('/tutores', { requiresAuth: true })
  },

  async getById(id: number) {
    return request<any>(`/tutores/${id}`, { requiresAuth: true })
  },

  async create(data: any) {
    return request<any>('/tutores', {
      method: 'POST',
      body: JSON.stringify(data),
      requiresAuth: true,
    })
  },

  async update(id: number, data: any) {
    return request<any>(`/tutores/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      requiresAuth: true,
    })
  },

  async delete(id: number) {
    return request<void>(`/tutores/${id}`, {
      method: 'DELETE',
      requiresAuth: true,
    })
  },
}

// ========== PACIENTES ==========
export const pacientesAPI = {
  async list(tutorId?: number) {
    const query = tutorId ? `?tutor_id=${tutorId}` : ''
    return request<any[]>(`/pacientes${query}`, { requiresAuth: true })
  },

  async getById(id: number) {
    return request<any>(`/pacientes/${id}`, { requiresAuth: true })
  },

  async create(data: any) {
    return request<any>('/pacientes', {
      method: 'POST',
      body: JSON.stringify(data),
      requiresAuth: true,
    })
  },

  async update(id: number, data: any) {
    return request<any>(`/pacientes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      requiresAuth: true,
    })
  },

  async delete(id: number) {
    return request<void>(`/pacientes/${id}`, {
      method: 'DELETE',
      requiresAuth: true,
    })
  },
}

// ========== FORMULÁRIOS DIETÉTICOS ==========
export const formulariosAPI = {
  async list(pacienteId?: number) {
    const query = pacienteId ? `?paciente_id=${pacienteId}` : ''
    return request<any[]>(`/formularios${query}`, { requiresAuth: true })
  },

  async getById(id: number) {
    return request<any>(`/formularios/${id}`, { requiresAuth: true })
  },

  async create(data: any) {
    return request<any>('/formularios', {
      method: 'POST',
      body: JSON.stringify(data),
      requiresAuth: true,
    })
  },

  async update(id: number, data: any) {
    return request<any>(`/formularios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      requiresAuth: true,
    })
  },

  async delete(id: number) {
    return request<void>(`/formularios/${id}`, {
      method: 'DELETE',
      requiresAuth: true,
    })
  },
}

// ========== ALIMENTOS CONSUMIDOS ==========
export const alimentosAPI = {
  async list(formularioId?: number) {
    const query = formularioId ? `?formulario_id=${formularioId}` : ''
    return request<any[]>(`/alimentos${query}`, { requiresAuth: true })
  },

  async create(data: any) {
    return request<any>('/alimentos', {
      method: 'POST',
      body: JSON.stringify(data),
      requiresAuth: true,
    })
  },

  async update(id: number, data: any) {
    return request<any>(`/alimentos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      requiresAuth: true,
    })
  },

  async delete(id: number) {
    return request<void>(`/alimentos/${id}`, {
      method: 'DELETE',
      requiresAuth: true,
    })
  },
}

// ========== SUPLEMENTOS CONSUMIDOS ==========
export const suplementosAPI = {
  async list(formularioId?: number) {
    const query = formularioId ? `?formulario_id=${formularioId}` : ''
    return request<any[]>(`/suplementos${query}`, { requiresAuth: true })
  },

  async create(data: any) {
    return request<any>('/suplementos', {
      method: 'POST',
      body: JSON.stringify(data),
      requiresAuth: true,
    })
  },

  async update(id: number, data: any) {
    return request<any>(`/suplementos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      requiresAuth: true,
    })
  },

  async delete(id: number) {
    return request<void>(`/suplementos/${id}`, {
      method: 'DELETE',
      requiresAuth: true,
    })
  },
}

// ========== CÁLCULOS ==========
export const calculosAPI = {
  // Calcula sem salvar (preview)
  async compute(formularioId: number) {
    return request<any>(`/calculos/compute?formulario_id=${formularioId}`, {
      requiresAuth: true,
    })
  },

  // Salva cálculo (auto ou manual)
  async save(data: { formulario_id: number; auto?: boolean }) {
    return request<any>('/calculos', {
      method: 'POST',
      body: JSON.stringify(data),
      requiresAuth: true,
    })
  },

  async list(formularioId?: number) {
    const query = formularioId ? `?formulario_id=${formularioId}` : ''
    return request<any[]>(`/calculos${query}`, { requiresAuth: true })
  },
}
