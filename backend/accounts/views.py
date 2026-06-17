"""
Views for wallet-based authentication.

VerifyWalletView accepts a signed message from MetaMask, verifies
the signature using eth_account, creates the user if needed, and
returns JWT access + refresh tokens.
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
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
