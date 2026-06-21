"""
Standalone FCM delivery tester.

Sends a real push notification to a user's stored fcm_token via the
Firebase Admin SDK, using the project's notification service.

Usage:
    venv/bin/python test_fcm.py [wallet_address]

Requires FIREBASE_CREDENTIALS_PATH to point at a valid service-account
JSON, and the target user to have a non-empty fcm_token (set from the
frontend "Enable notifications" button).
"""

import os
import sys

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "payloop.settings")
import django  # noqa: E402

django.setup()

from accounts.models import User  # noqa: E402
from notifications.services import _fcm_available, send_push_notification  # noqa: E402

DEFAULT_WALLET = "0x1111111111111111111111111111111111111111"


def main():
    wallet = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_WALLET
    print(f"FCM Admin SDK available: {_fcm_available}")
    if not _fcm_available:
        print("[!] Firebase not configured. Set FIREBASE_CREDENTIALS_PATH in .env.")
        sys.exit(1)

    try:
        user = User.objects.get(wallet_address=wallet)
    except User.DoesNotExist:
        print(f"[!] No user with wallet {wallet}")
        sys.exit(1)

    print(f"user fcm_token: {user.fcm_token[:24] + '...' if user.fcm_token else '(empty)'}")
    if not user.fcm_token:
        print("[!] User has no fcm_token. Click 'Enable notifications' in the web app first.")
        sys.exit(1)

    n = send_push_notification(
        user=user,
        title="PayLoop test push 🔔",
        body="If you can see this, FCM delivery works end-to-end.",
        notification_type="general",
    )
    print(f"status        : {n.status}")
    print(f"fcm_message_id: {n.fcm_message_id}")
    print(f"error_message : {n.error_message}")


if __name__ == "__main__":
    main()
