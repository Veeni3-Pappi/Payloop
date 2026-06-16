"""
Custom User model for PayLoop.

Uses Ethereum wallet address as the primary identifier instead of
username/email. Passwords are not used — authentication is handled
via cryptographic signature verification on the frontend.
"""

from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models

from .managers import WalletUserManager


class User(AbstractBaseUser, PermissionsMixin):
    """
    Custom user model where the Ethereum wallet address is the unique
    identifier for authentication.

    Fields:
        wallet_address: 42-char Ethereum address (0x + 40 hex chars).
        display_name:   Optional human-readable name chosen by the user.
        phone_number:   Optional phone for M-Pesa integration / notifications.
        fcm_token:      Firebase Cloud Messaging token for push notifications.
        is_active:      Soft-delete / account suspension flag.
        is_staff:       Required by Django admin.
        created_at:     Timestamp of account creation.
    """

    wallet_address = models.CharField(
        max_length=42,
        unique=True,
        db_index=True,
        help_text="Ethereum wallet address (0x-prefixed, 42 characters).",
    )
    display_name = models.CharField(
        max_length=100,
        blank=True,
        default="",
        help_text="Optional display name for the user.",
    )
    phone_number = models.CharField(
        max_length=20,
        blank=True,
        default="",
        help_text="Phone number for M-Pesa and SMS notifications.",
    )
    fcm_token = models.CharField(
        max_length=500,
        blank=True,
        default="",
        help_text="Firebase Cloud Messaging token for push notifications.",
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this user account is active.",
    )
    is_staff = models.BooleanField(
        default=False,
        help_text="Whether the user can access the Django admin site.",
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Timestamp when the account was created.",
    )

    objects = WalletUserManager()

    USERNAME_FIELD = "wallet_address"
    REQUIRED_FIELDS = []  # wallet_address is already required as USERNAME_FIELD

    class Meta:
        verbose_name = "user"
        verbose_name_plural = "users"
        ordering = ["-created_at"]

    def __str__(self):
        """Return a truncated wallet address for readability (0x1234...abcd)."""
        addr = self.wallet_address
        if len(addr) > 10:
            return f"{addr[:6]}...{addr[-4:]}"
        return addr
