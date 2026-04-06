const defaultDevApiBaseUrl = "http://localhost:5000/api";
const configuredApiBaseUrl =
  import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, "") || "";

export const apiBaseUrl =
  configuredApiBaseUrl || (import.meta.env.DEV ? defaultDevApiBaseUrl : "");

export const hasApiBaseUrl = Boolean(apiBaseUrl);

export const apiV1BaseUrl = hasApiBaseUrl ? `${apiBaseUrl}/v1` : "";

export const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() || "";

export const isGoogleAuthConfigured = Boolean(googleClientId);

export const googleConfigMessage =
  "Google login is not configured. Set VITE_GOOGLE_CLIENT_ID in frontend/.env and use the same client ID in backend/.env.";

export const apiUnavailableMessage = hasApiBaseUrl
  ? `Cannot reach the API at ${apiBaseUrl}. Check that the backend is running and VITE_API_URL points to the correct URL.`
  : "API base URL is not configured. Set VITE_API_URL to your deployed backend API URL before building the frontend.";

const normalizePath = (path = "") => `/${String(path).replace(/^\/+/, "")}`;

export const getApiUrl = (path = "") => {
  if (!hasApiBaseUrl) {
    throw new Error(apiUnavailableMessage);
  }

  return `${apiBaseUrl}${normalizePath(path)}`;
};

export const getApiV1Url = (path = "") => getApiUrl(`/v1${normalizePath(path)}`);
