"""
DRF serializers for the M-Pesa app.

StkPushSerializer validates incoming STK Push requests from the frontend.
MpesaPaymentSerializer serializes payment records for API responses.
"""

from rest_framework import serializers

from .models import MpesaPayment


class StkPushSerializer(serializers.Serializer):
    """
    Validates the payload for initiating an STK Push.

    Expected request body::

        {
            "phone_number": "254712345678",
            "amount": "500.00",
            "circle_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
            "wallet_address": "0x1234...abcd"
        }
    """

    phone_number = serializers.CharField(
        max_length=20,
        help_text="Phone number in international format (e.g. 254712345678).",
    )
    amount = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text="Payment amount in KES.",
    )
    circle_id = serializers.UUIDField(
        help_text="UUID of the circle this contribution belongs to.",
    )
    wallet_address = serializers.CharField(
        max_length=42,
        help_text="Ethereum wallet address of the payer.",
    )

    def validate_phone_number(self, value):
        """Ensure phone number starts with 254 and is digits only."""
        cleaned = value.strip().replace("+", "")
        if not cleaned.isdigit():
            raise serializers.ValidationError(
                "Phone number must contain only digits."
            )
        if not cleaned.startswith("254"):
            raise serializers.ValidationError(
                "Phone number must start with 254 (Kenyan country code)."
            )
        if len(cleaned) != 12:
            raise serializers.ValidationError(
                "Phone number must be 12 digits (e.g. 254712345678)."
            )
        return cleaned

    def validate_amount(self, value):
        """Ensure amount is a positive number >= 1 KES."""
        if value < 1:
            raise serializers.ValidationError(
                "Amount must be at least 1 KES."
            )
        return value


class MpesaPaymentSerializer(serializers.ModelSerializer):
    """
    Read-only serializer for MpesaPayment records.

    Used in API responses to return payment details to the frontend.
    """

    class Meta:
        model = MpesaPayment
        fields = [
            "id",
            "phone_number",
            "amount",
            "circle",
            "user",
            "merchant_request_id",
            "checkout_request_id",
            "result_code",
            "result_description",
            "mpesa_receipt_number",
            "transaction_date",
            "status",
            "created_at",
        ]
        read_only_fields = fields
