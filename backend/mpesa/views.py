"""
Views for the M-Pesa app (via Safaricom Daraja API).

Provides:
- stk_push_view    -- POST to initiate STK Push via Daraja
- payment_callback -- POST webhook endpoint Safaricom calls on completion
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
from .daraja import DarajaClient, DarajaClientError

logger = logging.getLogger(__name__)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def stk_push_view(request):
    """
    Initiate an M-Pesa STK Push via Safaricom Daraja API.

    **POST** `/api/mpesa/stkpush/`

    Request body::

        {
            "phone_number": "254712345678",
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

    # Initiate STK Push via Daraja
    client = DarajaClient()
    try:
        result = client.stk_push(
            phone_number=phone,
            amount=float(amount),
            account_reference=reference,
            transaction_desc="PayLoop Contribution",
        )
    except DarajaClientError as exc:
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
        merchant_request_id=result.get("MerchantRequestID", reference),
        checkout_request_id=result.get("CheckoutRequestID", reference),
        status=MpesaPayment.Status.PENDING,
    )

    return Response(
        {
            "payment_id": str(payment.id),
            "reference": reference,
            "checkout_request_id": result.get("CheckoutRequestID", ""),
            "status": "pending",
            "message": "STK Push sent. Check your phone.",
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def payment_callback(request):
    """
    Webhook endpoint called by Safaricom Daraja when payment completes.

    **POST** `/api/mpesa/callback/`

    Daraja sends an STK Push callback with this structure::

        {
            "Body": {
                "stkCallback": {
                    "MerchantRequestID": "...",
                    "CheckoutRequestID": "...",
                    "ResultCode": 0,
                    "ResultDesc": "...",
                    "CallbackMetadata": {
                        "Item": [...]
                    }
                }
            }
        }
    """
    data = request.data
    logger.info("Daraja callback received: %s", data)

    # Parse the Daraja callback structure
    try:
        stk_callback = data["Body"]["stkCallback"]
        merchant_request_id = stk_callback["MerchantRequestID"]
        checkout_request_id = stk_callback["CheckoutRequestID"]
        result_code = stk_callback["ResultCode"]
        result_desc = stk_callback.get("ResultDesc", "")
    except (KeyError, TypeError) as exc:
        logger.warning("Malformed Daraja callback: %s", exc)
        return Response({"detail": "Invalid callback format"}, status=400)

    # Look up the payment by CheckoutRequestID
    try:
        payment = MpesaPayment.objects.get(checkout_request_id=checkout_request_id)
    except MpesaPayment.DoesNotExist:
        logger.warning("Callback for unknown CheckoutRequestID: %s", checkout_request_id)
        return Response({"detail": "Payment not found"}, status=404)

    payment.result_code = result_code
    payment.result_description = result_desc

    if result_code == 0:
        # Successful payment — extract metadata
        payment.status = MpesaPayment.Status.COMPLETED

        # Parse callback metadata items
        callback_metadata = stk_callback.get("CallbackMetadata", {})
        items = callback_metadata.get("Item", [])
        for item in items:
            name = item.get("Name", "")
            value = item.get("Value", "")
            if name == "MpesaReceiptNumber":
                payment.mpesa_receipt_number = str(value)
            elif name == "TransactionDate":
                payment.transaction_date = str(value)

        # Trigger the on-chain bridge transaction
        from blockchain.bridge import trigger_on_chain_contribution
        
        member_wallet = payment.user.wallet_address if payment.user else None
        vault_address = payment.circle.contract_address if payment.circle else None
        
        tx_hash = trigger_on_chain_contribution(
            payment.amount,
            member_wallet=member_wallet,
            vault_address=vault_address,
        )

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

            # Record credit score update on-chain
            if member_wallet:
                try:
                    from blockchain.bridge import trigger_record_credit_score_contribution
                    trigger_record_credit_score_contribution(member_wallet, on_time=True)
                except Exception as cs_exc:
                    logger.warning("Failed to record credit score contribution on-chain: %s", cs_exc)

                # Mint LoopToken rewards on-chain (10.0 LOOP points)
                try:
                    from blockchain.bridge import trigger_mint_loop_token
                    trigger_mint_loop_token(member_wallet, amount_ether=10.0)
                except Exception as lt_exc:
                    logger.warning("Failed to mint LOOP reward tokens on-chain: %s", lt_exc)

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
        # Payment failed or was cancelled
        payment.status = MpesaPayment.Status.FAILED

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
