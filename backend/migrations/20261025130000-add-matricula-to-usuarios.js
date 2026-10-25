'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Matrícula da faculdade (7 dígitos) exigida no cadastro público de admin
    await queryInterface.addColumn('usuarios', 'matricula', {
      type: Sequelize.STRING(7)
    });

    // Uma conta por matrícula; usuários criados pelo admin ficam com NULL
    await queryInterface.addConstraint('usuarios', {
      fields: ['matricula'],
      type: 'unique',
      name: 'usuarios_matricula_key'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeConstraint('usuarios', 'usuarios_matricula_key');
    await queryInterface.removeColumn('usuarios', 'matricula');
  }
};
