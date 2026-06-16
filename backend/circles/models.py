"""
Circle models for PayLoop.

Defines the core data structures for savings circles:
- Circle:       A group of users pooling funds together.
- Membership:   Associates a user with a circle and tracks their role.
- Contribution: Records each payment made by a member into a circle.
- LoanRequest:  Tracks loan requests, approval flow, and on-chain state.
"""

import uuid

from django.conf import settings
from django.db import models


class Circle(models.Model):
    """
    A savings circle (chama) where members contribute funds on a
    regular schedule and can request micro-loans from the pool.

    The optional ``contract_address`` is populated once the circle
    is deployed on-chain (Polygon Amoy testnet).
    """

    FREQUENCY_CHOICES = [
        ("weekly", "Weekly"),
        ("biweekly", "Biweekly"),
        ("monthly", "Monthly"),
    ]

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text="Unique identifier for the circle.",
    )
    name = models.CharField(
        max_length=150,
        help_text="Human-readable name for the circle.",
    )
    contract_address = models.CharField(
        max_length=42,
        blank=True,
        default="",
        help_text="On-chain contract address (populated after deployment).",
    )
    admin_wallet = models.CharField(
        max_length=42,
        help_text="Wallet address of the circle administrator.",
    )
    contribution_amount = models.DecimalField(
        max_digits=18,
        decimal_places=2,
        help_text="Required contribution amount per period.",
    )
    contribution_frequency = models.CharField(
        max_length=10,
        choices=FREQUENCY_CHOICES,
        default="monthly",
        help_text="How often members must contribute.",
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether the circle is currently accepting contributions.",
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Timestamp when the circle was created.",
    )

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "circle"
        verbose_name_plural = "circles"

    def __str__(self):
        return self.name


class Membership(models.Model):
    """
    Links a user to a circle with a specific role.
    Each user can only belong to a given circle once.
    """

    ROLE_CHOICES = [
        ("member", "Member"),
        ("admin", "Admin"),
    ]

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    circle = models.ForeignKey(
        Circle,
        on_delete=models.CASCADE,
        related_name="memberships",
        help_text="The circle this membership belongs to.",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="memberships",
        help_text="The user who is a member of the circle.",
    )
    role = models.CharField(
        max_length=10,
        choices=ROLE_CHOICES,
        default="member",
        help_text="Role of the user within the circle.",
    )
    joined_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Timestamp when the user joined the circle.",
    )

    class Meta:
        unique_together = ("circle", "user")
        ordering = ["-joined_at"]
        verbose_name = "membership"
        verbose_name_plural = "memberships"

    def __str__(self):
        return f"{self.user} → {self.circle} ({self.role})"


class Contribution(models.Model):
    """
    Records a single payment made by a member into a circle's pool.
    Supports both on-chain crypto payments and M-Pesa off-ramp payments.
    """

    PAYMENT_METHOD_CHOICES = [
        ("crypto", "Crypto"),
        ("mpesa", "M-Pesa"),
    ]

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    circle = models.ForeignKey(
        Circle,
        on_delete=models.CASCADE,
        related_name="contributions",
        help_text="The circle this contribution belongs to.",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="contributions",
        help_text="The user who made the contribution.",
    )
    amount = models.DecimalField(
        max_digits=18,
        decimal_places=2,
        help_text="Amount contributed.",
    )
    tx_hash = models.CharField(
        max_length=66,
        blank=True,
        default="",
        help_text="On-chain transaction hash (for crypto payments).",
    )
    payment_method = models.CharField(
        max_length=10,
        choices=PAYMENT_METHOD_CHOICES,
        default="crypto",
        help_text="How the contribution was paid.",
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Timestamp when the contribution was recorded.",
    )

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "contribution"
        verbose_name_plural = "contributions"

    def __str__(self):
        return f"{self.user} → {self.circle}: {self.amount}"


class LoanRequest(models.Model):
    """
    A request by a circle member to borrow funds from the pool.
    Tracks the full lifecycle: pending → approved/rejected → disbursed → repaid.
    """

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
        ("disbursed", "Disbursed"),
        ("repaid", "Repaid"),
    ]

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    circle = models.ForeignKey(
        Circle,
        on_delete=models.CASCADE,
        related_name="loan_requests",
        help_text="The circle this loan request belongs to.",
    )
    borrower = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="loan_requests",
        help_text="The user requesting the loan.",
    )
    amount_matic = models.DecimalField(
        max_digits=18,
        decimal_places=4,
        help_text="Requested loan amount in MATIC.",
    )
    reason = models.TextField(
        help_text="Reason / justification for the loan request.",
    )
    repayment_days = models.IntegerField(
        help_text="Number of days the borrower has to repay the loan.",
    )
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default="pending",
        help_text="Current status of the loan request.",
    )
    on_chain_loan_id = models.IntegerField(
        null=True,
        blank=True,
        help_text="Loan ID on the smart contract (set after disbursement).",
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Timestamp when the loan request was created.",
    )

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "loan request"
        verbose_name_plural = "loan requests"

    def __str__(self):
        return f"Loan #{self.id} by {self.borrower} ({self.status})"
