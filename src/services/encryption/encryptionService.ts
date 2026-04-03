// ============================================================
// Rakshya v3.0 — End-to-End Encryption Service
// Uses TweetNaCl (X25519 + XSalsa20-Poly1305) for asymmetric encryption.
// Private key is stored in device SecureStore and never leaves the device.
// ============================================================

import nacl from 'tweetnacl';
import {
  decodeBase64,
  decodeUTF8,
  encodeBase64,
  encodeUTF8,
} from 'tweetnacl-util';
import * as SecureStore from 'expo-secure-store';
import { ENCRYPTION_CONFIG } from '../../constants';
import type { EncryptedPayload, KeyPair } from '../../types';

/**
 * Generate a new X25519 keypair and persist the private key in SecureStore.
 * Returns the keypair (both keys as Base64 strings).
 */
export async function generateKeyPair(): Promise<KeyPair> {
  const kp = nacl.box.keyPair();
  const publicKey = encodeBase64(kp.publicKey);
  const secretKey = encodeBase64(kp.secretKey);

  await SecureStore.setItemAsync(
    ENCRYPTION_CONFIG.SECURE_STORE_PRIVATE_KEY,
    secretKey,
  );
  await SecureStore.setItemAsync(
    ENCRYPTION_CONFIG.SECURE_STORE_PUBLIC_KEY,
    publicKey,
  );

  return { publicKey, secretKey };
}

/**
 * Load existing keypair from SecureStore.
 * Returns null if no keypair exists (first launch).
 */
export async function loadKeyPair(): Promise<KeyPair | null> {
  const secretKey = await SecureStore.getItemAsync(
    ENCRYPTION_CONFIG.SECURE_STORE_PRIVATE_KEY,
  );
  const publicKey = await SecureStore.getItemAsync(
    ENCRYPTION_CONFIG.SECURE_STORE_PUBLIC_KEY,
  );

  if (!secretKey || !publicKey) return null;
  return { publicKey, secretKey };
}

/**
 * Get or create the user's keypair.
 */
export async function getOrCreateKeyPair(): Promise<KeyPair> {
  const existing = await loadKeyPair();
  if (existing) return existing;
  return generateKeyPair();
}

/**
 * Encrypt a plaintext string for a specific recipient using their public key.
 * Uses NaCl box (X25519 + XSalsa20-Poly1305).
 */
export async function encrypt(
  plaintext: string,
  recipientPublicKeyBase64: string,
): Promise<EncryptedPayload> {
  const keyPair = await getOrCreateKeyPair();
  const senderSecretKey = decodeBase64(keyPair.secretKey);
  const recipientPublicKey = decodeBase64(recipientPublicKeyBase64);

  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const messageBytes = decodeUTF8(plaintext);

  const ciphertext = nacl.box(
    messageBytes,
    nonce,
    recipientPublicKey,
    senderSecretKey,
  );

  if (!ciphertext) {
    throw new Error('Encryption failed');
  }

  return {
    nonce: encodeBase64(nonce),
    ciphertext: encodeBase64(ciphertext),
    senderPublicKey: keyPair.publicKey,
  };
}

/**
 * Decrypt an encrypted payload using our private key and the sender's public key.
 */
export async function decrypt(
  payload: EncryptedPayload,
): Promise<string> {
  const keyPair = await getOrCreateKeyPair();
  const receiverSecretKey = decodeBase64(keyPair.secretKey);
  const senderPublicKey = decodeBase64(payload.senderPublicKey);
  const nonce = decodeBase64(payload.nonce);
  const ciphertext = decodeBase64(payload.ciphertext);

  const decrypted = nacl.box.open(
    ciphertext,
    nonce,
    senderPublicKey,
    receiverSecretKey,
  );

  if (!decrypted) {
    throw new Error('Decryption failed — invalid key or tampered data');
  }

  return encodeUTF8(decrypted);
}

/**
 * Encrypt binary data (e.g. video/audio chunk) for a recipient.
 * Returns base64-encoded encrypted data and nonce.
 */
export async function encryptBinary(
  data: Uint8Array,
  recipientPublicKeyBase64: string,
): Promise<{ nonce: string; ciphertext: string; senderPublicKey: string }> {
  const keyPair = await getOrCreateKeyPair();
  const senderSecretKey = decodeBase64(keyPair.secretKey);
  const recipientPublicKey = decodeBase64(recipientPublicKeyBase64);

  const nonce = nacl.randomBytes(nacl.box.nonceLength);

  const ciphertext = nacl.box(
    data,
    nonce,
    recipientPublicKey,
    senderSecretKey,
  );

  if (!ciphertext) {
    throw new Error('Binary encryption failed');
  }

  return {
    nonce: encodeBase64(nonce),
    ciphertext: encodeBase64(ciphertext),
    senderPublicKey: keyPair.publicKey,
  };
}
