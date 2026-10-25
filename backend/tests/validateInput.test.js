const {expect, test} = require('@jest/globals');

const { isUndefined, invalidCnpj, invalidPassword, invalidEmail } = require('../src/utils/validateInput');

test('undefined Input', () => {
    expect(isUndefined(undefined)).toBeTruthy()
});

test('valid Input', () => {
    expect(isUndefined('12345')).toBeFalsy()
});

test('undefined passwords', () => {
    expect(invalidPassword(undefined)).toBeTruthy()
});

test('small passwords', () => {
    expect(invalidPassword('Aa1')).toBeTruthy()
});

test('no lowercase passwords', () => {
    expect(invalidPassword('A1234567')).toBeTruthy()
});

test('no uppercase passwords', () => {
    expect(invalidPassword('a1234567')).toBeTruthy()
});

test('white spaces passwords', () => {
    expect(invalidPassword('Aa1234    ')).toBeTruthy()
});

test('valid passwords', () => {
    expect(invalidPassword('Aa123456')).toBeFalsy()
});

test('small cnpj', () => {
    expect(invalidCnpj('12345')).toBeTruthy()
});

test('big cnpj', () => {
    expect(invalidCnpj('12345678901234567890')).toBeTruthy()
});

test('letter in cnpj', () => {
    expect(invalidCnpj('A1234567890123')).toBeTruthy()
});

test('valid cnpj', () => {
    expect(invalidCnpj('12345678912345')).toBeFalsy()
});

test('undefined email', () => {
    expect(invalidEmail(undefined)).toBeTruthy()
});

test('no @ in email', () => {
    expect(invalidEmail('asdkjad')).toBeTruthy()
});

test('valid email', () => {
    expect(invalidEmail('asdasdh@as')).toBeFalsy()
});

const {
    invalidText, invalidMatricula, invalidId, invalidOptionalNumber, invalidDate, normalizeCnpj, normalizeEmail
} = require('../src/utils/validateInput');

test('non-string inputs are invalid instead of throwing', () => {
    expect(invalidPassword(12345678)).toBeTruthy()
    expect(invalidEmail(123)).toBeTruthy()
    expect(invalidCnpj(12345678912345)).toBeTruthy()
    expect(invalidText(5)).toBeTruthy()
});

test('passwords with spaces at the ends are invalid', () => {
    expect(invalidPassword(' Senha1234 ')).toBeTruthy()
});

test('email needs text on both sides of @', () => {
    expect(invalidEmail('@')).toBeTruthy()
    expect(invalidEmail('a @b.com')).toBeTruthy()
    expect(invalidEmail(' user@clinica.com ')).toBeFalsy()
});

test('email is normalized to lowercase', () => {
    expect(normalizeEmail(' User@Clinica.COM ')).toBe('user@clinica.com')
});

test('masked cnpj is accepted and normalized', () => {
    expect(invalidCnpj('12.345.678/0001-90')).toBeFalsy()
    expect(normalizeCnpj('12.345.678/0001-90')).toBe('12345678000190')
    expect(invalidCnpj('!!!!!!!!!!!!!!')).toBeTruthy()
});

test('empty text is invalid', () => {
    expect(invalidText('   ')).toBeTruthy()
    expect(invalidText('Rex')).toBeFalsy()
});

test('matricula has exactly 7 digits', () => {
    expect(invalidMatricula('0012345')).toBeFalsy()
    expect(invalidMatricula('123456')).toBeTruthy()
    expect(invalidMatricula('12345678')).toBeTruthy()
    expect(invalidMatricula('12a4567')).toBeTruthy()
    expect(invalidMatricula(1234567)).toBeTruthy()
});

test('ids are positive integers', () => {
    expect(invalidId('10')).toBeFalsy()
    expect(invalidId(10)).toBeFalsy()
    expect(invalidId('abc')).toBeTruthy()
    expect(invalidId('0')).toBeTruthy()
    expect(invalidId('-1')).toBeTruthy()
    expect(invalidId(undefined)).toBeTruthy()
});

test('optional numbers respect the range', () => {
    expect(invalidOptionalNumber(undefined)).toBeFalsy()
    expect(invalidOptionalNumber('12.5')).toBeFalsy()
    expect(invalidOptionalNumber(-1)).toBeTruthy()
    expect(invalidOptionalNumber(0, { min: 0, allowMin: false })).toBeTruthy()
    expect(invalidOptionalNumber(101, { max: 100 })).toBeTruthy()
    expect(invalidOptionalNumber('abc')).toBeTruthy()
});

test('dates must exist in the calendar', () => {
    expect(invalidDate('2021-03-01')).toBeFalsy()
    expect(invalidDate('2021-02-30')).toBeTruthy()
    expect(invalidDate('31/12/2020')).toBeTruthy()
});
