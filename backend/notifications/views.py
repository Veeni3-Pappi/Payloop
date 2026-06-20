"""
Views for the notifications app.

Provides:
- list_notifications  — GET all notifications for the authenticated user.
- mark_read           — PATCH to mark a notification as read (sent).
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Notification
from .serializers import NotificationSerializer


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_notifications(request):
    """
    List all notifications for the authenticated user.

    **GET** ``/api/notifications/``

    Query parameters:
        - ``unread`` (optional): set to ``true`` to only return pending notifications.

    Returns a list of ``Notification`` objects ordered by most recent first.
    """
    qs = Notification.objects.filter(user=request.user)

    if request.query_params.get("unread", "").lower() == "true":
        qs = qs.filter(status=Notification.Status.PENDING)

    serializer = NotificationSerializer(qs[:50], many=True)
    return Response(serializer.data)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def mark_read(request, pk):
    """
    Mark a notification as read (status → 'sent').

    **PATCH** ``/api/notifications/<pk>/read/``
    """
    try:
        notification = Notification.objects.get(pk=pk, user=request.user)
    except Notification.DoesNotExist:
        return Response(
            {"detail": "Notification not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    notification.status = Notification.Status.SENT
    notification.save()
    return Response({"detail": "Notification marked as read."})


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def mark_all_read(request):
    """
    Mark all pending notifications as read for the authenticated user.

    **PATCH** ``/api/notifications/read-all/``
    """
    updated = Notification.objects.filter(
        user=request.user,
        status=Notification.Status.PENDING,
    ).update(status=Notification.Status.SENT)

    return Response({"detail": f"{updated} notifications marked as read."})
