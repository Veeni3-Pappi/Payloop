"""
URL configuration for the circles app.

Registers:
- /api/circles/             — CircleViewSet (list / create)
- /api/circles/<pk>/        — CircleViewSet (retrieve / update / delete)
- /api/circles/<pk>/members/— add_member (POST)
- /api/circles/<pk>/loans/  — circle_loans (GET)

Note: ``credit_score_view`` is registered at the project-level urls.py
as ``/api/score/<wallet>/`` because it is not circle-scoped.
"""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register(r"circles", views.CircleViewSet, basename="circle")

urlpatterns = [
    path("", include(router.urls)),
    path(
        "circles/<uuid:pk>/members/",
        views.add_member,
        name="circle-add-member",
    ),
    path(
        "circles/<uuid:pk>/loans/",
        views.circle_loans,
        name="circle-loans",
    ),
]
