"""
Notification models for PayLoop.

Tracks push notifications sent to users via Firebase Cloud Messaging.
Each record represents one notification attempt.
"""

import uuid

from django.conf import settings
from django.db import models


class Notification(models.Model):
    """
    A notification sent to a user via Firebase Cloud Messaging (FCM).

    Lifecycle:
        1. Created with status='pending' when the notification is queued.
        2. Updated to 'sent' after successful FCM delivery.
        3. Updated to 'failed' if FCM delivery fails.
    """

    class NotificationType(models.TextChoices):
        CONTRIBUTION_REMINDER = "contribution_reminder", "Contribution Reminder"
        LOAN_REQUEST = "loan_request", "Loan Request"
        LOAN_APPROVED = "loan_approved", "Loan Approved"
        LOAN_REJECTED = "loan_rejected", "Loan Rejected"
        LOAN_DISBURSED = "loan_disbursed", "Loan Disbursed"
        PAYMENT_RECEIVED = "payment_received", "Payment Received"
        MEMBER_ADDED = "member_added", "Member Added"
        SCORE_UPDATED = "score_updated", "Score Updated"
        GENERAL = "general", "General"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        SENT = "sent", "Sent"
        FAILED = "failed", "Failed"

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
        help_text="The user this notification was sent to.",
    )
    notification_type = models.CharField(
        max_length=30,
        choices=NotificationType.choices,
        default=NotificationType.GENERAL,
        help_text="Category of this notification.",
    )
    title = models.CharField(
        max_length=200,
        help_text="Notification title (shown in push notification).",
    )
    body = models.TextField(
        help_text="Notification body text.",
    )
    data = models.JSONField(
        blank=True,
        null=True,
        help_text="Optional JSON payload (e.g. loan_id, circle_id).",
    )
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.PENDING,
        help_text="Delivery status of this notification.",
    )
    fcm_message_id = models.CharField(
        max_length=200,
        blank=True,
        default="",
        help_text="FCM message ID (populated after successful send).",
    )
    error_message = models.TextField(
        blank=True,
        default="",
        help_text="Error details if delivery failed.",
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="When this notification was created.",
    )

    class Meta:
        verbose_name = "notification"
        verbose_name_plural = "notifications"
        ordering = ["-created_at"]

    def __str__(self):
        return f"[{self.notification_type}] {self.title} → {self.user}"
