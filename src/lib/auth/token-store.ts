const STORAGE_KEY = "taskflow.session";

interface PersistedSession {
  sessionId: string;
  refreshToken: string;
}

interface SessionState {
  accessToken: string | null;
  sessionId: string | null;
  refreshToken: string | null;
}

let state: SessionState = {
  accessToken: null,
  sessionId: null,
  refreshToken: null,
};

const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

function readPersisted(): PersistedSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedSession;
  } catch {
    return null;
  }
}

function writePersisted(session: PersistedSession | null) {
  if (typeof window === "undefined") return;
  try {
    if (session) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // localStorage unavailable (private mode, disabled storage) — session
    // simply won't survive a reload, which is an acceptable degradation.
  }
}

export function hydrateFromStorage() {
  const persisted = readPersisted();
  state = {
    ...state,
    sessionId: persisted?.sessionId ?? null,
    refreshToken: persisted?.refreshToken ?? null,
  };
  notify();
}

export function getAccessToken() {
  return state.accessToken;
}

export function getRefreshCredentials() {
  if (!state.sessionId || !state.refreshToken) return null;
  return { sessionId: state.sessionId, refreshToken: state.refreshToken };
}

export function hasPersistedSession() {
  return Boolean(readPersisted());
}

export function setSession(session: {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
}) {
  state = {
    accessToken: session.accessToken,
    sessionId: session.sessionId,
    refreshToken: session.refreshToken,
  };
  writePersisted({
    sessionId: session.sessionId,
    refreshToken: session.refreshToken,
  });
  notify();
}

export function setAccessToken(accessToken: string, refreshToken?: string) {
  state = {
    ...state,
    accessToken,
    refreshToken: refreshToken ?? state.refreshToken,
  };
  if (state.sessionId && state.refreshToken) {
    writePersisted({ sessionId: state.sessionId, refreshToken: state.refreshToken });
  }
  notify();
}

export function clearSession() {
  state = { accessToken: null, sessionId: null, refreshToken: null };
  writePersisted(null);
  notify();
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot() {
  return state;
}
