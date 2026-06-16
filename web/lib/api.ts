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

// ── Circles ────────────────────────────────────────────────

export async function getCircles(token: string) {
  return apiFetch<Circle[]>("/api/circles/", { token });
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
  return apiFetch<Circle>("/api/circles/", {
    method: "POST",
    body: data as unknown as Record<string, unknown>,
    token,
  });
}

export async function getCircleDetail(id: string, token: string) {
  return apiFetch<Circle>(`/api/circles/${id}/`, { token });
}

export async function addMember(
  circleId: string,
  walletAddress: string,
  token: string
) {
  return apiFetch(`/api/circles/${circleId}/members/`, {
    method: "POST",
    body: { wallet_address: walletAddress },
    token,
  });
}

// ── Loans ──────────────────────────────────────────────────

export async function getLoans(circleId: string, token: string) {
  return apiFetch<LoanRequest[]>(`/api/circles/${circleId}/loans/`, { token });
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
  return apiFetch<{ checkout_request_id: string; response_description: string }>(
    "/api/mpesa/stkpush/",
    {
      method: "POST",
      body: data as unknown as Record<string, unknown>,
      token,
    }
  );
}

// ── Types ──────────────────────────────────────────────────

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

export interface LoanRequest {
  id: string;
  circle: string;
  borrower_wallet: string;
  amount_matic: string;
  reason: string;
  repayment_days: number;
  status: string;
  on_chain_loan_id: number | null;
  created_at: string;
}
