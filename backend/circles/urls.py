"""
URL configuration for the circles app.

Registers:
- /api/circles/                         — CircleViewSet (list / create)
- /api/circles/<pk>/                    — CircleViewSet (retrieve / update / delete)
- /api/circles/<pk>/members/            — circle_members (GET list / POST add)
- /api/circles/<pk>/loans/              — circle_loans_router (GET list / POST create)
- /api/circles/<pk>/loans/<loan>/vote/  — vote_loan (POST)
- /api/circles/<pk>/contributions/      — circle_contributions (GET)

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
        views.circle_members,
        name="circle-members",
    ),
    path(
        "circles/<uuid:pk>/loans/",
        views.circle_loans_router,
        name="circle-loans",
    ),
    path(
        "circles/<uuid:pk>/loans/<uuid:loan_pk>/vote/",
        views.vote_loan,
        name="circle-loan-vote",
    ),
    path(
        "circles/<uuid:pk>/contributions/",
        views.circle_contributions,
        name="circle-contributions",
    ),
]
