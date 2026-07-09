import CryptoJS from 'crypto-js';

const encryptSecretKey = process.env.NEXT_PUBLIC_ENCRYPT_SECRET_KEY || '';
const encryptSecretIv = process.env.NEXT_PUBLIC_ENCRYPT_SECRET_IV || '';
const encryptionMethod = process.env.NEXT_PUBLIC_ENCRYPT_METHOD || 'aes-256-cbc';

const key = CryptoJS.SHA512(encryptSecretKey).toString(CryptoJS.enc.Hex).substring(0, 32);
const encryptionIV = CryptoJS.SHA512(encryptSecretIv).toString(CryptoJS.enc.Hex).substring(0, 16);

export const decryptData = (encryptedData: string): string => {
  try {
    const buff = CryptoJS.enc.Base64.parse(encryptedData);
    const hexStr = buff.toString(CryptoJS.enc.Utf8);

    const decrypted = CryptoJS.AES.decrypt(
      { ciphertext: CryptoJS.enc.Hex.parse(hexStr) } as CryptoJS.lib.CipherParams,
      CryptoJS.enc.Utf8.parse(key),
      {
        iv: CryptoJS.enc.Utf8.parse(encryptionIV),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      }
    );

    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch {
    return '***decryption failed***';
  }
};

void encryptionMethod;
