import { decode, encode } from 'base64-arraybuffer';

// Taken from https://github.com/bradyjoslin/encrypt-workers-kv/blob/c59524edc77b4e60a49f721e90620d1d8261513e/src/index.ts#L103

const enc = new TextEncoder();
const dec = new TextDecoder();

const getPasswordKey = (password: string): PromiseLike<CryptoKey> =>
  crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, [
    'deriveKey',
  ]);

const deriveKey = (
  passwordKey: CryptoKey,
  salt: Uint8Array,
  keyUsage: CryptoKey['usages'],
  iterations: number = 10000,
): PromiseLike<CryptoKey> =>
  crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: iterations,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    keyUsage,
  );

export async function encryptData(
  secretData: string,
  password: string,
  iterations: number = 10000,
): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const passwordKey = await getPasswordKey(password);
  const aesKey = await deriveKey(passwordKey, salt, ['encrypt'], iterations);
  const encryptedContent = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    aesKey,
    enc.encode(secretData),
  );

  const encryptedContentArr = new Uint8Array(encryptedContent);
  let iterationsArr = new Uint8Array(enc.encode(iterations.toString()));

  let buff = new Uint8Array(
    iterationsArr.byteLength +
      salt.byteLength +
      iv.byteLength +
      encryptedContentArr.byteLength,
  );
  let bytes = 0;
  buff.set(iterationsArr, bytes);
  buff.set(salt, (bytes += iterationsArr.byteLength));
  buff.set(iv, (bytes += salt.byteLength));
  buff.set(encryptedContentArr, (bytes += iv.byteLength));

  return encode(buff.buffer);
}

export async function decryptData(
  encryptedData: string,
  password: string,
): Promise<string> {
  const encryptedDataBuff = new Uint8Array(decode(encryptedData));

  let bytes = 0;
  const iterations = Number(
    dec.decode(encryptedDataBuff.slice(bytes, (bytes += 5))),
  );

  const salt = new Uint8Array(encryptedDataBuff.slice(bytes, (bytes += 16)));
  const iv = new Uint8Array(encryptedDataBuff.slice(bytes, (bytes += 12)));
  const data = new Uint8Array(encryptedDataBuff.slice(bytes));

  const passwordKey = await getPasswordKey(password);
  const aesKey = await deriveKey(passwordKey, salt, ['decrypt'], iterations);
  const decryptedContent = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    aesKey,
    data,
  );
  return dec.decode(decryptedContent);
}
