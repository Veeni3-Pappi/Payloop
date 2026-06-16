"""
M-Pesa payment models for PayLoop.

Tracks STK Push transactions initiated via the Safaricom Daraja API.
Each record maps to one STK Push request and is updated when the
callback arrives from Safaricom.
"""

import uuid

from django.conf import settings
from django.db import models


class MpesaPayment(models.Model):
    """
    Represents a single M-Pesa STK Push payment.

    Lifecycle:
        1. Created with status='pending' when the STK Push is initiated.
        2. Updated to 'completed' or 'failed' when the Daraja callback fires.

    The checkout_request_id is indexed because it is the key used by
    the callback to locate the corresponding payment record.
    """

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        COMPLETED = "completed", "Completed"
        FAILED = "failed", "Failed"

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text="Unique identifier for this payment record.",
    )
    phone_number = models.CharField(
        max_length=20,
        help_text="Phone number that received the STK Push prompt (e.g. 2547XXXXXXXX).",
    )
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text="Amount in KES requested via STK Push.",
    )

    # --- Relationships ---------------------------------------------------
    circle = models.ForeignKey(
        "circles.Circle",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="mpesa_payments",
        help_text="The savings circle this payment is associated with.",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="mpesa_payments",
        help_text="The PayLoop user who initiated this payment.",
    )

    # --- Daraja request identifiers --------------------------------------
    merchant_request_id = models.CharField(
        max_length=100,
        help_text="MerchantRequestID returned by Daraja on STK Push initiation.",
    )
    checkout_request_id = models.CharField(
        max_length=100,
        db_index=True,
        help_text="CheckoutRequestID returned by Daraja — used to match callbacks.",
    )

    # --- Daraja callback results -----------------------------------------
    result_code = models.IntegerField(
        null=True,
        blank=True,
        help_text="ResultCode from Daraja callback (0 = success).",
    )
    result_description = models.TextField(
        blank=True,
        default="",
        help_text="Human-readable result description from Daraja.",
    )
    mpesa_receipt_number = models.CharField(
        max_length=50,
        blank=True,
        default="",
        help_text="M-Pesa transaction receipt number (populated on success).",
    )
    transaction_date = models.CharField(
        max_length=30,
        blank=True,
        default="",
        help_text="Transaction timestamp string from Daraja callback.",
    )

    # --- Status tracking -------------------------------------------------
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.PENDING,
        help_text="Current status of this payment.",
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="When this payment record was created.",
    )

    class Meta:
        verbose_name = "M-Pesa payment"
        verbose_name_plural = "M-Pesa payments"
        ordering = ["-created_at"]

    def __str__(self):
        return (
            f"MpesaPayment({self.phone_number}, "
            f"KES {self.amount}, "
            f"status={self.status})"
        )
