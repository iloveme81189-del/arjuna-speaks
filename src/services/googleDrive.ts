/**
 * Google Drive Integration Service
 * 
 * Uses Google Identity Services for OAuth 2.0 and Drive API v3 for file operations.
 * 
 * Setup:
 * 1. Go to https://console.cloud.google.com/apis/credentials
 * 2. Create OAuth 2.0 Client ID (Web application)
 * 3. Add authorized origins: https://your-app.vercel.app, http://localhost:5173
 * 4. Enable Google Drive API
 * 5. Set VITE_GOOGLE_CLIENT_ID in Vercel env vars
 */

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

// Google Drive folder IDs for organized uploads
const UPLOADS_FOLDER_ID = import.meta.env.VITE_GOOGLE_DRIVE_UPLOADS_FOLDER_ID || '';
const REPORTS_FOLDER_ID = import.meta.env.VITE_GOOGLE_DRIVE_REPORTS_FOLDER_ID || '';
const DRIVE_API_URL = 'https://www.googleapis.com/drive/v3';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

let tokenClient: any = null;
let accessToken: string | null = null;

export interface GoogleDriveFile {
  id: string;
  name: string;
  webViewLink: string;
  webContentLink?: string;
}

function getGoogleScriptUrl(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).google?.accounts?.oauth2) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(script);
  });
}

async function ensureInitialized(): Promise<void> {
  if (tokenClient) return;
  await getGoogleScriptUrl();
  tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
    client_id: GOOGLE_CLIENT_ID,
    scope: SCOPES,
    callback: (response: any) => {
      if (response.access_token) {
        accessToken = response.access_token;
      }
    },
  });
}

function requestToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      reject(new Error('Google Drive not initialized'));
      return;
    }
    tokenClient.callback = (response: any) => {
      if (response.access_token) {
        accessToken = response.access_token;
        resolve(response.access_token);
      } else {
        reject(new Error(response.error || 'OAuth failed'));
      }
    };
    tokenClient.requestAccessToken();
  });
}

async function getAccessToken(): Promise<string> {
  if (accessToken) return accessToken;
  if (!GOOGLE_CLIENT_ID) {
    throw new Error(
      'Google Drive not configured. Set VITE_GOOGLE_CLIENT_ID in your environment. ' +
      'Get one at https://console.cloud.google.com/apis/credentials'
    );
  }
  await ensureInitialized();
  return requestToken();
}

async function driveApiFetch(
  path: string,
  options: RequestInit = {}
): Promise<any> {
  const token = await getAccessToken();
  const res = await fetch(`${DRIVE_API_URL}${path}`, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Drive API error (${res.status}): ${err}`);
  }
  return res.json();
}

/**
 * Upload a file to Google Drive
 * Uses specific folder IDs for uploads and reports when available.
 * @param file - The file to upload
 * @param folderName - Human-readable folder name (used as fallback if folderId not provided)
 * @param folderId - Optional explicit Google Drive folder ID (overrides folderName)
 */
export async function uploadToDrive(
  file: File,
  folderName: string = 'Arjuna Speaks',
  folderId?: string | null
): Promise<GoogleDriveFile> {
  // If a folderId was explicitly passed, use it directly
  if (!folderId) {
    // Try the configured uploads folder env var first
    if (UPLOADS_FOLDER_ID) {
      try {
        const folder = await driveApiFetch(
          `/files/${UPLOADS_FOLDER_ID}?fields=id,trashed`
        );
        if (folder?.id && !folder?.trashed) {
          folderId = folder.id;
        }
      } catch {
        // Folder doesn't exist, fall through to find/create
      }
    }

    // Fallback to finding/creating folder by name
    if (!folderId) {
      folderId = await findFolder(folderName);
      if (!folderId) {
        folderId = await createFolder(folderName);
      }
    }
  }

  const token = await getAccessToken();
  const metadata = JSON.stringify({
    name: file.name,
    parents: [folderId],
  });

  const form = new FormData();
  form.append('metadata', new Blob([metadata], { type: 'application/json' }));
  form.append('file', file);

  const res = await fetch(
    `${DRIVE_API_URL}/files?uploadType=multipart&fields=id,name,webViewLink`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Drive upload error (${res.status}): ${err}`);
  }

  const data = await res.json();

  // Make file shareable
  await driveApiFetch(`/files/${data.id}/permissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      role: 'reader',
      type: 'anyone',
    }),
  });

  // Get updated webViewLink
  const fileInfo = await driveApiFetch(
    `/files/${data.id}?fields=id,name,webViewLink,webContentLink`
  );

  return {
    id: fileInfo.id,
    name: fileInfo.name,
    webViewLink: fileInfo.webViewLink,
    webContentLink: fileInfo.webContentLink,
  };
}

/**
 * Save a dashboard link to Google Drive reports folder
 */
export async function saveDashboardLinkToDrive(
  title: string,
  dashboardUrl: string,
  description: string = ''
): Promise<GoogleDriveFile> {
  const content = `Dashboard: ${title}\n\nURL: ${dashboardUrl}\n\n${description}\n\nGenerated by Arjuna Speaks`;
  const blob = new Blob([content], { type: 'text/plain' });
  const file = new File([blob], `${title.replace(/[^a-zA-Z0-9]/g, '_')}_dashboard_link.txt`, {
    type: 'text/plain',
  });
  // Use the reports folder ID from env var if configured
  let reportsFolderId: string | null | undefined = undefined;
  if (REPORTS_FOLDER_ID) {
    try {
      const folder = await driveApiFetch(
        `/files/${REPORTS_FOLDER_ID}?fields=id,trashed`
      );
      if (folder?.id && !folder?.trashed) {
        reportsFolderId = folder.id;
      }
    } catch {}
  }
  // Upload to the reports folder — if reportsFolderId is set, it overrides the folder name
  return uploadToDrive(file, 'Arjuna Speaks - Reports', reportsFolderId);
}

/**
 * Create a JSON config file on Drive and return its shareable link
 */
export async function saveDashboardConfigToDrive(
  config: any,
  title: string
): Promise<GoogleDriveFile> {
  const jsonContent = JSON.stringify(config, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const file = new File([blob], `${title.replace(/[^a-zA-Z0-9]/g, '_')}_dashboard.json`, {
    type: 'application/json',
  });
  return uploadToDrive(file, 'Arjuna Speaks - Dashboard Configs');
}

async function findFolder(name: string): Promise<string | null> {
  try {
    const data = await driveApiFetch(
      `/files?q=name='${encodeURIComponent(name)}' and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id,name)`
    );
    return data.files?.[0]?.id || null;
  } catch {
    return null;
  }
}

async function createFolder(name: string): Promise<string> {
  const data = await driveApiFetch('/files?fields=id', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      mimeType: 'application/vnd.google-apps.folder',
    }),
  });
  return data.id;
}

/**
 * Check if Google Drive is configured (has client ID)
 */
export function isDriveConfigured(): boolean {
  return !!GOOGLE_CLIENT_ID;
}

/**
 * Sign out and revoke token
 */
export async function signOut(): Promise<void> {
  if (accessToken) {
    try {
      await fetch(`https://oauth2.googleapis.com/revoke?token=${accessToken}`, {
        method: 'POST',
      });
    } catch {}
    accessToken = null;
  }
  tokenClient = null;
}
