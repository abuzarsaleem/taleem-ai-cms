import { Injectable } from '@nestjs/common';
import {
  constants,
  generateKeyPairSync,
  privateDecrypt,
  createPrivateKey,
  createPublicKey,
} from 'crypto';
import { BusinessException } from '../../common/exceptions';

type KeyPair = {
  publicKeyPem: string;
  privateKeyPem: string;
};

@Injectable()
export class PasswordCryptoService {
  private readonly keyPair: KeyPair = this.loadOrGenerateKeyPair();

  decryptPassword(ciphertext: string): string {
    try {
      const decrypted = privateDecrypt(
        {
          key: this.keyPair.privateKeyPem,
          padding: constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256',
        },
        Buffer.from(ciphertext, 'base64'),
      ).toString('utf8');

      if (!decrypted) {
        throw new Error('Empty decrypted password');
      }

      return decrypted;
    } catch {
      throw new BusinessException(
        'Password decryption failed',
        400,
        'PASSWORD_DECRYPTION_FAILED',
      );
    }
  }

  private loadOrGenerateKeyPair(): KeyPair {
    const privateKeyPem = this.normalizePem(process.env.PASSWORD_PRIVATE_KEY);
    const publicKeyPem = this.normalizePem(process.env.PASSWORD_PUBLIC_KEY);

    if (privateKeyPem && publicKeyPem) {
      // Validate the pair early so app fails fast on bad config.
      createPrivateKey(privateKeyPem);
      createPublicKey(publicKeyPem);
      return { privateKeyPem, publicKeyPem };
    }

    const { privateKey, publicKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });

    return {
      privateKeyPem: privateKey,
      publicKeyPem: publicKey,
    };
  }

  private normalizePem(value?: string): string | undefined {
    const trimmed = value?.trim();
    if (!trimmed) return undefined;
    return trimmed.replace(/\\n/g, '\n');
  }
}

