from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from eth_account import Account
from eth_account.messages import encode_defunct
from accounts.models import User


class WalletAuthTests(APITestCase):

    def setUp(self):
        # Create a test account for signing
        self.private_key = "0x1111111111111111111111111111111111111111111111111111111111111111"
        self.account = Account.from_key(self.private_key)
        self.wallet_address = self.account.address

    def test_verify_wallet_success(self):
        message = f"Welcome to PayLoop! Sign this message to verify ownership of your wallet: {self.wallet_address.lower()}"
        encoded_msg = encode_defunct(text=message)
        signed = Account.sign_message(encoded_msg, self.private_key)
        signature = signed.signature.hex()

        url = reverse("verify-wallet")
        data = {
            "wallet_address": self.wallet_address,
            "signature": signature,
            "message": message,
        }

        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access_token", response.data)
        self.assertIn("refresh_token", response.data)
        self.assertEqual(response.data["wallet_address"], self.wallet_address.lower())

        # Assert user was created
        self.assertTrue(User.objects.filter(wallet_address=self.wallet_address.lower()).exists())

    def test_verify_wallet_invalid_signature(self):
        message = f"Welcome to PayLoop! Sign this message to verify ownership of your wallet: {self.wallet_address.lower()}"
        url = reverse("verify-wallet")
        data = {
            "wallet_address": self.wallet_address,
            "signature": "0x" + "0" * 130,  # Invalid signature
            "message": message,
        }

        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_verify_wallet_mismatch_address(self):
        other_wallet = "0x0000000000000000000000000000000000000000"
        message = f"Welcome to PayLoop! Sign this message to verify ownership of your wallet: {other_wallet}"
        encoded_msg = encode_defunct(text=message)
        signed = Account.sign_message(encoded_msg, self.private_key)
        signature = signed.signature.hex()

        url = reverse("verify-wallet")
        data = {
            "wallet_address": other_wallet,
            "signature": signature,
            "message": message,
        }

        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class UserProfileTests(APITestCase):

    def setUp(self):
        self.user = User.objects.create(wallet_address="0x1111111111111111111111111111111111111111")
        self.client.force_authenticate(user=self.user)

    def test_get_profile(self):
        url = reverse("user-profile")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["wallet_address"], self.user.wallet_address)

    def test_update_profile(self):
        url = reverse("user-profile")
        data = {
            "display_name": "Test User",
            "phone_number": "254712345678",
            "fcm_token": "token-xyz"
        }
        response = self.client.patch(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["display_name"], "Test User")
        self.assertEqual(response.data["phone_number"], "254712345678")

        # Reload user and check
        self.user.refresh_from_db()
        self.assertEqual(self.user.display_name, "Test User")
        self.assertEqual(self.user.phone_number, "254712345678")
        self.assertEqual(self.user.fcm_token, "token-xyz")
