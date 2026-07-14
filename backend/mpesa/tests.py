from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from unittest.mock import patch
from accounts.models import User
from circles.models import Circle
from mpesa.models import MpesaPayment


class MpesaTests(APITestCase):

    def setUp(self):
        self.user = User.objects.create(wallet_address="0x1111111111111111111111111111111111111111")
        self.client.force_authenticate(user=self.user)

        self.circle = Circle.objects.create(
            name="Test Circle",
            contract_address="0x9F2196B0dF4e5cEE0E43d19F185602c22055F4eD",
            admin_wallet=self.user.wallet_address,
            contribution_amount=10.00,
            contribution_frequency="monthly"
        )

    @patch("mpesa.views.DarajaClient.stk_push")
    def test_stk_push_initiation(self, mock_stk_push):
        mock_stk_push.return_value = {
            "MerchantRequestID": "mock-merchant-id",
            "CheckoutRequestID": "mock-checkout-id",
            "ResponseCode": "0",
            "ResponseDescription": "Success",
        }

        url = reverse("mpesa-stkpush")
        data = {
            "phone_number": "254712345678",
            "amount": "100.00",
            "circle_id": str(self.circle.id),
            "wallet_address": self.user.wallet_address
        }

        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["status"], "pending")
        self.assertEqual(response.data["checkout_request_id"], "mock-checkout-id")

        # Verify payment record was created
        self.assertTrue(MpesaPayment.objects.filter(checkout_request_id="mock-checkout-id").exists())

    @patch("blockchain.bridge.trigger_on_chain_contribution")
    @patch("blockchain.bridge.trigger_record_credit_score_contribution")
    @patch("blockchain.bridge.trigger_mint_loop_token")
    def test_mpesa_callback_success(self, mock_mint_token, mock_record_score, mock_bridge_tx):
        mock_bridge_tx.return_value = "0xmocktxhash12345"
        mock_record_score.return_value = "0xmockscoretx"
        mock_mint_token.return_value = "0xmockminttx"

        payment = MpesaPayment.objects.create(
            phone_number="254712345678",
            amount=100.00,
            circle=self.circle,
            user=self.user,
            merchant_request_id="mock-merchant-id",
            checkout_request_id="mock-checkout-id",
            status="pending"
        )

        url = reverse("mpesa-callback")
        callback_data = {
            "Body": {
                "stkCallback": {
                    "MerchantRequestID": "mock-merchant-id",
                    "CheckoutRequestID": "mock-checkout-id",
                    "ResultCode": 0,
                    "ResultDesc": "The service request is processed successfully.",
                    "CallbackMetadata": {
                        "Item": [
                            {"Name": "Amount", "Value": 100.00},
                            {"Name": "MpesaReceiptNumber", "Value": "NLJ7RT7AN9"},
                            {"Name": "TransactionDate", "Value": 20260616120000},
                            {"Name": "PhoneNumber", "Value": 254712345678}
                        ]
                    }
                }
            }
        }

        # Make callback without auth (it's a public webhook)
        self.client.force_authenticate(user=None)
        response = self.client.post(url, callback_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        payment.refresh_from_db()
        self.assertEqual(payment.status, MpesaPayment.Status.COMPLETED)
        self.assertEqual(payment.mpesa_receipt_number, "NLJ7RT7AN9")
        self.assertEqual(payment.result_code, 0)

        # Verify on-chain functions were triggered
        mock_bridge_tx.assert_called_once_with(
            payment.amount,
            member_wallet=self.user.wallet_address,
            vault_address=self.circle.contract_address
        )
        mock_record_score.assert_called_once_with(
            self.user.wallet_address,
            on_time=True
        )
        mock_mint_token.assert_called_once_with(
            self.user.wallet_address,
            amount_ether=10.0
        )

    def test_payment_status(self):
        payment = MpesaPayment.objects.create(
            phone_number="254712345678",
            amount=100.00,
            circle=self.circle,
            user=self.user,
            merchant_request_id="reference-123",
            checkout_request_id="checkout-123",
            status="pending"
        )

        url = reverse("mpesa-status", kwargs={"reference": "reference-123"})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "pending")
