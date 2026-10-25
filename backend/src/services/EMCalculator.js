// ENN utilizado como carboidrato na fórmula dos cães
// A EM retornada é em kcal por 100 g do alimento (composição em %)

class EMCalculator {
    static calcular({ especie, tipo, composicao = {} }) {
        const umidade = Number(composicao.umidade_p || 0);
        const proteina = Number(composicao.proteina_bruta_p || 0);
        const gordura = Number(composicao.extrato_etereo_p || 0);
        const fibra = Number(composicao.fibra_bruta_p || 0);
        const materiaMineral = Number(composicao.materia_mineral_p || 0);
        const ennInformado = composicao.extrativo_nao_nitrogenado_p;

        // ENN informado tem prioridade; sem ele, é estimado por diferença
        const enn =
            ennInformado !== null && ennInformado !== undefined && ennInformado !== ''
                ? Number(ennInformado)
                : 100 -
                  (
                      umidade +
                      proteina +
                      gordura +
                      fibra +
                      materiaMineral
                  );

        // Aceita 'Úmido', 'UMIDO' etc.
        tipo = String(tipo || 'seco')
            .normalize('NFD')
            .replace(/[̀-ͯ]/g, '')
            .trim()
            .toLowerCase();

        let em;

        if (especie === 'gato') {
            if (tipo === 'seco') {
                em =
                    (
                        proteina * 5.65 +
                        gordura * 9.4 +
                        enn * 4.15
                    ) * 0.99 - 126;
            } else if (tipo === 'umido') {
                em =
                    proteina * 3.9 +
                    gordura * 7.7 +
                    enn * 3.0 - 5;
            } else {
                throw new Error('Tipo de alimento inválido');
            }
        } else if (especie === 'cao') {
            em =
                proteina * 3.5 +
                enn * 3.5 +
                gordura * 8.5;
        } else {
            throw new Error('Espécie inválida');
        }

        return {
            enn,
            em
        };
    }
}

module.exports = EMCalculator;