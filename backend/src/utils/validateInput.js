const isUndefined = (data) => {
    if (data === undefined) { return true }
    return false
}

// Texto obrigatório: precisa ser string e não pode ficar vazio após o trim
const invalidText = (text) => {
    if (typeof text !== 'string') { return true }
    if (text.trim() === '') { return true }
    return false
}

// Texto opcional: aceita ausência, null, string ou número (convertido em texto)
const invalidOptionalText = (text) => {
    if (text === undefined || text === null) { return false }
    return typeof text !== 'string' && typeof text !== 'number'
}

const toOptionalText = (text) => {
    if (text === undefined || text === null) { return null }
    return String(text).trim() || null
}

// Remove a máscara (00.000.000/0000-00) e mantém só os dígitos
const normalizeCnpj = (cnpj) => cnpj.replace(/[.\-/\s]/g, '')

const invalidCnpj = (cnpj) => {
    if (typeof cnpj !== 'string') { return true }
    if (!/^\d{14}$/.test(normalizeCnpj(cnpj.trim()))) { return true }
    return false
}

const normalizeEmail = (email) => email.trim().toLowerCase()

const invalidEmail = (email) => {
    if (typeof email !== 'string') { return true }
    if (!/^[^\s@]+@[^\s@]+$/.test(email.trim())) { return true }
    return false
}

// Espaços nas pontas são recusados: a senha é usada exatamente como digitada
const invalidPassword = (password) => {
    if (typeof password !== 'string') { return true }
    if (password !== password.trim()) { return true }
    if (password.length < 8) { return true }
    if (password.match(/[a-z]/g) === null) { return true }
    if (password.match(/[A-Z]/g) === null) { return true }
    if (password.match(/[0-9]/g) === null) { return true }
    return false
}

// Matrícula da faculdade: exatamente 7 dígitos (máscara 0000000)
const invalidMatricula = (matricula) => {
    if (typeof matricula !== 'string') { return true }
    if (!/^\d{7}$/.test(matricula.trim())) { return true }
    return false
}

// IDs são BIGINT positivos; aceita número ou string numérica
const invalidId = (id) => {
    if (typeof id !== 'string' && typeof id !== 'number') { return true }
    return !/^[1-9]\d{0,17}$/.test(String(id).trim())
}

// Número opcional dentro do intervalo; aceita string numérica (DECIMAL vem como texto)
const invalidOptionalNumber = (value, { min = 0, max = Infinity, allowMin = true } = {}) => {
    if (value === undefined || value === null) { return false }
    if (typeof value !== 'number' && typeof value !== 'string') { return true }
    if (typeof value === 'string' && value.trim() === '') { return true }
    const n = Number(value)
    if (!Number.isFinite(n)) { return true }
    if (allowMin ? n < min : n <= min) { return true }
    return n > max
}

// Data no formato AAAA-MM-DD e existente no calendário
const invalidDate = (date) => {
    if (typeof date !== 'string') { return true }
    const match = date.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (!match) { return true }
    const [, y, m, d] = match.map(Number)
    const parsed = new Date(Date.UTC(y, m - 1, d))
    return parsed.getUTCFullYear() !== y || parsed.getUTCMonth() !== m - 1 || parsed.getUTCDate() !== d
}

// Data ou data/hora ISO usada em filtros
const invalidDateTime = (value) => {
    if (typeof value !== 'string') { return true }
    if (!/^\d{4}-\d{2}-\d{2}/.test(value)) { return true }
    return Number.isNaN(Date.parse(value))
}

module.exports = {
    isUndefined,
    invalidText,
    invalidOptionalText,
    toOptionalText,
    invalidCnpj,
    normalizeCnpj,
    invalidPassword,
    invalidEmail,
    normalizeEmail,
    invalidMatricula,
    invalidId,
    invalidOptionalNumber,
    invalidDate,
    invalidDateTime
};
