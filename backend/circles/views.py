"""
Views for the circles app.

Provides:
- CircleViewSet  — full CRUD for savings circles.
- add_member     — POST endpoint to invite a user by wallet address.
- circle_loans   — GET endpoint listing loans for a specific circle.
- credit_score_view — public GET endpoint returning a mock credit score.
"""

from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from accounts.models import User

from .models import Circle, LoanRequest, Membership
from .serializers import (
    CircleSerializer,
    LoanRequestSerializer,
    MembershipSerializer,
)


# ------------------------------------------------------------------
# CircleViewSet — CRUD
# ------------------------------------------------------------------

class CircleViewSet(viewsets.ModelViewSet):
    """
    Full CRUD for savings circles.

    **List** — returns only circles where the authenticated user holds
    a membership (either member or admin).

    **Create** — automatically adds the requesting user as the circle's
    admin member so they don't have to join separately.
    """

    serializer_class = CircleSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Restrict listing to circles the current user belongs to."""
        return Circle.objects.filter(
            memberships__user=self.request.user,
        ).distinct()

    def perform_create(self, serializer):
        """
        Save the circle and create an admin Membership for the creator.

        The ``admin_wallet`` field is automatically set to the
        requesting user's wallet address if not explicitly provided.
        """
        admin_wallet = (
            serializer.validated_data.get("admin_wallet")
            or self.request.user.wallet_address
        )
        circle = serializer.save(admin_wallet=admin_wallet)

        Membership.objects.create(
            circle=circle,
            user=self.request.user,
            role="admin",
        )


# ------------------------------------------------------------------
# Add member to circle
# ------------------------------------------------------------------

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def add_member(request, pk):
    """
    Add a member to a circle by wallet address.

    **POST** ``/api/circles/<pk>/members/``

    Request body::

        { "wallet_address": "0x..." }

    If no user exists for the given wallet address one is created
    automatically (they can complete their profile on first login).

    Returns the created ``Membership`` or a 400 error if the user
    is already a member.
    """
    try:
        circle = Circle.objects.get(pk=pk)
    except Circle.DoesNotExist:
        return Response(
            {"detail": "Circle not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    wallet_address = request.data.get("wallet_address", "").strip()
    if not wallet_address:
        return Response(
            {"detail": "wallet_address is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Get or create the user for the provided wallet address.
    user, _created = User.objects.get_or_create(
        wallet_address=wallet_address.lower(),
    )

    # Prevent duplicate memberships.
    if Membership.objects.filter(circle=circle, user=user).exists():
        return Response(
            {"detail": "User is already a member of this circle."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    membership = Membership.objects.create(
        circle=circle,
        user=user,
        role="member",
    )
    serializer = MembershipSerializer(membership)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


# ------------------------------------------------------------------
# List loans for a circle
# ------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def circle_loans(request, pk):
    """
    List all loan requests for a given circle.

    **GET** ``/api/circles/<pk>/loans/``

    Returns a list of ``LoanRequest`` objects ordered by most recent
    first.
    """
    try:
        circle = Circle.objects.get(pk=pk)
    except Circle.DoesNotExist:
        return Response(
            {"detail": "Circle not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    loans = LoanRequest.objects.filter(circle=circle)
    serializer = LoanRequestSerializer(loans, many=True)
    return Response(serializer.data)


# ------------------------------------------------------------------
# Mock credit score
# ------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([AllowAny])
def credit_score_view(request, wallet):
    """
    Return a mock credit score for the given wallet address.

    **GET** ``/api/score/<wallet>/``

    This is a public endpoint (no authentication required) intended
    for demonstration / MVP purposes.  A real implementation would
    query on-chain repayment history and off-chain records to compute
    a meaningful score.

    Response shape::

        {
            "wallet": "0x...",
            "score": 500,
            "breakdown": {
                "on_time": 0,
                "missed": 0,
                "repaid": 0
            }
        }
    """
    return Response({
        "wallet": wallet,
        "score": 500,
        "breakdown": {
            "on_time": 0,
            "missed": 0,
            "repaid": 0,
        },
    })
