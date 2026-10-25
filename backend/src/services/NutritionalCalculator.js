const EMCalculator = require('./EMCalculator');
const NEMCalculator = require('./NEMCalculator');

// Condição usada quando o formulário não informa nenhuma
const CONDICAO_PADRAO = {
    cao: 'adulto_ativo',
    gato: 'adulto'
};

class NutritionalCalculator {
    /**
     * Método orquestrador do fluxo do RF06
     * @param {Object} paciente Dados do paciente
     * @param {Object} formulario Dados do formulário
     * @param {Array} alimentos Lista de alimentos
     * @returns {Object} Resultado com totais e quantidade recomendada
     */
    static calcular(paciente, formulario, alimentos) {
        // Garante o tratamento para cenários de valores nulos
        if (!paciente || !formulario || !alimentos || !Array.isArray(alimentos)) {
            throw new Error('Dados insuficientes para realizar o cálculo');
        }

        // Normaliza IDs explicitamente (PostgreSQL retorna BIGINT como string)
        const pacienteId = Number(paciente.id);
        const formPacienteId = Number(formulario.paciente_id);

        // Validação estrita usando Number()
        if (!isNaN(pacienteId) && !isNaN(formPacienteId) && pacienteId !== formPacienteId) {
            throw new Error('Inconsistência: O formulário não pertence a este paciente');
        }

        let emTotal = 0;
        let gramasTotal = 0;

        // Processa cada alimento
        const alimentosProcessados = alimentos.map(alimento => {
            const alimentoId = Number(alimento.id);
            const quantidade = Number(alimento.quantidade_g_dia) || 0;

            // 1. Calcula ENN e 2. Calcula a EM em kcal/100g (validando a espécie internamente)
            const { enn, em } = EMCalculator.calcular({
                especie: paciente.especie,
                tipo: alimento.tipo,
                composicao: alimento
            });

            // 3. Soma a energia que o alimento fornece por dia, proporcional à quantidade
            const emDia = (em * quantidade) / 100;
            emTotal += emDia;
            gramasTotal += quantidade;

            return {
                id: alimentoId,
                enn,
                em,
                emDia
            };
        });

        // 4. Usa a condição do formulário ou o padrão da espécie
        const condicao = this.resolverCondicao(paciente.especie, formulario.condicao);

        // Garante peso válido
        const pesoAtual = Number(formulario.peso_atual) || 0;

        // 5. Determina o NEM apropriado para a condição
        const { nem } = NEMCalculator.calcular({
            especie: paciente.especie,
            pesoAtual,
            condicao,
            detalhes: formulario.detalhes || {}
        });

        // 6. Quantidade da dieta atual (mantendo a proporção entre os alimentos) que fornece o NEM
        let quantidadeRecomendada = null;

        // Evita divisão por zero
        if (emTotal > 0 && gramasTotal > 0) {
            const densidade = emTotal / gramasTotal; // kcal por grama da dieta
            quantidadeRecomendada = nem / densidade;
        }

        return {
            alimentos: alimentosProcessados,
            emTotal,
            condicao,
            nem,
            quantidadeRecomendada
        };
    }

    static resolverCondicao(especie, condicao) {
        const informada = typeof condicao === 'string' ? condicao.trim() : '';
        return informada || CONDICAO_PADRAO[especie];
    }
}

module.exports = NutritionalCalculator;
