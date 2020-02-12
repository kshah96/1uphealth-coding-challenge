
// Load randomly generated password for symmetric encryption
// TODO: Use more secure algorithms + salting
const crypto = require('crypto');
const crypto_algorithm = 'aes-256-cbc';

// TODO: Is it more secure to store this in a file?
const crypto_password = process.env.ENCRYPTION_PASSWORD

const crypto_hash_algorithm = 'sha256';

function encrypt(data) {
    let crypto_encryption_key = crypto.createCipher(crypto_algorithm, crypto_password);
    let encrypted = crypto_encryption_key.update(data, 'utf8', 'hex')
    encrypted += crypto_encryption_key.final('hex')
    return encrypted
}

function decrypt(data){
    let crypto_decryption_key = crypto.createDecipher(crypto_algorithm, crypto_password);
    let decrypted = crypto_decryption_key.update(data, 'hex', 'utf8')
    decrypted += crypto_decryption_key.final('utf8')
    return decrypted
}

function hash(data){
    return crypto.createHash(algorithm).update(data, 'utf8').digest('hex');
}

exports.encrypt = encrypt;
exports.decrypt = decrypt;
exports.hash = hash;
