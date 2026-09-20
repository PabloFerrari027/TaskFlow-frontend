// Shared Google Identity Services (GIS) plumbing — one `declare global` so
// every consumer of `useGoogleIdentityToken` shares a single `Window.google`.
export const GOOGLE_IDENTITY_SCRIPT_SRC = "https://accounts.google.com/gsi/client";
export const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleAccountsId {
  initialize: (config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
  }) => void;
  renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } };
  }
}
