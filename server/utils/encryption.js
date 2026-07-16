const crypto = require('crypto');

const algorithm = 'aes-256-cbc';

// Safely generate a 32-byte key buffer from environment variable or default legacy key
let keyRaw = process.env.ENCRYPTION_KEY || '00000000000000000000000000000000';
if (keyRaw.length !== 32) {
    keyRaw = keyRaw.padEnd(32, '0').slice(0, 32);
}
const key = Buffer.from(keyRaw, 'utf8');

const encrypt = (text) => {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
};

const decrypt = (text) => {
    if (!text || !text.includes(':')) return text;

    const tryDecrypt = (cipherText, decryptKey) => {
        const [ivHex, encryptedText] = cipherText.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        const decipher = crypto.createDecipheriv(algorithm, decryptKey, iv);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    };

    try {
        return tryDecrypt(text, key);
    } catch (err) {
        // Fallback key
        const defaultKey = Buffer.from('00000000000000000000000000000000', 'utf8');
        if (key.equals(defaultKey)) {
            console.error('Decryption failed:', err.message);
            return '[Encrypted Message]';
        }
        try {
            return tryDecrypt(text, defaultKey);
        } catch (fallbackErr) {
            console.error('Decryption failed with both primary and fallback keys:', fallbackErr.message);
            return '[Encrypted Message]';
        }
    }
};

module.exports = { encrypt, decrypt };
