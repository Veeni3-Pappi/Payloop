"""
Custom user manager for wallet-based authentication.

PayLoop uses Ethereum wallet addresses as the sole user identifier.
No passwords are stored — authentication is done via signature verification.
"""

from django.contrib.auth.models import BaseUserManager


class WalletUserManager(BaseUserManager):
    """
    Custom manager for User model where wallet_address is the unique
    identifier and no password is required.
    """

    def create_user(self, wallet_address, **extra_fields):
        """
        Create and return a regular user with the given wallet address.

        Args:
            wallet_address: Ethereum wallet address (0x-prefixed, 42 chars).
            **extra_fields: Additional fields to set on the user.

        Returns:
            User instance.

        Raises:
            ValueError: If wallet_address is not provided.
        """
        if not wallet_address:
            raise ValueError("A wallet address is required to create a user.")

        # Normalize to lowercase for consistent lookups (EIP-55 mixed-case
        # addresses should still match).
        wallet_address = wallet_address.lower()

        user = self.model(wallet_address=wallet_address, **extra_fields)
        user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, wallet_address, **extra_fields):
        """
        Create and return a superuser with the given wallet address.

        Superusers get is_staff=True and is_superuser=True automatically.
        """
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(wallet_address, **extra_fields)
