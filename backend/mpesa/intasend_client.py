"""
IntaSend M-Pesa aggregator client for PayLoop.

IntaSend simplifies M-Pesa integration by handling STK Push,
callbacks, and reconciliation. No need for direct Daraja API
credentials or ngrok tunnels.

Environment variables required:
    INTASEND_PUBLISHABLE_KEY  -- IntaSend publishable API key
    INTASEND_SECRET_KEY       -- IntaSend secret API key
    INTASEND_ENV              -- "sandbox" (default) or "production"
"""

import logging
import os

import requests

logger = logging.getLogger(__name__)

_SANDBOX_URL = "https://sandbox.intasend.com/api/v1"
_PRODUCTION_URL = "https://payment.intasend.com/api/v1"


class IntaSendError(Exception):
    """Raised when the IntaSend API returns an unexpected response."""


class IntaSendClient:
    """
    Client for the IntaSend M-Pesa STK Push API.

    Usage::

        client = IntaSendClient()
        response = client.stk_push(
            phone_number="254712345678",
            amount=100,
            narrative="Monthly chama contribution",
        )
    """

    def __init__(self):
        self.publishable_key = os.environ.get("INTASEND_PUBLISHABLE_KEY", "")
        self.secret_key = os.environ.get("INTASEND_SECRET_KEY", "")
        self.env = os.environ.get("INTASEND_ENV", "sandbox").lower()

    def _get_base_url(self) -> str:
        """Return the IntaSend base URL for the configured environment."""
        if self.env == "production":
            return _PRODUCTION_URL
        return _SANDBOX_URL

    def _headers(self) -> dict:
        """Return authorization headers."""
        return {
            "Authorization": f"Bearer {self.secret_key}",
            "Content-Type": "application/json",
        }

    def stk_push(
        self,
        phone_number: str,
        amount: int | float,
        narrative: str = "PayLoop contribution",
    ) -> dict:
        """
        Initiate an M-Pesa STK Push via IntaSend.

        Args:
            phone_number:  Phone number (format 2547XXXXXXXX).
            amount:        Amount in KES.
            narrative:     Short description shown on STK prompt.

        Returns:
            Dict with invoice_id, state, and other metadata.

        Raises:
            IntaSendError: If the request fails.
        """
        url = f"{self._get_base_url()}/payment/mpesa-stk-push/"

        payload = {
            "phone_number": phone_number,
            "amount": int(amount),
            "narrative": narrative[:20],
            "currency": "KES",
        }

        try:
            response = requests.post(
                url, json=payload, headers=self._headers(), timeout=30
            )
            response.raise_for_status()
            data = response.json()

            logger.info(
                "IntaSend STK Push initiated for %s, KES %s: %s",
                phone_number, amount, data.get("state", ""),
            )
            return data

        except requests.RequestException as exc:
            logger.error("IntaSend STK Push failed: %s", exc)
            raise IntaSendError(f"STK Push request failed: {exc}") from exc

    def check_payment_status(self, invoice_id: str) -> dict:
        """
        Check the status of a payment by invoice ID.

        Args:
            invoice_id: The invoice_id returned from stk_push().

        Returns:
            Dict with state (PENDING, PROCESSING, COMPLETE, FAILED).
        """
        url = f"{self._get_base_url()}/payment/status/"

        payload = {"invoice_id": invoice_id}

        try:
            response = requests.post(
                url, json=payload, headers=self._headers(), timeout=30
            )
            response.raise_for_status()
            return response.json()

        except requests.RequestException as exc:
            logger.error("IntaSend status check failed: %s", exc)
            raise IntaSendError(f"Status check failed: {exc}") from exc
