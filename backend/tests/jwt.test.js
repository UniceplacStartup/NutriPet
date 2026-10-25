const User = require('../src/models/User');
const {expect, test} = require('@jest/globals');

const { createToken, getSubjectFromToken } = require('../src/utils/jwt');

test('create token', () => {
    const user = new User.User('1', '2', '3', '4', '5');
    expect(createToken(user)).toContain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.');
});
test('get subject from token', () => {
    const user = new User.User('1', '2', '3', '4', '5');
    const token = createToken(user);
    const subject = getSubjectFromToken(token); 
    // O token não carrega o nome, só id, clínica, papel e e-mail
    expect(subject.email).toBe('3');
    expect(subject.role).toBe('4');
});
