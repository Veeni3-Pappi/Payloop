"""
Safaricom Daraja API client for M-Pesa STK Push.

This module encapsulates all HTTP communication with the Daraja API.
Configuration is read from environment variables so the client can
be used in both sandbox and production environments without code changes.

Environment variables required:
    MPESA_CONSUMER_KEY      – Daraja app consumer key
    MPESA_CONSUMER_SECRET   – Daraja app consumer secret
    MPESA_SHORTCODE         – Business shortcode (paybill / till)
    MPESA_PASSKEY           – Online passkey from Daraja portal
    MPESA_CALLBACK_URL      – Public URL Safaricom will POST callback to
    MPESA_ENV               – "sandbox" (default) or "production"
"""

import base64
import logging
import os
from datetime import datetime

import requests

logger = logging.getLogger(__name__)

# Daraja base URLs
_SANDBOX_URL = "https://sandbox.safaricom.co.ke"
_PRODUCTION_URL = "https://api.safaricom.co.ke"


class DarajaClientError(Exception):
    """Raised when the Daraja API returns an unexpected response."""


class DarajaClient:
    """
    Client for the Safaricom Daraja M-Pesa API.

    Usage::

        client = DarajaClient()
        response = client.stk_push(
            phone_number="254712345678",
            amount=100,
            account_reference="CIRCLE-001",
            transaction_desc="Monthly contribution",
        )
    """

    def __init__(self):
        self.consumer_key = os.environ.get("MPESA_CONSUMER_KEY", "")
        self.consumer_secret = os.environ.get("MPESA_CONSUMER_SECRET", "")
        self.shortcode = os.environ.get("MPESA_SHORTCODE", "")
        self.passkey = os.environ.get("MPESA_PASSKEY", "")
        self.callback_url = os.environ.get("MPESA_CALLBACK_URL", "")
        self.env = os.environ.get("MPESA_ENV", "sandbox").lower()

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _get_base_url(self) -> str:
        """Return the Daraja base URL for the configured environment."""
        if self.env == "production":
            return _PRODUCTION_URL
        return _SANDBOX_URL

    def _get_timestamp(self) -> str:
        """
        Return the current timestamp formatted for Daraja (YYYYMMDDHHmmss).

        Example: ``20260616120000``
        """
        return datetime.now().strftime("%Y%m%d%H%M%S")

    def _generate_password(self) -> str:
        """
        Generate the base64-encoded password required by the STK Push API.

        Formula: base64(shortcode + passkey + timestamp)
        """
        timestamp = self._get_timestamp()
        raw = f"{self.shortcode}{self.passkey}{timestamp}"
        return base64.b64encode(raw.encode("utf-8")).decode("utf-8")

    # ------------------------------------------------------------------
    # OAuth
    # ------------------------------------------------------------------

    def get_access_token(self) -> str:
        """
        Fetch an OAuth access token from the Daraja API.

        Returns:
            The access token string.

        Raises:
            DarajaClientError: If the token request fails.
        """
        url = f"{self._get_base_url()}/oauth/v1/generate?grant_type=client_credentials"

        try:
            response = requests.get(
                url,
                auth=(self.consumer_key, self.consumer_secret),
                timeout=30,
            )
            response.raise_for_status()
            data = response.json()
            access_token = data.get("access_token")
            if not access_token:
                raise DarajaClientError(
                    f"No access_token in Daraja response: {data}"
                )
            return access_token

        except requests.RequestException as exc:
            logger.error("Failed to get Daraja access token: %s", exc)
            raise DarajaClientError(
                f"Failed to obtain Daraja access token: {exc}"
            ) from exc

    # ------------------------------------------------------------------
    # STK Push
    # ------------------------------------------------------------------

    def stk_push(
        self,
        phone_number: str,
        amount: int | float,
        account_reference: str,
        transaction_desc: str,
    ) -> dict:
        """
        Initiate an M-Pesa STK Push (Lipa Na M-Pesa Online).

        Args:
            phone_number:      Phone number to prompt, format 2547XXXXXXXX.
            amount:            Amount in KES (will be cast to int for Daraja).
            account_reference: Short reference shown on the STK prompt.
            transaction_desc:  Description of the transaction.

        Returns:
            Dict with keys like MerchantRequestID, CheckoutRequestID,
            ResponseCode, ResponseDescription, CustomerMessage.

        Raises:
            DarajaClientError: If the request fails or Daraja returns an error.
        """
        access_token = self.get_access_token()
        timestamp = self._get_timestamp()
        password = self._generate_password()

        url = (
            f"{self._get_base_url()}"
            "/mpesa/stkpush/v1/processrequest"
        )

        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        }

        payload = {
            "BusinessShortCode": self.shortcode,
            "Password": password,
            "Timestamp": timestamp,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": int(amount),
            "PartyA": phone_number,
            "PartyB": self.shortcode,
            "PhoneNumber": phone_number,
            "CallBackURL": self.callback_url,
            "AccountReference": account_reference[:12],  # Max 12 chars
            "TransactionDesc": transaction_desc[:13],     # Max 13 chars
        }

        try:
            response = requests.post(
                url, json=payload, headers=headers, timeout=30
            )
            response.raise_for_status()
            data = response.json()

            logger.info(
                "STK Push initiated for %s, amount KES %s: %s",
                phone_number,
                amount,
                data.get("ResponseDescription", ""),
            )
            return data

        except requests.RequestException as exc:
            logger.error("STK Push request failed: %s", exc)
            raise DarajaClientError(
                f"STK Push request failed: {exc}"
            ) from exc
