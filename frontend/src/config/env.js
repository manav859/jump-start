const defaultApiBaseUrl = "http://localhost:5000/api";

export const apiBaseUrl =
  import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, "") ||
  defaultApiBaseUrl;

export const apiV1BaseUrl = `${apiBaseUrl}/v1`;

export const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() || "";

export const isGoogleAuthConfigured = Boolean(googleClientId);

export const googleConfigMessage =
  "Google login is not configured. Set VITE_GOOGLE_CLIENT_ID in frontend/.env and use the same client ID in backend/.env.";

export const apiUnavailableMessage = `Cannot reach the API at ${apiBaseUrl}. Check that the backend is running and VITE_API_URL points to the correct port.`;
