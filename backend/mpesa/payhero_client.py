"""
PayHero M-Pesa aggregator client for PayLoop.

PayHero simplifies M-Pesa integration by handling STK Push,
callbacks, and reconciliation via a clean REST API.
No need for direct Daraja credentials or ngrok tunnels.

Environment variables required:
    PAYHERO_API_USERNAME   -- PayHero Basic Auth username
    PAYHERO_API_PASSWORD   -- PayHero Basic Auth password
    PAYHERO_CHANNEL_ID     -- Your M-Pesa channel ID from dashboard
    PAYHERO_CALLBACK_URL   -- Public URL for payment status callbacks
"""

import logging
import os

import requests

logger = logging.getLogger(__name__)

BASE_URL = "https://backend.payhero.co.ke/api/v2"


class PayHeroError(Exception):
    """Raised when the PayHero API returns an unexpected response."""


class PayHeroClient:
    """
    Client for the PayHero M-Pesa STK Push API.

    Usage::

        client = PayHeroClient()
        response = client.stk_push(
            phone_number="0712345678",
            amount=100,
            reference="CIRCLE-001",
        )
    """

    def __init__(self):
        self.username = os.environ.get("PAYHERO_API_USERNAME", "")
        self.password = os.environ.get("PAYHERO_API_PASSWORD", "")
        self.channel_id = os.environ.get("PAYHERO_CHANNEL_ID", "")
        self.callback_url = os.environ.get("PAYHERO_CALLBACK_URL", "")

    def _auth(self) -> tuple:
        """Return Basic Auth credentials tuple."""
        return (self.username, self.password)

    def stk_push(
        self,
        phone_number: str,
        amount: int | float,
        reference: str = "PayLoop",
        customer_name: str = "",
    ) -> dict:
        """
        Initiate an M-Pesa STK Push via PayHero.

        Args:
            phone_number:   Phone number (format 07XXXXXXXX or 2547XXXXXXXX).
            amount:         Amount in KES (integer).
            reference:      External reference / order ID.
            customer_name:  Optional customer name.

        Returns:
            Dict with reference, status, and checkout details.

        Raises:
            PayHeroError: If the request fails.
        """
        url = f"{BASE_URL}/payments"

        payload = {
            "amount": int(amount),
            "phone_number": phone_number,
            "channel_id": int(self.channel_id) if self.channel_id else 0,
            "provider": "m-pesa",
            "external_reference": reference[:50],
            "callback_url": self.callback_url,
        }

        if customer_name:
            payload["customer_name"] = customer_name

        try:
            response = requests.post(
                url, json=payload, auth=self._auth(), timeout=30
            )
            response.raise_for_status()
            data = response.json()

            logger.info(
                "PayHero STK Push initiated for %s, KES %s: %s",
                phone_number, amount, data.get("status", ""),
            )
            return data

        except requests.RequestException as exc:
            logger.error("PayHero STK Push failed: %s", exc)
            raise PayHeroError(f"STK Push request failed: {exc}") from exc

    def check_status(self, reference: str) -> dict:
        """
        Check the status of a payment by external reference.

        Args:
            reference: The external_reference used in stk_push().

        Returns:
            Dict with status (QUEUED, PENDING, SUCCESS, FAILED, etc).
        """
        url = f"{BASE_URL}/payments"

        params = {"external_reference": reference}

        try:
            response = requests.get(
                url, params=params, auth=self._auth(), timeout=30
            )
            response.raise_for_status()
            return response.json()

        except requests.RequestException as exc:
            logger.error("PayHero status check failed: %s", exc)
            raise PayHeroError(f"Status check failed: {exc}") from exc
