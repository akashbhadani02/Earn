const crypto = require('crypto');

// Encrypt student login passwords so Admin can recover them when a student
// forgets them, without storing the password as plain text in MongoDB.
const SECRET = String(process.env.CREDENTIAL_ENCRYPTION_KEY || process.env.JWT_SECRET || 'change-this-secret');
const KEY = crypto.createHash('sha256').update(SECRET).digest();

function encryptPassword(password) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
    const encrypted = Buffer.concat([cipher.update(String(password), 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `v1:${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
}

function decryptPassword(value) {
    if (!value || typeof value !== 'string') return '';
    try {
        const [version, ivB64, tagB64, dataB64] = value.split(':');
        if (version !== 'v1' || !ivB64 || !tagB64 || !dataB64) return '';
        const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, Buffer.from(ivB64, 'base64'));
        decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
        return Buffer.concat([
            decipher.update(Buffer.from(dataB64, 'base64')),
            decipher.final()
        ]).toString('utf8');
    } catch (_) {
        return '';
    }
}

function generateTemporaryPassword(length = 8) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    const bytes = crypto.randomBytes(length);
    let out = '';
    for (let i = 0; i < length; i++) out += chars[bytes[i] % chars.length];
    return out;
}

module.exports = { encryptPassword, decryptPassword, generateTemporaryPassword };
