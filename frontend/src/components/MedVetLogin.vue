<template>
  <div class="app">
    <div class="caixaLogin">
      <h1 class="titulo">Sistema MedVet</h1>
      <p class="subtitulo">Bem vindo(a)</p>

      <form @submit.prevent="handleLogin">
        <div class="input-group">
          <span class="icon">📧</span>
          <input type="email" v-model="email" placeholder="Email" required />
        </div>

        <div class="input-group">
          <span class="icon">🔒</span>
          <input type="password" v-model="senha" placeholder="Senha" required />
        </div>

        <!-- Exibir mensagem de erro -->
        <div v-if="authStore.error" class="error-message">
          {{ authStore.error }}
        </div>

        <button type="submit" class="btn-login" :disabled="authStore.isLoading">
          <strong>{{ authStore.isLoading ? 'Entrando...' : 'Entrar' }}</strong>
        </button>
      </form>

      <div class="opcoes">
        <a href="#" class="esquecer"><strong>Esqueci a senha</strong></a>
        <RouterLink to="/cadastro" class="criar"><strong>Criar uma conta</strong></RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const senha = ref('')

// Não mostra erro que sobrou da tela de cadastro
onMounted(() => {
  authStore.error = null
})

async function handleLogin() {
  const success = await authStore.login(email.value, senha.value)
  if (success) {
    router.push('/dashboard')
  }
}
</script>

<style scoped>
.app {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f9fafb;
  margin: 0;
  font-family: Arial, sans-serif;
}

.caixaLogin {
  background: white;
  padding: 30px;
  border-radius: 15px;
  box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.1);
  width: 350px;
  text-align: center;
}

.titulo {
  font-size: 22px;
  font-weight: bold;
  background: linear-gradient(to right, #32cd32, #006400);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.subtitulo {
  margin-bottom: 20px;
  color: #a0522d;
}

.input-group {
  display: flex;
  align-items: center;
  border: 1px solid #332f2fff;
  border-radius: 8px;
  margin-bottom: 15px;
  padding: 8px 10px;
  background: #fdfdfd;
}

.icon {
  margin-right: 8px;
}

.input-group input {
  border: none;
  outline: none;
  flex: 1;
}

.error-message {
  color: #dc2626;
  background-color: #fee;
  padding: 8px;
  border-radius: 5px;
  margin-bottom: 10px;
  font-size: 14px;
}

.btn-login {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(to right, #32cd32, #006400);
  color: white;
  font-size: 16px;
  cursor: pointer;
  margin-top: 10px;
}

.btn-login:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.opcoes {
  margin-top: 15px;
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.esquecer {
  color: #a0522d;
  text-decoration: none;
}

.criar {
  color: #2e8b57;
  text-decoration: none;
}
</style>
