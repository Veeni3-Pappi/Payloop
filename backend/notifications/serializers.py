"""
DRF serializers for the notifications app.
"""

from rest_framework import serializers

from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    """Read-only serializer for notification records."""

    class Meta:
        model = Notification
        fields = [
            "id",
            "notification_type",
            "title",
            "body",
            "data",
            "status",
            "created_at",
        ]
        read_only_fields = fields
