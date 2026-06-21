"""
Standalone M-Pesa STK Push tester.

Fires a single STK Push via the Daraja sandbox using the project's
DarajaClient, bypassing auth/DB so we can confirm the prompt arrives
on a real phone before wiring the full API flow.

Usage:
    venv/bin/python test_stk.py 254712345678 [amount]

Requires MPESA_* vars in .env, including a valid MPESA_CALLBACK_URL.
"""

import os
import sys

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "payloop.settings")
import django  # noqa: E402

django.setup()

from mpesa.daraja import DarajaClient, DarajaClientError  # noqa: E402



def main():
    if len(sys.argv) < 2:
        print("Usage: python test_stk.py <2547XXXXXXXX> [amount]")
        sys.exit(1)

    phone = sys.argv[1].strip().replace("+", "")
    amount = int(sys.argv[2]) if len(sys.argv) > 2 else 1

    client = DarajaClient()
    print(f"env={client.env} shortcode={client.shortcode}")
    print(f"callback_url={client.callback_url!r}")
    if not client.callback_url:
        print("\n[!] MPESA_CALLBACK_URL is empty — Daraja will reject the request.")
        print("    Set it to your public https tunnel URL + /api/mpesa/callback/")
        sys.exit(1)

    print(f"\nSending STK Push: KES {amount} -> {phone} ...")
    try:
        resp = client.stk_push(
            phone_number=phone,
            amount=amount,
            account_reference="PL-TEST",
            transaction_desc="PayLoop Test",
        )
    except DarajaClientError as exc:
        print(f"\n[FAIL] {exc}")
        sys.exit(1)

    print("\n[OK] Daraja accepted the request:")
    for k, v in resp.items():
        print(f"  {k}: {v}")
    print("\nCheck the phone for the M-Pesa PIN prompt.")
    print("Watch the Django server log for the callback POST.")


if __name__ == "__main__":
    main()
