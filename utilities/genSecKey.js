//// GENEREATE SEC KEY
const crypto = require('crypto');

const generateSecretKey = () => {
  const length = 32; // 32 bytes = 256 bits
  return crypto.randomBytes(length).toString('hex');
};

const secretKey = generateSecretKey();
console.log('Generated Secret Key:', secretKey);