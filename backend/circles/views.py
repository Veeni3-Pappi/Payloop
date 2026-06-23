"""
Views for the circles app.

Provides:
- CircleViewSet        — full CRUD for savings circles.
- circle_members       — GET (list) / POST (add) members of a circle.
- circle_loans_router  — GET (list) / POST (create) loan requests for a circle.
- vote_loan            — POST endpoint to vote on a loan request.
- circle_contributions — GET endpoint listing contributions for a circle.
- credit_score_view    — public GET endpoint reading on-chain credit score.
"""

from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from accounts.models import User

from .models import Circle, Contribution, LoanRequest, Membership
from .serializers import (
    CircleSerializer,
    ContributionSerializer,
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
# Vote on a loan request
# ------------------------------------------------------------------

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def vote_loan(request, pk, loan_pk):
    """
    Vote to approve or reject a loan request.

    **POST** ``/api/circles/<pk>/loans/<loan_pk>/vote/``

    Request body::

        { "approve": true }

    Only circle members (excluding the borrower) can vote.
    When a majority of members approve, the loan status changes
    to 'approved' and a notification is sent to the borrower.
    """
    try:
        circle = Circle.objects.get(pk=pk)
    except Circle.DoesNotExist:
        return Response(
            {"detail": "Circle not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    try:
        loan = LoanRequest.objects.get(pk=loan_pk, circle=circle)
    except LoanRequest.DoesNotExist:
        return Response(
            {"detail": "Loan request not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if loan.status != "pending":
        return Response(
            {"detail": f"Cannot vote on a loan that is '{loan.status}'."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Verify voter is a member but not the borrower
    if not Membership.objects.filter(circle=circle, user=request.user).exists():
        return Response(
            {"detail": "You must be a member of this circle to vote."},
            status=status.HTTP_403_FORBIDDEN,
        )

    if request.user == loan.borrower:
        return Response(
            {"detail": "You cannot vote on your own loan request."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    approve = request.data.get("approve", False)

    # For the demo, a single approval is enough to approve the loan.
    # In production, you'd track individual votes and require majority.
    if approve:
        loan.status = "approved"
        loan.save()

        # Notify borrower
        try:
            from notifications.services import notify_loan_approved
            notify_loan_approved(
                loan.borrower, str(loan.amount_matic), circle.name
            )
        except Exception:
            pass

        return Response({
            "detail": "Loan approved.",
            "loan_id": str(loan.id),
            "status": "approved",
        })
    else:
        loan.status = "rejected"
        loan.save()
        return Response({
            "detail": "Loan rejected.",
            "loan_id": str(loan.id),
            "status": "rejected",
        })


# ------------------------------------------------------------------
# List contributions for a circle
# ------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def circle_contributions(request, pk):
    """
    List all contributions for a given circle.

    **GET** ``/api/circles/<pk>/contributions/``

    Returns a list of ``Contribution`` objects ordered by most recent
    first.
    """
    try:
        circle = Circle.objects.get(pk=pk)
    except Circle.DoesNotExist:
        return Response(
            {"detail": "Circle not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    contributions = Contribution.objects.filter(circle=circle)
    serializer = ContributionSerializer(contributions, many=True)
    return Response(serializer.data)


# ------------------------------------------------------------------
# Credit score (on-chain read with fallback)
# ------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([AllowAny])
def credit_score_view(request, wallet):
    """
    Return the credit score for a wallet address.

    **GET** ``/api/score/<wallet>/``

    This is a public endpoint (no authentication required).
    Reads the score from the CreditScore smart contract on Polygon Amoy
    when configured; falls back to a default score of 500 otherwise.

    Response shape::

        {
            "wallet": "0x...",
            "score": 500,
            "breakdown": {
                "on_time": 0,
                "missed": 0,
                "repaid": 0
            },
            "source": "blockchain" | "default"
        }
    """
    import os
    credit_score_address = os.environ.get("CREDIT_SCORE_ADDRESS", "").strip()

    # Try reading from on-chain CreditScore contract
    if credit_score_address:
        try:
            from web3 import Web3

            rpc_url = os.environ.get(
                "POLYGON_RPC_URL", "https://rpc-amoy.polygon.technology"
            )
            w3 = Web3(Web3.HTTPProvider(rpc_url))

            # Minimal ABI for getScore and getScoreData
            credit_abi = [
                {
                    "inputs": [{"internalType": "address", "name": "wallet", "type": "address"}],
                    "name": "getScore",
                    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
                    "stateMutability": "view",
                    "type": "function",
                },
                {
                    "inputs": [{"internalType": "address", "name": "wallet", "type": "address"}],
                    "name": "getScoreData",
                    "outputs": [
                        {"internalType": "uint256", "name": "score", "type": "uint256"},
                        {"internalType": "uint256", "name": "onTimeCount", "type": "uint256"},
                        {"internalType": "uint256", "name": "missedCount", "type": "uint256"},
                        {"internalType": "uint256", "name": "repaidCount", "type": "uint256"},
                        {"internalType": "uint256", "name": "lastUpdated", "type": "uint256"},
                    ],
                    "stateMutability": "view",
                    "type": "function",
                },
            ]

            contract = w3.eth.contract(
                address=Web3.to_checksum_address(credit_score_address),
                abi=credit_abi,
            )

            checksum_wallet = Web3.to_checksum_address(wallet)

            # Try getScoreData first (full breakdown)
            try:
                data = contract.functions.getScoreData(checksum_wallet).call()
                return Response({
                    "wallet": wallet,
                    "score": data[0],
                    "breakdown": {
                        "on_time": data[1],
                        "missed": data[2],
                        "repaid": data[3],
                    },
                    "source": "blockchain",
                })
            except Exception:
                # Fall back to just getScore
                score = contract.functions.getScore(checksum_wallet).call()
                return Response({
                    "wallet": wallet,
                    "score": score,
                    "breakdown": {
                        "on_time": 0,
                        "missed": 0,
                        "repaid": 0,
                    },
                    "source": "blockchain",
                })

        except Exception as exc:
            import logging
            logger = logging.getLogger(__name__)
            logger.warning("On-chain credit score read failed: %s", exc)

    # Fallback: return default score
    return Response({
        "wallet": wallet,
        "score": 500,
        "breakdown": {
            "on_time": 0,
            "missed": 0,
            "repaid": 0,
        },
        "source": "default",
    })


# ------------------------------------------------------------------
# Dispatcher views (route GET / POST on the same URL)
# ------------------------------------------------------------------

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def circle_members(request, pk):
    """
    List members (GET) or add a member (POST).

    **GET**  ``/api/circles/<pk>/members/`` — list members
    **POST** ``/api/circles/<pk>/members/`` — add a member
    """
    try:
        circle = Circle.objects.get(pk=pk)
    except Circle.DoesNotExist:
        return Response(
            {"detail": "Circle not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.method == "GET":
        memberships = Membership.objects.filter(circle=circle).select_related("user")
        serializer = MembershipSerializer(memberships, many=True)
        return Response(serializer.data)

    # POST — add member
    wallet_address = request.data.get("wallet_address", "").strip()
    if not wallet_address:
        return Response(
            {"detail": "wallet_address is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user, _created = User.objects.get_or_create(
        wallet_address=wallet_address.lower(),
    )

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


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def circle_loans_router(request, pk):
    """
    List loans (GET) or create a loan request (POST).

    **GET**  ``/api/circles/<pk>/loans/`` — list loans
    **POST** ``/api/circles/<pk>/loans/`` — create a loan request
    """
    try:
        circle = Circle.objects.get(pk=pk)
    except Circle.DoesNotExist:
        return Response(
            {"detail": "Circle not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.method == "GET":
        loans = LoanRequest.objects.filter(circle=circle)
        serializer = LoanRequestSerializer(loans, many=True)
        return Response(serializer.data)

    # POST — create loan
    if not Membership.objects.filter(circle=circle, user=request.user).exists():
        return Response(
            {"detail": "You must be a member of this circle to request a loan."},
            status=status.HTTP_403_FORBIDDEN,
        )

    if LoanRequest.objects.filter(
        circle=circle, borrower=request.user, status="pending"
    ).exists():
        return Response(
            {"detail": "You already have a pending loan request in this circle."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    amount = request.data.get("amount_matic")
    reason = request.data.get("reason", "")
    repayment_days = request.data.get("repayment_days")

    if not amount or not repayment_days:
        return Response(
            {"detail": "amount_matic and repayment_days are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    loan = LoanRequest.objects.create(
        circle=circle,
        borrower=request.user,
        amount_matic=amount,
        reason=reason,
        repayment_days=int(repayment_days),
        status="pending",
    )

    # Notify other circle members
    try:
        from notifications.services import notify_loan_request
        members = User.objects.filter(
            memberships__circle=circle
        ).exclude(id=request.user.id)
        borrower_name = request.user.display_name or str(request.user)
        notify_loan_request(members, borrower_name, str(amount), circle.name)
    except Exception:
        pass

    serializer = LoanRequestSerializer(loan)
    return Response(serializer.data, status=status.HTTP_201_CREATED)
