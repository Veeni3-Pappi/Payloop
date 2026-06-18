"""
Django admin configuration for the accounts app.
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Custom admin for the wallet-based User model."""

    list_display = ("wallet_address", "display_name", "phone_number", "is_active", "created_at")
    list_filter = ("is_active", "is_staff", "created_at")
    search_fields = ("wallet_address", "display_name", "phone_number")
    ordering = ("-created_at",)

    fieldsets = (
        (None, {"fields": ("wallet_address",)}),
        ("Profile", {"fields": ("display_name", "phone_number", "fcm_token")}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
    )
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("wallet_address", "is_active", "is_staff"),
        }),
    )

    # No password fields since we use wallet-based auth
    readonly_fields = ("created_at",)
