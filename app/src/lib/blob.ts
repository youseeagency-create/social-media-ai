// Helpers for validating that a URL is one of our own Vercel Blob objects.
// Used to prevent SSRF (server-side fetch of arbitrary URLs) and cross-tenant
// blob access when a client supplies a blob URL.

export function isVercelBlobUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && u.hostname.endsWith(".blob.vercel-storage.com");
  } catch {
    return false;
  }
}

// True only for a Vercel Blob URL whose path is scoped to this workspace.
// All our uploads embed the workspace id in the path (e.g. analysis/<ws>/...,
// footage/<ws>/..., notes/<ws>/...), so this blocks referencing another
// workspace's blob.
export function isOwnWorkspaceBlobUrl(url: string, workspaceId: string): boolean {
  try {
    const u = new URL(url);
    return isVercelBlobUrl(url) && u.pathname.includes(`/${workspaceId}/`);
  } catch {
    return false;
  }
}
