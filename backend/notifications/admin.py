"""
Django admin configuration for the notifications app.
"""

from django.contrib import admin

from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("user", "notification_type", "title", "status", "created_at")
    list_filter = ("notification_type", "status", "created_at")
    search_fields = ("user__wallet_address", "title", "body")
    readonly_fields = ("id", "created_at")
