"""
Views for the M-Pesa app (via PayHero aggregator).

Provides:
- stk_push_view    -- POST to initiate STK Push via PayHero
- payment_callback -- POST webhook endpoint PayHero calls on completion
- payment_status   -- GET to check payment status by reference
"""

import uuid
import logging

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from accounts.models import User
from circles.models import Circle
from .models import MpesaPayment
from .serializers import StkPushSerializer, MpesaPaymentSerializer
from .payhero_client import PayHeroClient, PayHeroError

logger = logging.getLogger(__name__)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def stk_push_view(request):
    """
    Initiate an M-Pesa STK Push via PayHero.

    **POST** `/api/mpesa/stkpush/`

    Request body::

        {
            "phone_number": "0712345678",
            "amount": "500.00",
            "circle_id": "uuid-here",
            "wallet_address": "0x..."
        }
    """
    serializer = StkPushSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    phone = serializer.validated_data["phone_number"]
    amount = serializer.validated_data["amount"]
    circle_id = serializer.validated_data["circle_id"]
    wallet = serializer.validated_data["wallet_address"]

    # Validate circle exists
    try:
        circle = Circle.objects.get(pk=circle_id)
    except Circle.DoesNotExist:
        return Response(
            {"detail": "Circle not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    # Generate unique reference
    reference = f"PL-{uuid.uuid4().hex[:8].upper()}"

    # Initiate STK Push
    client = PayHeroClient()
    try:
        result = client.stk_push(
            phone_number=phone,
            amount=float(amount),
            reference=reference,
        )
    except PayHeroError as exc:
        return Response(
            {"detail": str(exc)},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    # Save payment record
    payment = MpesaPayment.objects.create(
        phone_number=phone,
        amount=amount,
        circle=circle,
        user=request.user,
        merchant_request_id=reference,
        checkout_request_id=result.get("checkout_request_id", reference),
        status=MpesaPayment.Status.PENDING,
    )

    return Response(
        {
            "payment_id": str(payment.id),
            "reference": reference,
            "status": "pending",
            "message": "STK Push sent. Check your phone.",
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def payment_callback(request):
    """
    Webhook endpoint called by PayHero when payment completes.

    **POST** `/api/mpesa/callback/`

    PayHero sends payment status updates here. We update the
    MpesaPayment record and log the result.
    """
    data = request.data
    logger.info("PayHero callback received: %s", data)

    reference = data.get("external_reference", "")
    result_status = data.get("status", "").upper()
    receipt = data.get("provider_reference", "")

    if not reference:
        return Response({"detail": "Missing reference"}, status=400)

    try:
        payment = MpesaPayment.objects.get(merchant_request_id=reference)
    except MpesaPayment.DoesNotExist:
        logger.warning("Callback for unknown reference: %s", reference)
        return Response({"detail": "Payment not found"}, status=404)

    if result_status in ("SUCCESS", "COMPLETED"):
        payment.status = MpesaPayment.Status.COMPLETED
        payment.mpesa_receipt_number = receipt
        payment.result_code = 0
        payment.result_description = "Payment successful"
        
        # Trigger the on-chain bridge transaction
        from blockchain.bridge import trigger_on_chain_contribution
        tx_hash = trigger_on_chain_contribution(payment.amount)
        
        if tx_hash:
            # Create a Contribution record for tracking
            from circles.models import Contribution
            Contribution.objects.create(
                circle=payment.circle,
                user=payment.user,
                amount=payment.amount,
                tx_hash=tx_hash,
                payment_method="mpesa",
            )
            logger.info("Recorded on-chain contribution in database for tx: %s", tx_hash)

            # Send push notification
            if payment.user:
                try:
                    from notifications.services import notify_contribution_received
                    circle_name = payment.circle.name if payment.circle else "PayLoop"
                    notify_contribution_received(
                        user=payment.user,
                        circle_name=circle_name,
                        amount=str(payment.amount),
                    )
                except Exception as notif_exc:
                    logger.warning("Notification failed: %s", notif_exc)
        else:
            logger.error("On-chain bridge transaction failed for payment: %s", payment.id)
    else:
        payment.status = MpesaPayment.Status.FAILED
        payment.result_code = -1
        payment.result_description = data.get("description", "Payment failed")

    payment.save()

    return Response({"detail": "Callback processed"})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def payment_status_view(request, reference):
    """
    Check payment status by reference.

    **GET** `/api/mpesa/status/<reference>/`
    """
    try:
        payment = MpesaPayment.objects.get(merchant_request_id=reference)
    except MpesaPayment.DoesNotExist:
        return Response(
            {"detail": "Payment not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    serializer = MpesaPaymentSerializer(payment)
    return Response(serializer.data)
