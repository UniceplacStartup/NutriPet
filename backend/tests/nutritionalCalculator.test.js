const { expect, test } = require('@jest/globals');

const NutritionalCalculator = require('../src/services/NutritionalCalculator');
const EMCalculator = require('../src/services/EMCalculator');

// Linhas no formato retornado pelo pg: BIGINT e DECIMAL como string
const cao = { id: '1', especie: 'cao' };
const gato = { id: '2', especie: 'gato' };
const formCao = { paciente_id: '1', peso_atual: '30.00' };
const formGato = { paciente_id: '2', peso_atual: '4.00' };
const racao = {
    id: '1',
    tipo: 'seco',
    quantidade_g_dia: '400.00',
    proteina_bruta_p: '25.00',
    extrato_etereo_p: '14.00',
    extrativo_nao_nitrogenado_p: '40.00',
    fibra_bruta_p: '3.00'
};

test('cão sem condição usa adulto ativo (130 x PC^0,75)', () => {
    const resultado = NutritionalCalculator.calcular(cao, formCao, [racao]);
    expect(resultado.condicao).toBe('adulto_ativo');
    expect(resultado.nem).toBeCloseTo(130 * Math.pow(30, 0.75));
});

test('gato sem condição usa adulto (100 x PC^0,67)', () => {
    const resultado = NutritionalCalculator.calcular(gato, formGato, [racao]);
    expect(resultado.condicao).toBe('adulto');
    expect(resultado.nem).toBeCloseTo(100 * Math.pow(4, 0.67));
});

test('usa a condição informada no formulário', () => {
    const resultado = NutritionalCalculator.calcular(cao, { ...formCao, condicao: 'inativo' }, [racao]);
    expect(resultado.condicao).toBe('inativo');
    expect(resultado.nem).toBeCloseTo(95 * Math.pow(30, 0.75));
});

test('usa os detalhes da condição', () => {
    const form = { ...formCao, peso_atual: '10', condicao: 'filhote', detalhes: { pesoAdultoEsperado: 30 } };
    const resultado = NutritionalCalculator.calcular(cao, form, [racao]);
    const p = 10 / 30;
    expect(resultado.nem).toBeCloseTo(130 * Math.pow(10, 0.75) * 3.2 * (Math.exp(-0.87 * p) - 0.1));
});

test('filhote sem peso adulto esperado é rejeitado', () => {
    expect(() => NutritionalCalculator.calcular(cao, { ...formCao, condicao: 'filhote' }, [])).toThrow('pesoAdultoEsperado');
});

test('condição de outra espécie é rejeitada', () => {
    expect(() => NutritionalCalculator.calcular(cao, { ...formCao, condicao: 'obeso' }, [])).toThrow('Condição inválida');
});

test('EM total é a energia diária ponderada pela quantidade', () => {
    // Cão: 25*3,5 + 14*8,5 + 40*3,5 = 346,5 kcal/100g; 400 g/dia => 1386 kcal/dia
    const resultado = NutritionalCalculator.calcular(cao, formCao, [racao]);
    expect(resultado.emTotal).toBeCloseTo(1386);
    expect(resultado.quantidadeRecomendada).toBeCloseTo(resultado.nem / (346.5 / 100));
});

test('dividir o mesmo alimento em duas linhas não altera a recomendação', () => {
    const inteiro = NutritionalCalculator.calcular(cao, formCao, [racao]);
    const dividido = NutritionalCalculator.calcular(cao, formCao, [
        { ...racao, quantidade_g_dia: '150' },
        { ...racao, id: '2', quantidade_g_dia: '250' }
    ]);
    expect(dividido.quantidadeRecomendada).toBeCloseTo(inteiro.quantidadeRecomendada);
});

test('sem alimentos calcula o NEM e deixa a quantidade nula', () => {
    const resultado = NutritionalCalculator.calcular(cao, formCao, []);
    expect(resultado.emTotal).toBe(0);
    expect(resultado.nem).toBeGreaterThan(0);
    expect(resultado.quantidadeRecomendada).toBeNull();
});

test('ENN informado tem prioridade sobre o cálculo por diferença', () => {
    const { enn } = EMCalculator.calcular({ especie: 'cao', composicao: racao });
    expect(enn).toBe(40);
});

test('ENN é estimado por diferença quando não informado', () => {
    const composicao = { ...racao, extrativo_nao_nitrogenado_p: null, umidade_p: '10', materia_mineral_p: '7' };
    const { enn } = EMCalculator.calcular({ especie: 'cao', composicao });
    expect(enn).toBe(100 - (10 + 25 + 14 + 3 + 7));
});

test('tipo do alimento aceita acento e maiúsculas', () => {
    const umido = EMCalculator.calcular({ especie: 'gato', tipo: 'umido', composicao: racao });
    expect(EMCalculator.calcular({ especie: 'gato', tipo: 'Úmido', composicao: racao })).toEqual(umido);
});

test('tipo nulo é tratado como seco', () => {
    const seco = EMCalculator.calcular({ especie: 'gato', tipo: 'seco', composicao: racao });
    expect(EMCalculator.calcular({ especie: 'gato', tipo: null, composicao: racao })).toEqual(seco);
});
