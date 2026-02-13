/**
 * Google Drive provider adapter - Mode A (folder link, no OAuth)
 * Admin shares folder with service account; we list files via Drive API
 */

import { google } from 'googleapis';

const IMAGE_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/jpg',
];
const VIDEO_MIMES = [
  'video/mp4',
  'video/quicktime', // mov
  'video/webm',
];

const ALLOWED_MIMES = [...IMAGE_MIMES, ...VIDEO_MIMES];

function getMediaType(mime: string): 'image' | 'video' {
  return mime?.toLowerCase().startsWith('video/') ? 'video' : 'image';
}

export interface DriveFile {
  file_id: string;
  name: string;
  mime_type: string;
  size_bytes?: number;
  thumbnail_url?: string;
  web_view_link?: string;
  media_type: 'image' | 'video';
}

export interface ListFilesResult {
  ok: boolean;
  files: DriveFile[];
  error?: string;
}

function getDriveClient() {
  const key = process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON;
  if (!key) {
    throw new Error('GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON not configured');
  }
  const credentials = typeof key === 'string' ? JSON.parse(key) : key;
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });
  return google.drive({ version: 'v3', auth });
}

/**
 * Extract folder ID from various Google Drive URL formats
 */
export function extractFolderIdFromUrl(folderUrl: string): string | null {
  if (!folderUrl?.trim()) return null;
  const url = folderUrl.trim();

  // https://drive.google.com/drive/folders/FOLDER_ID
  const foldersMatch = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (foldersMatch) return foldersMatch[1];

  // https://drive.google.com/drive/u/0/folders/FOLDER_ID
  const uMatch = url.match(/\/drive\/u\/\d+\/folders\/([a-zA-Z0-9_-]+)/);
  if (uMatch) return uMatch[1];

  // Shared drive: https://drive.google.com/drive/folders/FOLDER_ID
  // Same pattern

  // Just the ID
  if (/^[a-zA-Z0-9_-]{20,}$/.test(url)) return url;

  return null;
}

/**
 * List files in a Drive folder (images + videos only)
 */
export async function listFiles(folderId: string): Promise<ListFilesResult> {
  try {
    const drive = getDriveClient();

    const mimeQuery = ALLOWED_MIMES.map((m) => `mimeType='${m}'`).join(' or ');
    const q = `'${folderId}' in parents and (${mimeQuery}) and trashed = false`;

    const res = await drive.files.list({
      q,
      pageSize: 100,
      fields: 'files(id, name, mimeType, size, thumbnailLink, webViewLink)',
      orderBy: 'name',
    });

    const files: DriveFile[] = (res.data.files || [])
      .filter((f) => f.id && f.mimeType && (f.mimeType.startsWith('image/') || f.mimeType.startsWith('video/')))
      .map((f) => {
        const mime = f.mimeType || '';
        const mediaType = getMediaType(mime);
        return {
          file_id: f.id!,
          name: f.name || 'Untitled',
          mime_type: mime,
          size_bytes: f.size ? parseInt(f.size, 10) : undefined,
          thumbnail_url: f.thumbnailLink || undefined,
          web_view_link: f.webViewLink || undefined,
          media_type: mediaType,
        };
      });

    return { ok: true, files };
  } catch (err: any) {
    console.error('Google Drive listFiles error:', err);
    return {
      ok: false,
      files: [],
      error: err.message || 'Failed to list folder',
    };
  }
}

/**
 * Get playable/preview URL for an image (Drive export view)
 */
export function getImageUrl(fileId: string): string {
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
}

/**
 * Get thumbnail URL - use Drive's thumbnail or construct one
 */
export function getThumbnailUrl(fileId: string, existingThumbnail?: string): string {
  if (existingThumbnail) return existingThumbnail;
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;
}

/**
 * Get video preview URL - Drive embed (iframe fallback)
 */
export function getVideoPreviewUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

/**
 * Get direct stream URL for video (may require auth for private files)
 */
export function getVideoStreamUrl(fileId: string): string {
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

/**
 * Extract file ID from Drive URL (preview, uc export, thumbnail)
 */
export function extractFileIdFromUrl(url: string): string | null {
  if (!url?.includes('drive.google.com')) return null;
  // /file/d/FILE_ID/preview
  const previewMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (previewMatch) return previewMatch[1];
  // uc?export=view&id=FILE_ID or thumbnail?id=FILE_ID
  const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch) return idMatch[1];
  return null;
}

/**
 * Check if a Drive file is accessible (service account can read metadata)
 */
export async function checkFileAccessible(fileId: string): Promise<boolean> {
  try {
    const drive = getDriveClient();
    await drive.files.get({ fileId, fields: 'id' });
    return true;
  } catch {
    return false;
  }
}
