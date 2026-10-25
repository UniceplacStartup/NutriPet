import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authAPI, type CadastroData } from '@/services/api'

/* eslint-disable @typescript-eslint/no-explicit-any */

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('medvet_token'))
  const user = ref<any>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!token.value)

  async function login(email: string, password: string) {
    try {
      isLoading.value = true
      error.value = null

      const response = await authAPI.login(email, password)
      
      token.value = response.token
      user.value = response.user
      
      localStorage.setItem('medvet_token', response.token)
      
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Erro ao fazer login'
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function cadastrar(data: CadastroData) {
    try {
      isLoading.value = true
      error.value = null

      const response = await authAPI.cadastro(data)

      token.value = response.token
      user.value = response.user

      localStorage.setItem('medvet_token', response.token)

      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Erro ao criar conta'
      return false
    } finally {
      isLoading.value = false
    }
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('medvet_token')
  }

  return {
    token,
    user,
    isLoading,
    error,
    isAuthenticated,
    login,
    cadastrar,
    logout,
  }
})
