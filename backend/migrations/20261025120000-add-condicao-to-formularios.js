'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Condição fisiológica usada no cálculo da NEM (ex: 'adulto_ativo', 'filhote')
    await queryInterface.addColumn('formularios_dieteticos', 'condicao', {
      type: Sequelize.STRING(30)
    });

    // Dados exigidos por algumas condições (ex: pesoAdultoEsperado, semana de lactação)
    await queryInterface.addColumn('formularios_dieteticos', 'detalhes', {
      type: Sequelize.JSONB
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('formularios_dieteticos', 'detalhes');
    await queryInterface.removeColumn('formularios_dieteticos', 'condicao');
  }
};
