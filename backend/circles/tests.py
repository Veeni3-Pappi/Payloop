from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from unittest.mock import patch
from accounts.models import User
from circles.models import Circle, Membership, LoanRequest, Contribution


class CircleApiTests(APITestCase):

    def setUp(self):
        self.user = User.objects.create(wallet_address="0x1111111111111111111111111111111111111111")
        self.other_user = User.objects.create(wallet_address="0x2222222222222222222222222222222222222222")
        self.client.force_authenticate(user=self.user)

        self.circle = Circle.objects.create(
            name="Test Circle",
            contract_address="0x9F2196B0dF4e5cEE0E43d19F185602c22055F4eD",
            admin_wallet=self.user.wallet_address,
            contribution_amount=10.00,
            contribution_frequency="monthly"
        )
        self.admin_membership = Membership.objects.create(
            circle=self.circle,
            user=self.user,
            role="admin"
        )

    def test_list_circles(self):
        url = reverse("circle-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # DRF pagination returns a dict with results
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["name"], "Test Circle")

    def test_create_circle(self):
        url = reverse("circle-list")
        data = {
            "name": "New Circle",
            "contract_address": "0x0000000000000000000000000000000000000001",
            "admin_wallet": self.user.wallet_address,
            "contribution_amount": "20.00",
            "contribution_frequency": "weekly"
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["name"], "New Circle")
        
        # Verify admin membership was created automatically
        new_circle_id = response.data["id"]
        self.assertTrue(Membership.objects.filter(circle_id=new_circle_id, user=self.user, role="admin").exists())

    @patch("blockchain.bridge.trigger_set_lending_pool_total_members")
    def test_add_member(self, mock_sync_members):
        mock_sync_members.return_value = "0xmocktxhash"
        url = reverse("circle-members", kwargs={"pk": self.circle.id})
        data = {
            "wallet_address": self.other_user.wallet_address
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Membership.objects.filter(circle=self.circle, user=self.other_user, role="member").exists())
        mock_sync_members.assert_called_once_with(2)

    def test_list_members(self):
        url = reverse("circle-members", kwargs={"pk": self.circle.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_request_loan(self):
        url = reverse("circle-loans", kwargs={"pk": self.circle.id})
        data = {
            "amount_matic": "5.0",
            "reason": "Business purchase",
            "repayment_days": 30
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(LoanRequest.objects.filter(circle=self.circle, borrower=self.user).exists())

    def test_vote_loan(self):
        loan = LoanRequest.objects.create(
            circle=self.circle,
            borrower=self.other_user,
            amount_matic=2.5,
            reason="Medical emergency",
            repayment_days=15,
            status="pending"
        )
        url = reverse("circle-loan-vote", kwargs={"pk": self.circle.id, "loan_pk": loan.id})
        data = {"approve": True}
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        loan.refresh_from_db()
        self.assertEqual(loan.status, "approved")

    def test_list_contributions(self):
        Contribution.objects.create(
            circle=self.circle,
            user=self.user,
            amount=10.00,
            tx_hash="0xhash123",
            payment_method="crypto"
        )
        url = reverse("circle-contributions", kwargs={"pk": self.circle.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["tx_hash"], "0xhash123")

    def test_credit_score_view(self):
        # Public lookup by wallet address
        url = reverse("credit-score", kwargs={"wallet": self.user.wallet_address})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["wallet"], self.user.wallet_address)
        # Should return default score since we are not mocking the web3 call or there is no contract deployed on local testnet
        self.assertIn("score", response.data)
