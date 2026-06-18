"""
Notification service for PayLoop.

Provides a high-level interface for sending push notifications via
Firebase Cloud Messaging (FCM). Falls back gracefully when FCM is
not configured (development environments).
"""

import logging
import os

from .models import Notification

logger = logging.getLogger(__name__)

# Try to import Firebase admin SDK
_fcm_available = False
try:
    import firebase_admin
    from firebase_admin import credentials, messaging

    cred_path = os.environ.get("FIREBASE_CREDENTIALS_PATH", "")
    if cred_path and os.path.exists(cred_path):
        if not firebase_admin._apps:
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
        _fcm_available = True
        logger.info("Firebase Admin SDK initialized successfully.")
    else:
        logger.warning(
            "FIREBASE_CREDENTIALS_PATH not set or file not found. "
            "Push notifications will be logged but not delivered."
        )
except ImportError:
    logger.warning("firebase-admin not installed. Push notifications disabled.")


def send_push_notification(
    user,
    title: str,
    body: str,
    notification_type: str = "general",
    data: dict | None = None,
) -> Notification:
    """
    Send a push notification to a user and record it in the database.

    If the user has no FCM token or Firebase is not configured,
    the notification is still recorded with status 'failed'.

    Args:
        user: The User model instance to notify.
        title: Notification title.
        body: Notification body text.
        notification_type: One of Notification.NotificationType values.
        data: Optional JSON-serializable dict for extra payload.

    Returns:
        The created Notification record.
    """
    notification = Notification.objects.create(
        user=user,
        title=title,
        body=body,
        notification_type=notification_type,
        data=data or {},
        status=Notification.Status.PENDING,
    )

    fcm_token = getattr(user, "fcm_token", "")
    if not fcm_token:
        notification.status = Notification.Status.FAILED
        notification.error_message = "User has no FCM token"
        notification.save()
        logger.info(
            "Notification recorded (no FCM token): [%s] %s",
            notification_type, title,
        )
        return notification

    if not _fcm_available:
        notification.status = Notification.Status.FAILED
        notification.error_message = "Firebase not configured"
        notification.save()
        logger.info(
            "Notification recorded (Firebase not configured): [%s] %s",
            notification_type, title,
        )
        return notification

    try:
        message = messaging.Message(
            notification=messaging.Notification(
                title=title,
                body=body,
            ),
            data={str(k): str(v) for k, v in (data or {}).items()},
            token=fcm_token,
        )
        response = messaging.send(message)
        notification.status = Notification.Status.SENT
        notification.fcm_message_id = response
        notification.save()
        logger.info(
            "Push notification sent: [%s] %s → %s",
            notification_type, title, response,
        )

    except Exception as exc:
        notification.status = Notification.Status.FAILED
        notification.error_message = str(exc)
        notification.save()
        logger.error(
            "Push notification failed: [%s] %s → %s",
            notification_type, title, exc,
        )

    return notification


def notify_contribution_received(user, circle_name: str, amount: str):
    """Notify a user that their contribution was received."""
    return send_push_notification(
        user=user,
        title="Contribution Received ✅",
        body=f"KES {amount} contribution to {circle_name} recorded on-chain.",
        notification_type="payment_received",
    )


def notify_loan_request(members, borrower_name: str, amount: str, circle_name: str):
    """Notify circle members about a new loan request."""
    notifications = []
    for member in members:
        n = send_push_notification(
            user=member,
            title="New Loan Request 🏦",
            body=f"{borrower_name} requested {amount} MATIC from {circle_name}. Vote now!",
            notification_type="loan_request",
        )
        notifications.append(n)
    return notifications


def notify_loan_approved(user, amount: str, circle_name: str):
    """Notify a borrower that their loan was approved."""
    return send_push_notification(
        user=user,
        title="Loan Approved! 🎉",
        body=f"Your {amount} MATIC loan from {circle_name} was approved by majority vote.",
        notification_type="loan_approved",
    )


def notify_score_updated(user, new_score: int, reason: str):
    """Notify a user that their credit score changed."""
    return send_push_notification(
        user=user,
        title="Credit Score Updated 📊",
        body=f"Your CreditLoop score is now {new_score}. {reason}",
        notification_type="score_updated",
        data={"score": new_score},
    )
