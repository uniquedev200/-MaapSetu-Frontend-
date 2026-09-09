import axios from 'axios';

// The base URL can be injected via environment variables in production
// E.g., inside .env file: VITE_API_BASE_URL=https://api.yourdomain.com/v1
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

// Origin only (scheme + host), used to build absolute URLs for stored files
// (pdf_url / qr_code_url come back as /api/v1/public/file/... paths).
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/v1\/?$/, '');

// Stored-file URL resolver: DB rows hold either API-relative paths
// (/api/v1/public/file/...) or absolute Supabase CDN URLs (when storage is
// remote). Return absolute URLs as-is, prefix everything else with API_ORIGIN.
export const resolveFileUrl = (url?: string | null): string | null => {
  if (!url) return null;
  return /^https?:\/\//i.test(url) ? url : API_ORIGIN + url;
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Interceptor to inject JWT authentication token
api.interceptors.request.use((config) => {
  const session = localStorage.getItem('lm_session');
  if (session) {
    try {
      const parsedSession = JSON.parse(session);
      // If your backend returns an actual JWT token, adjust this payload structure
      if (parsedSession.token) {
        config.headers.Authorization = `Bearer ${parsedSession.token}`;
      }
    } catch (error) {
      console.error("Error parsing session token", error);
    }
  }
  return config;
});

// Interceptor to handle global errors (e.g., 401 Unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access (e.g., trigger a logout or token refresh)
      console.error('Unauthorized! Token may be expired.');
    }
    return Promise.reject(error);
  }
);

/* =========================================
   API Resource Methods
   ========================================= */

// Instruments
export const fetchInstruments = async () => {
  const response = await api.get('/instruments');
  return response.data;
};

export const createInstrument = async (data: any) => {
  const response = await api.post('/instruments', data);
  return response.data;
};

// Verification Applications
export const fetchApplications = async () => {
  const response = await api.get('/verification');
  return response.data;
};

export const createVerification = async (data: any) => {
  const response = await api.post('/verification', data);
  return response.data;
};

export const cancelVerification = async (id: string) => {
  const response = await api.post(`/verification/${id}/cancel`);
  return response.data;
};

export const approveVerification = async (id: string) => {
  const response = await api.post(`/verification/${id}/approve`, {});
  return response.data;
};

export const scheduleVerification = async (id: string, data: any) => {
  const response = await api.post(`/verification/${id}/schedule`, data);
  return response.data;
};

export const fetchApplicationDetails = async (id: string) => {
  const response = await api.get(`/verification/${id}`);
  return response.data;
};

// Dashboard
export const fetchDashboardMetrics = async () => {
  const response = await api.get('/dashboard/metrics');
  return response.data;
};

// Inspections
export const fetchInspections = async () => {
  const response = await api.get('/inspections');
  return response.data;
};

export const submitInspectionFindings = async (appId: string, data: any) => {
  const response = await api.post(`/verification/${appId}/inspect`, data);
  return response.data;
};

// Certificates
export const fetchCertificates = async () => {
  const response = await api.get('/certificates');
  return response.data;
};

export const fetchCertificateDetails = async (id: string) => {
  const response = await api.get(`/certificates/${id}`);
  return response.data;
};

export const verifyCertificate = async (id: string) => {
  const response = await api.get(`/certificates/${id}/verify`);
  return response.data;
};

export const downloadCertificatePdf = async (id: string): Promise<Blob> => {
  const response = await api.get(`/certificates/${id}/pdf`, { responseType: 'blob' });
  return response.data;
};

// Audit & Administration
export const fetchAuditLogs = async () => {
  const response = await api.get('/audit-logs');
  return response.data;
};

export const fetchBusinessProfile = async () => {
  const response = await api.get('/business/profile');
  return response.data;
};

export const updateBusinessProfile = async (data: any) => {
  const response = await api.patch('/business/profile', data);
  return response.data;
};

export const fetchSettings = async () => {
  const response = await api.get('/settings');
  return response.data;
};

export const updateSettings = async (data: any) => {
  const response = await api.patch('/settings', data);
  return response.data;
};

export const changePassword = async (data: any) => {
  const response = await api.post('/auth/change-password', data);
  return response.data;
};

// Authentication (To be wired up in AuthContext)
export const loginApi = async (credentials: any) => {
  const response = await api.post('/auth/login', credentials);
  return response.data;
};

export const signupApi = async (userData: any) => {
  const response = await api.post('/auth/signup', userData);
  return response.data;
};

// Certificate public verification (CONSUMER role — no auth).
export const publicCertificateVerify = async (id: string) => {
  const response = await axios.get(`${API_BASE_URL}/public/certificate/${id}`);
  return response.data;
};

// File upload (officer evidence / inspector photos).
export const uploadFile = async (file: File): Promise<{ path: string, url: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/uploads', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

// Admin: candidate officers + workload for auto-assign.
export const fetchAssignOptions = async (id: string) => {
  const response = await api.get(`/verification/${id}/assign-options`);
  return response.data;
};

// Admin: demo tamper simulation on a certificate & its restore.
export const tamperCertificate = async (id: string) => {
  const response = await api.post(`/certificates/${id}/tamper`);
  return response.data;
};

export const restoreCertificate = async (id: string) => {
  const response = await api.post(`/certificates/${id}/restore`);
  return response.data;
};

// AI onboarding assistant (BUSINESS helper). The server proxies to Groq; the
// key never leaves the backend. guide (optional) tells the widget which
// on-screen control to highlight via its data-help attribute.
export interface AssistantGuide {
  target: string | null;
  steps: string[];
}

export interface AssistantChatResponse {
  reply: string;
  guide: AssistantGuide | null;
}

export const assistantChat = async (data: {
  message: string;
  history: { role: 'user' | 'assistant'; content: string }[];
  lang: string;
}): Promise<AssistantChatResponse> => {
  const response = await api.post('/assistant/chat', data);
  return response.data;
};

// Google Maps navigation link for a premises location.
export const mapsLink = (location: string, district?: string) => {
  const parts = [location, district].filter(Boolean);
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(parts.join(', '))}`;
};

export default api;
