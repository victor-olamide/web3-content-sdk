/**
 * IPFS/Pinata upload utilities for Node.js environments.
 * Requires PINATA_API_KEY and PINATA_SECRET_API_KEY env vars.
 */

import axios, { type AxiosRequestConfig } from 'axios';
import FormData from 'form-data';

const PINATA_API_URL = 'https://api.pinata.cloud';
export const PINATA_GATEWAY = 'https://gateway.pinata.cloud';
const MAX_RETRIES = 3;

export interface IPFSUploadOptions {
  maxRetries?: number;
  metadata?: Record<string, string>;
  tags?: string[];
  apiKey?: string;
  secretApiKey?: string;
}

function pinataHeaders(options: IPFSUploadOptions = {}) {
  return {
    pinata_api_key: options.apiKey ?? process.env['PINATA_API_KEY'] ?? '',
    pinata_secret_api_key: options.secretApiKey ?? process.env['PINATA_SECRET_API_KEY'] ?? '',
  };
}

/**
 * Upload a file buffer to IPFS via Pinata with retry logic.
 * Returns an `ipfs://` URI.
 */
export async function uploadFileToIPFS(
  fileBuffer: Buffer,
  fileName: string,
  options: IPFSUploadOptions = {},
  onProgress?: (percent: number) => void
): Promise<string> {
  const maxRetries = options.maxRetries ?? MAX_RETRIES;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const hash = await _uploadFile(fileBuffer, fileName, options, onProgress);
      return `ipfs://${hash}`;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 2000 * Math.pow(2, attempt - 1)));
      }
    }
  }

  throw new Error(`Failed to upload to IPFS after ${maxRetries} attempts: ${lastError?.message}`);
}

async function _uploadFile(
  fileBuffer: Buffer,
  fileName: string,
  options: IPFSUploadOptions,
  onProgress?: (percent: number) => void
): Promise<string> {
  const formData = new FormData();
  formData.append('file', fileBuffer, { filename: fileName });
  formData.append(
    'pinataMetadata',
    JSON.stringify({
      name: fileName,
      keyvalues: { ...options.metadata, uploadedAt: new Date().toISOString() },
    })
  );
  formData.append(
    'pinataOptions',
    JSON.stringify({ cidVersion: 1, wrapWithDirectory: false })
  );

  const config: AxiosRequestConfig = {
    method: 'post',
    url: `${PINATA_API_URL}/pinning/pinFileToIPFS`,
    data: formData,
    headers: { ...formData.getHeaders(), ...pinataHeaders(options) },
    timeout: 300_000,
    maxContentLength: 100 * 1024 * 1024,
    maxBodyLength: 100 * 1024 * 1024,
  };

  if (onProgress) {
    config.onUploadProgress = (e: { loaded: number; total?: number }) => {
      if (e.total) onProgress(Math.round((e.loaded / e.total) * 100));
    };
  }

  const response = await axios(config);
  if (!response.data?.IpfsHash) throw new Error('Invalid Pinata response: missing IpfsHash');
  return response.data.IpfsHash as string;
}

/**
 * Upload a JSON object to IPFS.
 * Returns an `ipfs://` URI.
 */
export async function uploadMetadataToIPFS(
  metadata: Record<string, unknown>,
  fileName = 'metadata.json',
  options: IPFSUploadOptions = {}
): Promise<string> {
  const buffer = Buffer.from(JSON.stringify(metadata, null, 2));
  return uploadFileToIPFS(buffer, fileName, options);
}

/**
 * Convert an `ipfs://` URI to a gateway HTTP URL.
 */
export function getGatewayUrl(ipfsUrl: string, gateway = PINATA_GATEWAY): string {
  if (!ipfsUrl) return '';
  const hash = ipfsUrl.replace('ipfs://', '').replace('ipfs/', '');
  return `${gateway}/ipfs/${hash}`;
}

/**
 * List all files pinned to your Pinata account.
 */
export async function listPinnedFiles(options: IPFSUploadOptions = {}): Promise<unknown[]> {
  const response = await axios.get(`${PINATA_API_URL}/data/pinList`, {
    headers: pinataHeaders(options),
  });
  return (response.data.rows as unknown[]) ?? [];
}

/**
 * Unpin a file from Pinata by its IPFS hash or `ipfs://` URI.
 */
export async function unpinFile(ipfsHash: string, options: IPFSUploadOptions = {}): Promise<void> {
  const hash = ipfsHash.replace('ipfs://', '').replace('ipfs/', '');
  await axios.delete(`${PINATA_API_URL}/pinning/unpin/${hash}`, {
    headers: pinataHeaders(options),
  });
}

/**
 * Verify that your Pinata API credentials are valid.
 */
export async function verifyPinataCredentials(options: IPFSUploadOptions = {}): Promise<boolean> {
  try {
    const response = await axios.get(`${PINATA_API_URL}/data/testAuthentication`, {
      headers: pinataHeaders(options),
    });
    return response.status === 200;
  } catch {
    return false;
  }
}
