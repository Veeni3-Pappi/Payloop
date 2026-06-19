#!/usr/bin/env python3
"""
Quick PayHero STK Push test — bypasses Django, hits PayHero API directly.

Usage:
    python test_payhero.py <phone_number> [amount]

Example:
    python test_payhero.py 0712345678 10
"""

import os
import sys

# Load .env from the backend directory
from pathlib import Path
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from dotenv import load_dotenv
load_dotenv(backend_dir / ".env")

from mpesa.payhero_client import PayHeroClient, PayHeroError


def main():
    if len(sys.argv) < 2:
        print("Usage: python test_payhero.py <phone_number> [amount]")
        print("Example: python test_payhero.py 0712345678 10")
        sys.exit(1)

    phone = sys.argv[1]
    amount = int(sys.argv[2]) if len(sys.argv) > 2 else 1  # default KES 1

    # Show config (masked)
    username = os.environ.get("PAYHERO_API_USERNAME", "")
    password = os.environ.get("PAYHERO_API_PASSWORD", "")
    channel = os.environ.get("PAYHERO_CHANNEL_ID", "")

    print("=" * 50)
    print("  PayHero STK Push Test")
    print("=" * 50)
    print(f"  Username:  {username[:6]}...{username[-4:]}" if len(username) > 10 else f"  Username:  {username}")
    print(f"  Password:  {'*' * 8}...{password[-4:]}" if len(password) > 10 else f"  Password:  {'*' * len(password)}")
    print(f"  Channel:   {channel}")
    print(f"  Phone:     {phone}")
    print(f"  Amount:    KES {amount}")
    print("=" * 50)

    client = PayHeroClient()

    print("\n🚀 Sending STK Push...")
    try:
        result = client.stk_push(
            phone_number=phone,
            amount=amount,
            reference=f"TEST-{os.urandom(4).hex().upper()}",
        )
        print("\n✅ STK Push sent successfully!")
        print(f"   Response: {result}")
        
        # If we got a reference, check status after a few seconds
        ref = result.get("external_reference", "")
        if ref:
            import time
            print(f"\n⏳ Waiting 10 seconds then checking status for ref: {ref}")
            time.sleep(10)
            try:
                status = client.check_status(ref)
                print(f"   Status: {status}")
            except PayHeroError as e:
                print(f"   Status check: {e}")

    except PayHeroError as e:
        print(f"\n❌ STK Push failed: {e}")
    except Exception as e:
        print(f"\n❌ Unexpected error: {type(e).__name__}: {e}")


if __name__ == "__main__":
    main()
