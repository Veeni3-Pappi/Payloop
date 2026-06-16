"""
DRF serializers for the circles app.

Handles serialization / validation for Circle, Membership,
Contribution, and LoanRequest models.  The LoanRequest serializer
exposes ``borrower_wallet`` (read-only) so the frontend can display
the borrower's address without a nested user object.
"""

from rest_framework import serializers

from accounts.models import User

from .models import Circle, Contribution, LoanRequest, Membership


# ------------------------------------------------------------------
# Lightweight user serializer (used as nested representation)
# ------------------------------------------------------------------

class UserSerializer(serializers.ModelSerializer):
    """Minimal user representation for membership lists."""

    class Meta:
        model = User
        fields = ["wallet_address", "display_name"]
        read_only_fields = fields


# ------------------------------------------------------------------
# Circle
# ------------------------------------------------------------------

class CircleSerializer(serializers.ModelSerializer):
    """
    Full circle representation.
    ``id`` and ``created_at`` are server-generated and therefore read-only.
    """

    class Meta:
        model = Circle
        fields = [
            "id",
            "name",
            "contract_address",
            "admin_wallet",
            "contribution_amount",
            "contribution_frequency",
            "is_active",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


# ------------------------------------------------------------------
# Membership
# ------------------------------------------------------------------

class MembershipSerializer(serializers.ModelSerializer):
    """
    Membership with a nested read-only user representation so the
    frontend can render member lists without extra API calls.
    """

    user = UserSerializer(read_only=True)

    class Meta:
        model = Membership
        fields = ["id", "circle", "user", "role", "joined_at"]
        read_only_fields = ["id", "joined_at"]


# ------------------------------------------------------------------
# Contribution
# ------------------------------------------------------------------

class ContributionSerializer(serializers.ModelSerializer):
    """Serializes contribution records (all fields exposed)."""

    class Meta:
        model = Contribution
        fields = [
            "id",
            "circle",
            "user",
            "amount",
            "tx_hash",
            "payment_method",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


# ------------------------------------------------------------------
# Loan Request
# ------------------------------------------------------------------

class LoanRequestSerializer(serializers.ModelSerializer):
    """
    Loan request serializer.

    ``borrower_wallet`` is a read-only convenience field that exposes
    the borrower's wallet address directly on the payload — matching
    the shape the frontend expects.

    Server-controlled fields (``id``, ``status``, ``on_chain_loan_id``,
    ``created_at``) are read-only so clients cannot tamper with them.
    """

    borrower_wallet = serializers.CharField(
        source="borrower.wallet_address",
        read_only=True,
        help_text="Wallet address of the borrower (read-only).",
    )

    class Meta:
        model = LoanRequest
        fields = [
            "id",
            "circle",
            "borrower",
            "borrower_wallet",
            "amount_matic",
            "reason",
            "repayment_days",
            "status",
            "on_chain_loan_id",
            "created_at",
        ]
        read_only_fields = ["id", "status", "on_chain_loan_id", "created_at"]
