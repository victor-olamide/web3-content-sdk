/**
 * Encryption utilities for Web3 content monetization.
 * Client-safe helpers — no Node.js crypto required.
 */

export const ENCRYPTION_CONFIG = {
  algorithm: 'aes-256-gcm',
  keyLength: 32,
  ivLength: 12,
  tagLength: 16,
} as const;

export function isValidHex(str: string): boolean {
  return /^[0-9a-f]*$/i.test(str);
}

export function stringToHex(str: string): string {
  let hex = '';
  for (let i = 0; i < str.length; i++) {
    hex += str.charCodeAt(i).toString(16).padStart(2, '0');
  }
  return hex;
}

export function hexToString(hex: string): string {
  let str = '';
  for (let i = 0; i < hex.length; i += 2) {
    str += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16));
  }
  return str;
}

export interface EncryptedContent {
  encryptedData: string;
  iv: string;
  authTag: string;
}

export function isValidEncryptedContent(content: unknown): content is EncryptedContent {
  if (!content || typeof content !== 'object') return false;
  const c = content as Record<string, unknown>;
  return (
    typeof c.encryptedData === 'string' &&
    typeof c.iv === 'string' &&
    typeof c.authTag === 'string' &&
    isValidHex(c.encryptedData) &&
    isValidHex(c.iv) &&
    isValidHex(c.authTag)
  );
}

export function formatExpirationDate(expiresAt: string): string {
  const date = new Date(expiresAt);
  const now = new Date();
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'Expired';
  if (diffDays === 0) return 'Expires today';
  if (diffDays === 1) return 'Expires tomorrow';
  if (diffDays <= 7) return `Expires in ${diffDays} days`;
  return `Expires on ${date.toLocaleDateString()}`;
}

export function isContentAccessValid(expiresAt: string): boolean {
  return new Date(expiresAt) > new Date();
}

export function getAccessStatusText(
  isActive: boolean,
  isExpired: boolean,
  isRevoked: boolean
): string {
  if (isRevoked) return 'Revoked';
  if (!isActive || isExpired) return 'Expired';
  return 'Active';
}

/**
 * API client for server-side encryption endpoints.
 */
export class EncryptionAPIService {
  private apiBase: string;
  private getToken: () => string | null;

  constructor(apiBase: string, getToken: () => string | null = () => null) {
    this.apiBase = apiBase.replace(/\/$/, '');
    this.getToken = getToken;
  }

  private headers(): HeadersInit {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  async encryptContent(
    contentId: string,
    contentUrl: string,
    contentType: string,
    expiresInDays = 30
  ): Promise<{ id: string; contentId: string; expiresAt: string }> {
    const res = await fetch(`${this.apiBase}/api/encryption/encrypt-content`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ contentId, contentUrl, contentType, expiresIn: expiresInDays * 86400 }),
    });
    if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to encrypt content');
    return (await res.json()).data;
  }

  async decryptContent(contentId: string): Promise<{
    contentUrl: string;
    accessAttempts: number;
    expiresAt: string;
  }> {
    const res = await fetch(`${this.apiBase}/api/encryption/decrypt-content/${contentId}`, {
      method: 'POST',
      headers: this.headers(),
    });
    if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to decrypt content');
    return (await res.json()).data;
  }

  async getContentStatus(contentId: string): Promise<{
    isActive: boolean;
    isExpired: boolean;
    isRevoked: boolean;
    expiresAt: string;
  }> {
    const res = await fetch(`${this.apiBase}/api/encryption/content-status/${contentId}`, {
      headers: this.headers(),
    });
    if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to get content status');
    return (await res.json()).data;
  }

  async revokeAccess(contentId: string): Promise<{ revokedCount: number }> {
    const res = await fetch(`${this.apiBase}/api/encryption/revoke-access/${contentId}`, {
      method: 'PUT',
      headers: this.headers(),
    });
    if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to revoke access');
    return (await res.json()).data;
  }

  async extendAccess(
    contentId: string,
    additionalDays: number
  ): Promise<{ contentId: string; newExpiresAt: string }> {
    const res = await fetch(`${this.apiBase}/api/encryption/extend-access/${contentId}`, {
      method: 'PUT',
      headers: this.headers(),
      body: JSON.stringify({ additionalSeconds: additionalDays * 86400 }),
    });
    if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to extend access');
    return (await res.json()).data;
  }
}
