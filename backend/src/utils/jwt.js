require('dotenv').config();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const secretKey = process.env.SECRETKEY || crypto.randomBytes(32).toString('hex');
if (!process.env.SECRETKEY) {
    process.env.SECRETKEY = secretKey;
}

const createToken = (user) => {
    return jwt.sign({ id: user.id, clinicaId: user.clinic_id, role: user.role, email: user.email }, secretKey, {expiresIn: '7 days'});
}

const getSubjectFromToken = (token) => {
    return jwt.verify(token, secretKey);
}

module.exports = { createToken, getSubjectFromToken };
