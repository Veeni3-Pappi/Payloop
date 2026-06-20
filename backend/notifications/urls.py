"""
URL configuration for the notifications app.

Routes:
- /api/notifications/                — list notifications (GET)
- /api/notifications/<pk>/read/      — mark single as read (PATCH)
- /api/notifications/read-all/       — mark all as read (PATCH)
"""

from django.urls import path
from . import views

urlpatterns = [
    path("", views.list_notifications, name="notification-list"),
    path("<uuid:pk>/read/", views.mark_read, name="notification-read"),
    path("read-all/", views.mark_all_read, name="notification-read-all"),
]
