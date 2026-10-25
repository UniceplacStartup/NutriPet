<template>
  <div class="app">
    <div class="caixaCadastro">
      <h1 class="titulo">Sistema MedVet</h1>
      <p class="subtitulo">Criar conta de administrador</p>

      <form @submit.prevent="handleCadastro" novalidate>
        <h2 class="secao">Seus dados</h2>

        <div class="input-group">
          <span class="icon">🎓</span>
          <input
            :value="matricula"
            @input="matricula = somenteDigitos(($event.target as HTMLInputElement).value, 7)"
            inputmode="numeric"
            maxlength="7"
            placeholder="Matrícula (0000000)"
            aria-label="Matrícula da faculdade"
            required
          />
        </div>

        <div class="input-group">
          <span class="icon">👤</span>
          <input v-model="nome" placeholder="Nome completo" autocomplete="name" required />
        </div>

        <div class="input-group">
          <span class="icon">📧</span>
          <input type="email" v-model="email" placeholder="Email" autocomplete="email" required />
        </div>

        <div class="input-group">
          <span class="icon">🔒</span>
          <input type="password" v-model="senha" placeholder="Senha" autocomplete="new-password" required />
        </div>

        <div class="input-group">
          <span class="icon">🔒</span>
          <input type="password" v-model="confirmarSenha" placeholder="Confirmar senha" autocomplete="new-password" required />
        </div>

        <p class="dica">Mínimo de 8 caracteres, com letra maiúscula, minúscula e número.</p>

        <h2 class="secao">Dados da clínica</h2>

        <div class="input-group">
          <span class="icon">🏥</span>
          <input v-model="razaoSocial" placeholder="Razão social" required />
        </div>

        <div class="input-group">
          <span class="icon">🧾</span>
          <input
            :value="cnpj"
            @input="cnpj = mascaraCnpj(($event.target as HTMLInputElement).value)"
            inputmode="numeric"
            placeholder="CNPJ (00.000.000/0000-00)"
            aria-label="CNPJ"
            required
          />
        </div>

        <div class="input-group">
          <span class="icon">📧</span>
          <input type="email" v-model="emailClinica" placeholder="Email da clínica" required />
        </div>

        <div class="input-group">
          <span class="icon">📞</span>
          <input
            :value="telefone"
            @input="telefone = mascaraTelefone(($event.target as HTMLInputElement).value)"
            inputmode="tel"
            placeholder="Telefone"
            aria-label="Telefone"
            required
          />
        </div>

        <!-- Exibir mensagem de erro -->
        <div v-if="erroLocal || authStore.error" class="error-message">
          {{ erroLocal || authStore.error }}
        </div>

        <button type="submit" class="btn-cadastro" :disabled="authStore.isLoading">
          <strong>{{ authStore.isLoading ? 'Criando conta...' : 'Criar conta' }}</strong>
        </button>
      </form>

      <div class="opcoes">
        <RouterLink to="/" class="voltar"><strong>Já tenho conta</strong></RouterLink>
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

const matricula = ref('')
const nome = ref('')
const email = ref('')
const senha = ref('')
const confirmarSenha = ref('')
const razaoSocial = ref('')
const cnpj = ref('')
const emailClinica = ref('')
const telefone = ref('')
const erroLocal = ref<string | null>(null)

// Não mostra erro que sobrou de outra tela (o estado de erro é do store)
onMounted(() => {
  authStore.error = null
})

function somenteDigitos(valor: string, limite: number) {
  return valor.replace(/\D/g, '').slice(0, limite)
}

// 00.000.000/0000-00
function mascaraCnpj(valor: string) {
  const d = somenteDigitos(valor, 14)
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

// (00) 0000-0000 ou (00) 00000-0000
function mascaraTelefone(valor: string) {
  const d = somenteDigitos(valor, 11)
  if (d.length <= 2) return d.length ? `(${d}` : ''
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

// Mesmas regras da API, para avisar antes de enviar
function validar(): string | null {
  if (!/^\d{7}$/.test(matricula.value)) return 'Matrícula inválida: informe os 7 dígitos (0000000).'
  if (!nome.value.trim()) return 'Informe seu nome.'
  if (!/^[^\s@]+@[^\s@]+$/.test(email.value.trim())) return 'Email inválido.'
  if (senha.value !== senha.value.trim()) return 'A senha não pode começar nem terminar com espaço.'
  if (senha.value.length < 8 || !/[a-z]/.test(senha.value) || !/[A-Z]/.test(senha.value) || !/\d/.test(senha.value)) {
    return 'A senha precisa ter 8 caracteres ou mais, com maiúscula, minúscula e número.'
  }
  if (senha.value !== confirmarSenha.value) return 'As senhas não conferem.'
  if (!razaoSocial.value.trim()) return 'Informe a razão social da clínica.'
  if (somenteDigitos(cnpj.value, 14).length !== 14) return 'CNPJ inválido: informe os 14 dígitos.'
  if (!/^[^\s@]+@[^\s@]+$/.test(emailClinica.value.trim())) return 'Email da clínica inválido.'
  if (somenteDigitos(telefone.value, 11).length < 10) return 'Telefone inválido.'
  return null
}

async function handleCadastro() {
  authStore.error = null
  erroLocal.value = validar()
  if (erroLocal.value) return

  const success = await authStore.cadastrar({
    matricula: matricula.value,
    nome: nome.value.trim(),
    email: email.value.trim(),
    password: senha.value,
    clinica: {
      cnpj: somenteDigitos(cnpj.value, 14),
      razaoSocial: razaoSocial.value.trim(),
      email: emailClinica.value.trim(),
      telefone: somenteDigitos(telefone.value, 11),
    },
  })
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
  min-height: 100vh;
  background-color: #f9fafb;
  margin: 0;
  padding: 20px 16px;
  box-sizing: border-box;
  font-family: Arial, sans-serif;
}

.caixaCadastro {
  background: white;
  padding: 30px;
  border-radius: 15px;
  box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
  text-align: center;
  box-sizing: border-box;
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

.secao {
  font-size: 15px;
  text-align: left;
  color: #2e8b57;
  margin: 18px 0 10px;
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
  min-width: 0;
}

.dica {
  font-size: 12px;
  color: #6b7280;
  text-align: left;
  margin: -8px 0 10px;
}

.error-message {
  color: #dc2626;
  background-color: #fee;
  padding: 8px;
  border-radius: 5px;
  margin-bottom: 10px;
  font-size: 14px;
}

.btn-cadastro {
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

.btn-cadastro:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.opcoes {
  margin-top: 15px;
  font-size: 14px;
}

.voltar {
  color: #2e8b57;
  text-decoration: none;
}
</style>
