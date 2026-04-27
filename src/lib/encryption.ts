import CryptoJS from 'crypto-js';

// IMPORTANTE: En producción, esto debe venir de variables de entorno
// y ser diferente por usuario/organización
const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'ZeroPaper2024SecureKey!#$%';

/**
 * Cifra un string en base64 usando AES-256
 */
export function encryptData(data: string): string {
    try {
        const encrypted = CryptoJS.AES.encrypt(data, ENCRYPTION_KEY);
        return encrypted.toString();
    } catch (error) {
        console.error('Error encrypting data:', error);
        throw new Error('Failed to encrypt data');
    }
}

/**
 * Descifra un string cifrado
 */
export function decryptData(encryptedData: string): string {
    if (!encryptedData) return '';
    
    // If it looks like a plain URL, don't even try to decrypt
    if (encryptedData.startsWith('/') || encryptedData.startsWith('http')) {
        return encryptedData;
    }

    try {
        const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);

        if (!decrypted) {
            // If it's not a plain URL but decryption failed, it might be a malformed 
            // string or something else we should just return as-is for safety in this context
            return encryptedData;
        }

        return decrypted;
    } catch (error) {
        // Fallback to original data for robustness
        return encryptedData;
    }
}

/**
 * Cifra un archivo File a base64 cifrado
 */
export async function encryptFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            try {
                const base64Data = reader.result as string;
                const encrypted = encryptData(base64Data);
                resolve(encrypted);
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

/**
 * Descifra datos cifrados y los convierte a URL de datos
 */
export function decryptToDataUrl(encryptedData: string): string {
    try {
        return decryptData(encryptedData);
    } catch (error) {
        console.error('Error decrypting to data URL:', error);
        // Retornar un placeholder en caso de error
        return 'data:text/plain;base64,RXJyb3I6IEFyY2hpdm8gbm8gZGlzcG9uaWJsZQ==';
    }
}

/**
 * Genera un hash seguro para verificar integridad
 */
export function generateFileHash(data: string): string {
    return CryptoJS.SHA256(data).toString();
}

/**
 * Verifica la integridad de un archivo
 */
export function verifyFileIntegrity(data: string, hash: string): boolean {
    const computedHash = generateFileHash(data);
    return computedHash === hash;
}
