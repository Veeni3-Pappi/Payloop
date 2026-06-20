"""
Views for the accounts app.

Provides:
- verify_wallet   — POST to authenticate via MetaMask signature.
- health_check    — GET health check endpoint.
- user_profile    — GET / PATCH to read or update the current user's profile.
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import User
from .serializers import WalletAuthSerializer


@api_view(["POST"])
@permission_classes([AllowAny])
def verify_wallet(request):
    """
    Verify a MetaMask wallet signature and return JWT tokens.

    **POST** `/api/auth/verify-wallet/`

    Request body::

        {
            "wallet_address": "0x...",
            "signature": "0x...",
            "message": "Sign this message to verify..."
        }

    Response::

        {
            "access_token": "eyJ...",
            "refresh_token": "eyJ...",
            "wallet_address": "0x..."
        }
    """
    serializer = WalletAuthSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    wallet = serializer.validated_data["wallet_address"]

    # Get or create user for this wallet
    user, _created = User.objects.get_or_create(
        wallet_address=wallet.lower(),
    )

    # Get or create default circle if CIRCLE_VAULT_ADDRESS is configured
    import os
    from circles.models import Circle, Membership
    
    vault_address = os.environ.get("CIRCLE_VAULT_ADDRESS", "").lower().strip()
    if vault_address:
        circle, _ = Circle.objects.get_or_create(
            contract_address=vault_address,
            defaults={
                "name": "PayLoop Demo Circle",
                "admin_wallet": wallet.lower(),
                "contribution_amount": 10.00,
                "contribution_frequency": "monthly",
            }
        )
        # Add user to this circle
        Membership.objects.get_or_create(
            circle=circle,
            user=user,
            defaults={"role": "member"}
        )

    # Generate JWT tokens
    refresh = RefreshToken.for_user(user)

    return Response(
        {
            "access_token": str(refresh.access_token),
            "refresh_token": str(refresh),
            "wallet_address": wallet,
        },
        status=status.HTTP_200_OK,
    )


@api_view(["GET"])
@permission_classes([AllowAny])
def health_check(request):
    """Simple health check endpoint."""
    return Response({"status": "ok", "service": "payloop-backend"})


@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def user_profile(request):
    """
    Get or update the authenticated user's profile.

    **GET** ``/api/auth/profile/``

    Response::

        {
            "wallet_address": "0x...",
            "display_name": "Alice",
            "phone_number": "0712345678",
            "created_at": "2026-06-20T..."
        }

    **PATCH** ``/api/auth/profile/``

    Request body (all fields optional)::

        {
            "display_name": "Alice",
            "phone_number": "0712345678",
            "fcm_token": "..."
        }
    """
    user = request.user

    if request.method == "GET":
        return Response({
            "wallet_address": user.wallet_address,
            "display_name": user.display_name,
            "phone_number": user.phone_number,
            "created_at": user.created_at.isoformat(),
        })

    # PATCH — update allowed fields
    allowed_fields = ["display_name", "phone_number", "fcm_token"]
    updated = []

    for field in allowed_fields:
        if field in request.data:
            setattr(user, field, request.data[field])
            updated.append(field)

    if updated:
        user.save(update_fields=updated)

    return Response({
        "wallet_address": user.wallet_address,
        "display_name": user.display_name,
        "phone_number": user.phone_number,
        "updated_fields": updated,
    })
