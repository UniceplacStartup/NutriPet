<template>
  <div class="page">
    <header class="page-header">
      <h1>📋 Formulários Dietéticos</h1>
      <RouterLink to="/dashboard" class="btn-back">← Voltar</RouterLink>
    </header>

    <div class="page-content">
      <!-- Progress Indicator (Category 1: Layout/Organization) -->
      <div class="progress-container">
        <div :class="['progress-step', { active: !currentFormularioId || step === 1 }]">
          <div class="step-number">1</div>
          <div class="step-label">Paciente</div>
        </div>
        <div class="progress-line" :class="{ active: currentFormularioId && !resultadoCalculo }"></div>
        <div :class="['progress-step', { active: currentFormularioId && !resultadoCalculo }]">
          <div class="step-number">2</div>
          <div class="step-label">Alimentos</div>
        </div>
        <div class="progress-line" :class="{ active: resultadoCalculo }"></div>
        <div :class="['progress-step', { active: resultadoCalculo }]">
          <div class="step-number">3</div>
          <div class="step-label">Resultados</div>
        </div>
      </div>

      <!-- Step 1: Selecionar Paciente e Criar Formulário -->
      <div v-if="!currentFormularioId" class="form-card">
        <h2>1️⃣ Novo Formulário Dietético</h2>
        <form @submit.prevent="criarFormulario">
          <div class="form-row">
            <div class="form-group">
              <label>Paciente *</label>
              <select v-model="formularioForm.paciente_id" required>
                <option value="">Selecione um paciente</option>
                <option v-for="p in pacientes" :key="p.id" :value="p.id">
                  {{ p.nome }} ({{ p.especie === 'cao' ? 'Cão' : 'Gato' }})
                </option>
              </select>
            </div>
            <div class="form-group">
              <label>Data da Avaliação *</label>
              <input v-model="formularioForm.data_avaliacao" type="date" required />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Peso Atual (kg) *</label>
              <input v-model.number="formularioForm.peso_atual" type="number" step="0.1" min="0.1" required />
            </div>
            <div class="form-group">
              <label>Condição do Animal *</label>
              <select v-model="formularioForm.condicao" required :disabled="!condicoesDisponiveis.length">
                <option v-if="!condicoesDisponiveis.length" value="">Selecione um paciente</option>
                <option v-for="c in condicoesDisponiveis" :key="c.value" :value="c.value">
                  {{ c.label }}
                </option>
              </select>
            </div>
          </div>

          <div v-if="formularioForm.condicao === 'filhote'" class="form-row">
            <div class="form-group">
              <label>Peso Adulto Esperado (kg) *</label>
              <input v-model.number="detalhesForm.pesoAdultoEsperado" type="number" step="0.1" min="0.1" required />
            </div>
          </div>

          <div v-if="formularioForm.condicao === 'lactante'" class="form-row">
            <div class="form-group">
              <label>Semana de Lactação *</label>
              <select v-model.number="detalhesForm.semana" required>
                <option :value="null">Selecione</option>
                <option v-for="s in 4" :key="s" :value="s">{{ s }}ª semana</option>
              </select>
            </div>
            <div class="form-group">
              <label>Número de Filhotes *</label>
              <input v-model.number="detalhesForm.numeroFilhotes" type="number" step="1" min="1" required />
            </div>
          </div>

          <div class="form-group">
            <label>Observações</label>
            <textarea v-model="formularioForm.observacoes" rows="3"></textarea>
          </div>

          <button type="submit" class="btn-primary" :disabled="loading">
            {{ loading ? 'Criando...' : 'Criar Formulário' }}
          </button>
          <div v-if="error" class="error">{{ error }}</div>
        </form>
      </div>

      <!-- Step 2: Adicionar Alimentos -->
      <div v-if="currentFormularioId && !resultadoCalculo" class="form-card">
        <div class="patient-info" v-if="selectedPatient">
          <div class="info-item">
            <span class="info-label">Paciente:</span>
            <span class="info-value">{{ selectedPatient.nome }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Espécie:</span>
            <span class="info-value">{{ selectedPatient.especie === 'cao' ? 'Cão' : 'Gato' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Peso Ideal:</span>
            <span class="info-value">{{ selectedPatient.peso_ideal }} kg</span>
          </div>
        </div>
        <h2>2️⃣ Adicionar Alimentos Consumidos</h2>
        <form @submit.prevent="adicionarAlimento">
          <div class="form-row">
            <div class="form-group">
              <label>Nome do Alimento *</label>
              <input v-model="alimentoForm.nome_alimento" type="text" required />
            </div>
            <div class="form-group">
              <label>Quantidade (g/dia) *</label>
              <input v-model.number="alimentoForm.quantidade_g_dia" type="number" step="0.1" required />
            </div>
            <div class="form-group">
              <label>Tipo *</label>
              <select v-model="alimentoForm.tipo" required>
                <option value="seco">Seco</option>
                <option value="umido">Úmido</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Proteína Bruta (%)</label>
              <input v-model.number="alimentoForm.proteina_bruta_p" type="number" step="0.1" />
            </div>
            <div class="form-group">
              <label>Extrato Etéreo (%)</label>
              <input v-model.number="alimentoForm.extrato_etereo_p" type="number" step="0.1" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Extrativo Não Nitrogenado (%)</label>
              <input
                v-model.number="alimentoForm.extrativo_nao_nitrogenado_p"
                type="number"
                step="0.1"
              />
            </div>
            <div class="form-group">
              <label>Fibra Bruta (%)</label>
              <input v-model.number="alimentoForm.fibra_bruta_p" type="number" step="0.1" />
            </div>
          </div>

          <button type="submit" class="btn-primary" :disabled="loading">
            Adicionar Alimento
          </button>
        </form>

        <!-- Lista de Alimentos Adicionados -->
        <div v-if="alimentos.length" class="alimentos-list">
          <h3>Alimentos adicionados:</h3>
          <table>
            <thead>
              <tr>
                <th>Alimento</th>
                <th>Qtd (g/dia)</th>
                <th>PB%</th>
                <th>EE%</th>
                <th>ENN%</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="alimento in alimentos" :key="alimento.id">
                <td>{{ alimento.descricao_alimento }}</td>
                <td>{{ alimento.quantidade_g_dia }}</td>
                <td>{{ alimento.proteina_bruta_p || '-' }}</td>
                <td>{{ alimento.extrato_etereo_p || '-' }}</td>
                <td>{{ alimento.extrativo_nao_nitrogenado_p || '-' }}</td>
                <td>
                  <button @click="confirmRemoverAlimento(alimento.id, alimento.descricao_alimento)" class="btn-delete">🗑️</button>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colspan="1" style="font-weight: bold;">Total</td>
                <td style="font-weight: bold; background: #f7fafc;">{{ alimentosTotalQtd }} g</td>
                <td colspan="4" style="color: #718096; font-size: 12px;">{{ alimentos.length }} alimento(s)</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div v-else class="empty-state" style="margin-top: 20px;">
          <p style="color: #718096; text-align: center;">Nenhum alimento adicionado ainda. Complete o formulário acima.</p>
        </div>
      </div>

      <!-- Step 3: Calcular e Exibir Resultados -->
      <div v-if="currentFormularioId && !resultadoCalculo" class="calc-card">
        <h2>3️⃣ Calcular Necessidades Nutricionais</h2>
        <p class="calc-info">
          Com base no peso do paciente e nos alimentos cadastrados, o sistema calculará:
        </p>
        <ul class="calc-info">
          <li><strong>EM</strong>: Energia Metabolizável (kcal/dia)</li>
          <li><strong>NEM</strong>: Necessidade Energética de Manutenção (kcal/dia)</li>
          <li><strong>Quantidade Recomendada</strong>: Gramas de ração/dia</li>
        </ul>

        <div class="calc-actions">
          <button @click="calcularDieta" class="btn-calc" :disabled="loading || alimentos.length === 0">
            {{ loading ? 'Calculando...' : '🧮 Calcular Dieta' }}
          </button>
          <button @click="confirmNovoFormulario" class="btn-secondary">Novo Formulário</button>
        </div>

        <div v-if="error" class="error">{{ error }}</div>
      </div>

      <!-- Results Display -->
      <div v-if="resultadoCalculo" class="resultado-card">
        <div class="resultado-header">
          <h3>✅ Resultados do Cálculo Nutricional</h3>
          <button @click="confirmNovoFormulario" class="btn-close">✕</button>
        </div>
        
        <div v-if="selectedPatient" class="patient-summary">
          <div class="summary-section">
            <h4>Informações do Paciente</h4>
            <div class="summary-grid">
              <div class="summary-item">
                <span class="summary-label">Nome</span>
                <span class="summary-value">{{ selectedPatient.nome }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Espécie</span>
                <span class="summary-value">{{ selectedPatient.especie === 'cao' ? 'Cão' : 'Gato' }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Peso Avaliado</span>
                <span class="summary-value">{{ formularioForm.peso_atual }} kg</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Condição</span>
                <span class="summary-value">{{ labelCondicao }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Peso Ideal</span>
                <span class="summary-value">{{ selectedPatient.peso_ideal }} kg</span>
              </div>
              <div class="summary-item" v-if="pesoComparacao">
                <span class="summary-label">Diferença</span>
                <span class="summary-value" :class="{ 'above-ideal': pesoComparacao > 0, 'below-ideal': pesoComparacao < 0 }">
                  {{ pesoComparacao > 0 ? '+' : '' }}{{ fmt2(pesoComparacao) }} kg
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="resultado-grid">
          <div class="resultado-item">
            <span class="resultado-label">EM Total</span>
            <span class="resultado-value">
              {{ fmt2(resultadoCalculo.em_total_kcal_dia) }}<span class="resultado-unit">kcal/dia</span>
            </span>
            <span class="resultado-desc">Energia dos alimentos</span>
          </div>
          <div class="resultado-item">
            <span class="resultado-label">NEM Calculada</span>
            <span class="resultado-value">
              {{ fmt2(resultadoCalculo.nem_calculada_kcal_dia) }}<span class="resultado-unit">kcal/dia</span>
            </span>
            <span class="resultado-desc">Necessidade de manutenção</span>
          </div>
          <div class="resultado-item resultado-destaque">
            <span class="resultado-label">Quantidade Recomendada</span>
            <span class="resultado-value">
              {{ fmt2(resultadoCalculo.quantidade_racao_recomendada_g_dia) }}<span class="resultado-unit">g/dia</span>
            </span>
            <span class="resultado-desc">De ração/alimento</span>
          </div>
        </div>

        <div class="resultado-actions">
          <button @click="confirmNovoFormulario" class="btn-primary">Novo Formulário</button>
          <RouterLink to="/dashboard" class="btn-secondary">Ir para Dashboard</RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import {
  pacientesAPI,
  formulariosAPI,
  alimentosAPI,
  calculosAPI,
} from '@/services/api'

/* eslint-disable @typescript-eslint/no-explicit-any */

const pacientes = ref<any[]>([])
const alimentos = ref<any[]>([])
const currentFormularioId = ref<number | null>(null)
const resultadoCalculo = ref<any>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const step = ref(1)
const selectedPatient = ref<any>(null)

// Condições aceitas pelo NEMCalculator do backend; a primeira é o padrão da espécie
const CONDICOES: Record<string, { value: string; label: string }[]> = {
  cao: [
    { value: 'adulto_ativo', label: 'Adulto ativo' },
    { value: 'jovem_ativo', label: 'Jovem adulto ativo' },
    { value: 'inativo', label: 'Inativo / sedentário' },
    { value: 'idoso', label: 'Idoso' },
    { value: 'terrier', label: 'Terrier (alta energia)' },
    { value: 'dogue_alemao', label: 'Dogue alemão' },
    { value: 'filhote', label: 'Filhote' },
    { value: 'gestante', label: 'Gestante' },
    { value: 'lactante', label: 'Lactante' },
  ],
  gato: [
    { value: 'adulto', label: 'Adulto' },
    { value: 'magro', label: 'Adulto magro' },
    { value: 'obeso', label: 'Obeso' },
    { value: 'idoso', label: 'Idoso' },
    { value: 'filhote', label: 'Filhote' },
    { value: 'gestante', label: 'Gestante' },
    { value: 'lactante', label: 'Lactante' },
  ],
}

const formularioForm = ref({
  paciente_id: '',
  data_avaliacao: new Date().toISOString().split('T')[0],
  peso_atual: null as number | null,
  condicao: '',
  observacoes: '',
})

const detalhesForm = ref({
  pesoAdultoEsperado: null as number | null,
  semana: null as number | null,
  numeroFilhotes: null as number | null,
})

// IDs chegam do backend como string (BIGINT)
const pacienteFormulario = computed(() =>
  pacientes.value.find((p) => String(p.id) === String(formularioForm.value.paciente_id)),
)
const condicoesDisponiveis = computed(() => CONDICOES[pacienteFormulario.value?.especie] ?? [])

watch(
  () => formularioForm.value.paciente_id,
  () => {
    formularioForm.value.condicao = condicoesDisponiveis.value[0]?.value ?? ''
  },
)

const labelCondicao = computed(
  () => condicoesDisponiveis.value.find((c) => c.value === formularioForm.value.condicao)?.label ?? '-',
)

function montarDetalhes() {
  const d = detalhesForm.value
  if (formularioForm.value.condicao === 'filhote') {
    return { pesoAdultoEsperado: d.pesoAdultoEsperado }
  }
  if (formularioForm.value.condicao === 'lactante') {
    if (pacienteFormulario.value?.especie === 'cao') {
      // A fórmula de cães separa os filhotes até o 4º (n1a4) dos demais (n5a8)
      const n = d.numeroFilhotes || 0
      return { semana: d.semana, n1a4: Math.min(n, 4), n5a8: Math.max(n - 4, 0) }
    }
    return { semana: d.semana, numeroFilhotes: d.numeroFilhotes }
  }
  return null
}

const alimentoForm = ref({
  nome_alimento: '',
  tipo: 'seco',
  quantidade_g_dia: null as number | null,
  proteina_bruta_p: null as number | null,
  extrato_etereo_p: null as number | null,
  extrativo_nao_nitrogenado_p: null as number | null,
  fibra_bruta_p: null as number | null,
})

function fmt2(v: unknown): string {
  if (v === null || v === undefined) return '-'
  const n = Number(v)
  return Number.isFinite(n) ? n.toFixed(2) : '-'
}

onMounted(async () => {
  await loadPacientes()
})

watch(currentFormularioId, async (newId) => {
  if (newId) {
    await loadAlimentos()
  }
})

async function loadPacientes() {
  try {
    pacientes.value = await pacientesAPI.list()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Erro ao carregar pacientes'
  }
}

async function loadAlimentos() {
  if (!currentFormularioId.value) return
  try {
    alimentos.value = await alimentosAPI.list(currentFormularioId.value)
  } catch (err) {
    console.error('Erro ao carregar alimentos:', err)
  }
}

async function criarFormulario() {
  try {
    loading.value = true
    error.value = null

    const response = await formulariosAPI.create({
      paciente_id: Number(formularioForm.value.paciente_id),
      peso_atual: formularioForm.value.peso_atual,
      condicao: formularioForm.value.condicao || null,
      detalhes: montarDetalhes(),
      observacoes_vet: formularioForm.value.observacoes || null,
    })

    currentFormularioId.value = response.id
    selectedPatient.value = pacienteFormulario.value
    step.value = 2
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Erro ao criar formulário'
  } finally {
    loading.value = false
  }
}

async function adicionarAlimento() {
  try {
    loading.value = true
    error.value = null

    await alimentosAPI.create({
      formulario_id: currentFormularioId.value,
      descricao_alimento: alimentoForm.value.nome_alimento, // Renomear para descricao_alimento
      tipo: alimentoForm.value.tipo,
      quantidade_g_dia: alimentoForm.value.quantidade_g_dia, // Certifique-se de que este campo está preenchido
      proteina_bruta_p: alimentoForm.value.proteina_bruta_p,
      extrato_etereo_p: alimentoForm.value.extrato_etereo_p,
      extrativo_nao_nitrogenado_p: alimentoForm.value.extrativo_nao_nitrogenado_p,
      fibra_bruta_p: alimentoForm.value.fibra_bruta_p,
    })

    // Reset form (mantém o tipo para o próximo alimento)
    alimentoForm.value = {
      nome_alimento: '',
      tipo: alimentoForm.value.tipo,
      quantidade_g_dia: null,
      proteina_bruta_p: null,
      extrato_etereo_p: null,
      extrativo_nao_nitrogenado_p: null,
      fibra_bruta_p: null,
    }

    await loadAlimentos()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Erro ao adicionar alimento'
  } finally {
    loading.value = false
  }
}

async function confirmRemoverAlimento(id: number, nome: string) {
  if (window.confirm(`Deseja realmente remover "${nome}"?`)) {
    await removerAlimento(id)
  }
}

async function removerAlimento(id: number) {
  try {
    await alimentosAPI.delete(id)
    await loadAlimentos()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Erro ao remover alimento'
  }
}

async function calcularDieta() {
  if (!currentFormularioId.value || alimentos.value.length === 0) return

  try {
    loading.value = true
    error.value = null

    // Chamar o endpoint de cálculo automático
    const response = await calculosAPI.save({
      formulario_id: currentFormularioId.value,
      auto: true,
    })

    resultadoCalculo.value = response
    step.value = 3
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Erro ao calcular dieta'
  } finally {
    loading.value = false
  }
}

function confirmNovoFormulario() {
  if (window.confirm('Deseja começar um novo formulário? Todos os dados atuais serão perdidos.')) {
    resetFormulario()
  }
}

function resetFormulario() {
  currentFormularioId.value = null
  alimentos.value = []
  resultadoCalculo.value = null
  selectedPatient.value = null
  step.value = 1
  formularioForm.value = {
    paciente_id: '',
    data_avaliacao: new Date().toISOString().split('T')[0],
    peso_atual: null,
    condicao: '',
    observacoes: '',
  }
  detalhesForm.value = { pesoAdultoEsperado: null, semana: null, numeroFilhotes: null }
}

// quantidade_g_dia chega como string (DECIMAL)
const alimentosTotalQtd = computed(() => {
  return alimentos.value.reduce((total, a) => total + (Number(a.quantidade_g_dia) || 0), 0)
})

const pesoComparacao = computed(() => {
  if (!selectedPatient.value || !formularioForm.value.peso_atual) return null
  return formularioForm.value.peso_atual - selectedPatient.value.peso_ideal
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f7fafc;
}

.page-header {
  background: white;
  padding: 20px 40px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-header h1 {
  margin: 0;
  color: #2d3748;
}

.btn-back {
  padding: 8px 16px;
  background: #e2e8f0;
  color: #2d3748;
  border-radius: 6px;
  text-decoration: none;
  font-size: 14px;
}

.btn-back:hover {
  background: #cbd5e0;
}

.page-content {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px 20px;
  display: grid;
  gap: 24px;
}

@media (min-width: 1600px) {
  .page-content {
    max-width: 90%;
  }
}

/* Category 1: Layout/Organization - Progress Indicator */
.progress-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.progress-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  opacity: 0.4;
  transition: opacity 0.3s ease;
}

.progress-step.active {
  opacity: 1;
}

.step-number {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #e2e8f0;
  font-weight: bold;
  color: #4a5568;
  transition: all 0.3s ease;
}

.progress-step.active .step-number {
  background: linear-gradient(135deg, #32cd32 0%, #006400 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(50, 205, 50, 0.3);
}

.step-label {
  font-size: 12px;
  font-weight: 600;
  color: #4a5568;
  white-space: nowrap;
}

.progress-line {
  width: 40px;
  height: 3px;
  background: #e2e8f0;
  opacity: 0.4;
  transition: opacity 0.3s ease;
}

.progress-line.active {
  background: linear-gradient(90deg, #32cd32 0%, #006400 100%);
  opacity: 1;
}

/* Patient Info Display */
.patient-info {
  background: #f0fdf4;
  border-left: 4px solid #32cd32;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 12px;
  font-weight: 600;
  color: #006400;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 16px;
  font-weight: 500;
  color: #2d3748;
}

.form-card,
.calc-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.form-card h2,
.calc-card h2 {
  margin-top: 0;
  color: #2d3748;
  font-size: 20px;
  margin-bottom: 20px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  color: #4a5568;
  font-size: 14px;
  font-weight: 500;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #32cd32;
}

.btn-primary,
.btn-calc {
  padding: 12px 24px;
  background: linear-gradient(135deg, #32cd32 0%, #006400 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.btn-calc {
  font-size: 16px;
  padding: 14px 32px;
}

.btn-primary:hover:not(:disabled),
.btn-calc:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-primary:disabled,
.btn-calc:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  padding: 12px 24px;
  background: #e2e8f0;
  color: #2d3748;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background: #cbd5e0;
  transform: translateY(-2px);
}

/* Category 3: Table Enhancements */
.alimentos-list {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 2px solid #e2e8f0;
}

.alimentos-list h3 {
  margin-bottom: 16px;
  color: #2d3748;
  font-size: 16px;
}

.empty-state {
  background: #f7fafc;
  padding: 24px;
  border-radius: 8px;
  text-align: center;
}

table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

table thead {
  background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
}

table th {
  padding: 12px;
  text-align: left;
  color: #2d3748;
  font-size: 13px;
  font-weight: 700;
  border-bottom: 2px solid #32cd32;
  letter-spacing: 0.3px;
}

table td {
  padding: 12px;
  border-bottom: 1px solid #e2e8f0;
  color: #2d3748;
  font-size: 14px;
}

table tbody tr:hover {
  background: #f7fafc;
  transition: background 0.2s ease;
}

table tfoot {
  background: #f7fafc;
  border-top: 2px solid #e2e8f0;
}

table tfoot td {
  padding: 12px;
  font-size: 14px;
  color: #2d3748;
  border: none;
}

.btn-delete {
  padding: 6px 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  background: #fed7d7;
  transition: all 0.2s ease;
}

.btn-delete:hover {
  background: #fc8181;
  transform: scale(1.05);
}

.calc-info {
  color: #718096;
  font-size: 14px;
  line-height: 1.6;
}

.calc-info li {
  margin-bottom: 8px;
}

.calc-actions {
  margin-top: 20px;
  display: flex;
  gap: 12px;
}

/* Category 4 & 5: Results Visualization & UX Improvements */
.resultado-card {
  margin-top: 24px;
  padding: 32px;
  background: linear-gradient(135deg, #e6f7e6 0%, #d4f1d4 100%);
  border-radius: 12px;
  border: 2px solid #32cd32;
  box-shadow: 0 4px 16px rgba(50, 205, 50, 0.15);
}

.resultado-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.resultado-card h3 {
  margin: 0;
  color: #006400;
  font-size: 20px;
}

.btn-close {
  background: rgba(255, 255, 255, 0.7);
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  cursor: pointer;
  font-size: 18px;
  color: #2d3748;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease;
}

.btn-close:hover {
  background: rgba(255, 255, 255, 1);
}

/* Patient Summary in Results */
.patient-summary {
  background: white;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 24px;
}

.summary-section h4 {
  margin: 0 0 16px 0;
  color: #2d3748;
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #006400;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.summary-item {
  padding: 12px;
  background: #f7fafc;
  border-radius: 6px;
  border-left: 3px solid #32cd32;
}

.summary-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #718096;
  text-transform: uppercase;
  margin-bottom: 4px;
}

.summary-value {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: #2d3748;
}

.above-ideal {
  color: #ed8936 !important;
}

.below-ideal {
  color: #38a169 !important;
}

.resultado-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.resultado-item {
  background: white;
  padding: 20px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.resultado-destaque {
  background: linear-gradient(135deg, #32cd32 0%, #006400 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(50, 205, 50, 0.3);
  transform: scale(1.02);
}

.resultado-label {
  font-size: 12px;
  font-weight: 700;
  margin-bottom: 8px;
  color: #4a5568;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.resultado-destaque .resultado-label {
  color: rgba(255, 255, 255, 0.9);
}

.resultado-value {
  font-size: 28px;
  font-weight: bold;
  color: #2d3748;
  margin-bottom: 6px;
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 6px;
}

.resultado-destaque .resultado-value {
  color: white;
}

.resultado-unit {
  font-size: 14px;
  font-weight: 500;
  opacity: 0.8;
}

.resultado-desc {
  font-size: 12px;
  color: #718096;
  margin-top: 6px;
}

.resultado-destaque .resultado-desc {
  color: rgba(255, 255, 255, 0.8);
}

.resultado-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 24px;
}

.error {
  margin-top: 16px;
  padding: 12px;
  background: #fff5f5;
  color: #e53e3e;
  border-radius: 6px;
  font-size: 14px;
}

/* Responsividade */
@media (max-width: 768px) {
  .page-header {
    padding: 15px 20px;
  }

  .page-header h1 {
    font-size: 20px;
  }

  .page-content {
    padding: 20px 15px;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .progress-container {
    flex-wrap: wrap;
    gap: 12px;
  }

  .progress-line {
    display: none;
  }

  .patient-info,
  .summary-grid,
  .resultado-grid {
    grid-template-columns: 1fr;
  }

  .resultado-actions {
    flex-direction: column;
  }

  table {
    font-size: 12px;
  }

  table th,
  table td {
    padding: 8px 6px;
  }
}

@media (max-width: 480px) {
  .btn-back {
    padding: 6px 12px;
    font-size: 12px;
  }

  .form-card,
  .calc-card,
  .resultado-card {
    padding: 16px;
  }

  .resultado-card {
    padding: 16px;
  }

  .resultado-value {
    font-size: 20px;
  }

  .step-number {
    width: 32px;
    height: 32px;
    font-size: 12px;
  }

  .step-label {
    font-size: 10px;
  }
}
</style>
