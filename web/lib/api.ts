// ═══════════════════════════════════════════════════════════
// PayLoop — Backend API Utility
// Centralised fetch wrapper for Django REST Framework endpoints
// ═══════════════════════════════════════════════════════════

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface ApiOptions {
  method?: string;
  body?: Record<string, unknown>;
  token?: string;
}

async function apiFetch<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { method = "GET", body, token } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(error.detail || `API Error ${res.status}`);
  }

  return res.json();
}

// DRF has PageNumberPagination enabled, so list endpoints return
// { count, next, previous, results: [...] } rather than a bare array.
// This helper tolerates both shapes and always yields an array.
async function apiFetchList<T>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T[]> {
  const data = await apiFetch<T[] | { results: T[] }>(endpoint, options);
  if (Array.isArray(data)) return data;
  if (data && Array.isArray((data as { results?: T[] }).results)) {
    return (data as { results: T[] }).results;
  }
  return [];
}

// ── Auth ───────────────────────────────────────────────────

export async function verifyWallet(
  walletAddress: string,
  signature: string,
  message: string
) {
  return apiFetch<{ access_token: string; refresh_token: string }>(
    "/api/auth/verify-wallet/",
    {
      method: "POST",
      body: { wallet_address: walletAddress, signature, message },
    }
  );
}

// ── User Profile ───────────────────────────────────────────

export async function getProfile(token: string) {
  return apiFetch<UserProfile>("/api/auth/profile/", { token });
}

export async function updateProfile(
  data: { display_name?: string; phone_number?: string; fcm_token?: string },
  token: string
) {
  return apiFetch<UserProfile & { updated_fields: string[] }>(
    "/api/auth/profile/",
    {
      method: "PATCH",
      body: data as unknown as Record<string, unknown>,
      token,
    }
  );
}

// ── Circles ────────────────────────────────────────────────

export async function getCircles(token: string) {
  return apiFetchList<Circle>("/api/circles/circles/", { token });
}

export async function createCircle(
  data: {
    name: string;
    contribution_amount: number;
    contribution_frequency: string;
    contract_address?: string;
    admin_wallet: string;
  },
  token: string
) {
  return apiFetch<Circle>("/api/circles/circles/", {
    method: "POST",
    body: data as unknown as Record<string, unknown>,
    token,
  });
}

export async function getCircleDetail(id: string, token: string) {
  return apiFetch<Circle>(`/api/circles/circles/${id}/`, { token });
}

// ── Members ────────────────────────────────────────────────

export async function getMembers(circleId: string, token: string) {
  return apiFetchList<MembershipData>(
    `/api/circles/circles/${circleId}/members/`,
    { token }
  );
}

export async function addMember(
  circleId: string,
  walletAddress: string,
  token: string
) {
  return apiFetch<MembershipData>(
    `/api/circles/circles/${circleId}/members/`,
    {
      method: "POST",
      body: { wallet_address: walletAddress },
      token,
    }
  );
}

// ── Loans ──────────────────────────────────────────────────

export async function getLoans(circleId: string, token: string) {
  return apiFetchList<LoanRequest>(
    `/api/circles/circles/${circleId}/loans/`,
    { token }
  );
}

export async function createLoan(
  circleId: string,
  data: {
    amount_matic: string;
    reason: string;
    repayment_days: number;
  },
  token: string
) {
  return apiFetch<LoanRequest>(
    `/api/circles/circles/${circleId}/loans/`,
    {
      method: "POST",
      body: data as unknown as Record<string, unknown>,
      token,
    }
  );
}

export async function voteLoan(
  circleId: string,
  loanId: string,
  approve: boolean,
  token: string
) {
  return apiFetch<{ detail: string; loan_id: string; status: string }>(
    `/api/circles/circles/${circleId}/loans/${loanId}/vote/`,
    {
      method: "POST",
      body: { approve },
      token,
    }
  );
}

// ── Contributions ──────────────────────────────────────────

export async function getContributions(circleId: string, token: string) {
  return apiFetchList<ContributionData>(
    `/api/circles/circles/${circleId}/contributions/`,
    { token }
  );
}

// ── Credit Score ───────────────────────────────────────────

export async function getCreditScore(wallet: string) {
  return apiFetch<{ score: number; breakdown: Record<string, number> }>(
    `/api/score/${wallet}/`
  );
}

// ── M-Pesa ─────────────────────────────────────────────────

export async function initiateStkPush(
  data: {
    phone_number: string;
    amount: number;
    circle_id: string;
    wallet_address: string;
  },
  token: string
) {
  return apiFetch<{
    payment_id: string;
    reference: string;
    checkout_request_id: string;
    status: string;
    message: string;
  }>(
    "/api/mpesa/stkpush/",
    {
      method: "POST",
      body: data as unknown as Record<string, unknown>,
      token,
    }
  );
}

// ── Notifications ──────────────────────────────────────────

export async function getNotifications(token: string, unreadOnly = false) {
  const query = unreadOnly ? "?unread=true" : "";
  return apiFetchList<NotificationData>(
    `/api/notifications/${query}`,
    { token }
  );
}

export async function markNotificationRead(id: string, token: string) {
  return apiFetch<{ detail: string }>(
    `/api/notifications/${id}/read/`,
    { method: "PATCH", token }
  );
}

export async function markAllNotificationsRead(token: string) {
  return apiFetch<{ detail: string }>(
    "/api/notifications/read-all/",
    { method: "PATCH", token }
  );
}

// ── Types ──────────────────────────────────────────────────

export interface UserProfile {
  wallet_address: string;
  display_name: string;
  phone_number: string;
  created_at: string;
}

export interface Circle {
  id: string;
  name: string;
  contract_address: string;
  admin_wallet: string;
  contribution_amount: string;
  contribution_frequency: string;
  is_active: boolean;
  created_at: string;
}

export interface MembershipData {
  id: string;
  circle: string;
  user: {
    wallet_address: string;
    display_name: string;
  };
  role: string;
  joined_at: string;
}

export interface LoanRequest {
  id: string;
  circle: string;
  borrower: number;
  borrower_wallet: string;
  amount_matic: string;
  reason: string;
  repayment_days: number;
  status: string;
  on_chain_loan_id: number | null;
  created_at: string;
}

export interface ContributionData {
  id: string;
  circle: string;
  user: number;
  amount: string;
  tx_hash: string;
  payment_method: string;
  created_at: string;
}

export interface NotificationData {
  id: string;
  notification_type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  status: string;
  created_at: string;
}
