"""
Seed the database with realistic demo data for PayLoop.

Populates a single chama ("Mama Wanjiku's Chama") with members,
contributions, loan requests, and notifications so the dashboard,
circles, loans, members, and transparency pages all look alive
during a live demo.

Idempotent: re-running updates the same records rather than
creating duplicates (members keyed by wallet address).

Usage::

    python manage.py seed_demo            # create / refresh demo data
    python manage.py seed_demo --reset    # wipe demo data first, then seed
"""

import os
from datetime import timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.utils import timezone

from accounts.models import User
from circles.models import Circle, Contribution, LoanRequest, Membership
from notifications.models import Notification

# Demo members — deterministic fake wallets so re-runs are idempotent.
MEMBERS = [
    # (display_name, wallet_suffix, role, phone)
    ("Mama Wanjiku", "a1", "admin", "254716649250"),
    ("John Otieno", "b2", "member", "254712000002"),
    ("Grace Achieng", "c3", "member", "254712000003"),
    ("Peter Kamau", "d4", "member", "254712000004"),
    ("Aisha Hassan", "e5", "member", "254712000005"),
]

DEMO_CIRCLE_NAME = "Mama Wanjiku's Chama"


def wallet_for(suffix: str) -> str:
    """Build a deterministic 42-char demo wallet address from a suffix."""
    return "0x" + (suffix * 20)[:40]


class Command(BaseCommand):
    help = "Seed the database with demo data for the PayLoop dashboard."

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Delete existing demo data before seeding.",
        )

    def handle(self, *args, **options):
        if options["reset"]:
            self._reset()

        circle = self._seed_circle()
        users = self._seed_members(circle)
        self._seed_contributions(circle, users)
        self._seed_loans(circle, users)
        self._seed_notifications(users)

        self.stdout.write(self.style.SUCCESS("\n✓ Demo data seeded successfully."))
        self.stdout.write(
            f"  Circle:        {circle.name} ({circle.contract_address or 'no on-chain address'})"
        )
        self.stdout.write(f"  Members:       {Membership.objects.filter(circle=circle).count()}")
        self.stdout.write(f"  Contributions: {Contribution.objects.filter(circle=circle).count()}")
        self.stdout.write(f"  Loans:         {LoanRequest.objects.filter(circle=circle).count()}")
        self.stdout.write(f"  Notifications: {Notification.objects.count()}")

    # ── helpers ─────────────────────────────────────────────────────

    def _reset(self):
        self.stdout.write("Resetting demo data…")
        wallets = [wallet_for(s).lower() for _, s, _, _ in MEMBERS]
        demo_users = User.objects.filter(wallet_address__in=wallets)
        Notification.objects.filter(user__in=demo_users).delete()
        circle = Circle.objects.filter(name=DEMO_CIRCLE_NAME).first()
        if circle:
            Contribution.objects.filter(circle=circle).delete()
            LoanRequest.objects.filter(circle=circle).delete()
            Membership.objects.filter(circle=circle).delete()
            circle.delete()
        demo_users.delete()

    def _seed_circle(self) -> Circle:
        # Anchor the demo circle to the deployed vault so the dashboard's
        # on-chain balance read lines up with real chain data when available.
        vault = os.environ.get("CIRCLE_VAULT_ADDRESS", "").strip().lower()
        admin_wallet = wallet_for(MEMBERS[0][1]).lower()
        circle, _ = Circle.objects.get_or_create(
            name=DEMO_CIRCLE_NAME,
            defaults={
                "contract_address": vault,
                "admin_wallet": admin_wallet,
                "contribution_amount": Decimal("500.00"),
                "contribution_frequency": "monthly",
                "is_active": True,
            },
        )
        # Keep key fields fresh on re-run.
        circle.contract_address = vault or circle.contract_address
        circle.admin_wallet = admin_wallet
        circle.contribution_amount = Decimal("500.00")
        circle.contribution_frequency = "monthly"
        circle.is_active = True
        circle.save()
        return circle

    def _seed_members(self, circle: Circle) -> dict:
        users = {}
        for name, suffix, role, phone in MEMBERS:
            wallet = wallet_for(suffix).lower()
            user, _ = User.objects.get_or_create(
                wallet_address=wallet,
                defaults={"display_name": name, "phone_number": phone},
            )
            user.display_name = name
            user.phone_number = phone
            user.save(update_fields=["display_name", "phone_number"])

            Membership.objects.get_or_create(
                circle=circle, user=user, defaults={"role": role}
            )
            users[suffix] = user
        return users

    def _seed_contributions(self, circle: Circle, users: dict):
        # Clear and rebuild so amounts/timestamps stay consistent on re-run.
        Contribution.objects.filter(circle=circle).delete()
        now = timezone.now()
        # Three monthly rounds; everyone pays KES 500 each round.
        for round_idx in range(3):
            paid_at = now - timedelta(days=30 * (2 - round_idx) + 2)
            for i, (_, suffix, _, _) in enumerate(MEMBERS):
                method = "mpesa" if i % 2 == 0 else "crypto"
                c = Contribution.objects.create(
                    circle=circle,
                    user=users[suffix],
                    amount=Decimal("500.00"),
                    tx_hash=f"0xdemo{round_idx}{suffix}{'0' * 56}"[:66],
                    payment_method=method,
                )
                # Backdate created_at for a realistic VaultChart timeline.
                Contribution.objects.filter(pk=c.pk).update(created_at=paid_at)

    def _seed_loans(self, circle: Circle, users: dict):
        LoanRequest.objects.filter(circle=circle).delete()
        # One approved loan (John) and one pending loan (Grace).
        LoanRequest.objects.create(
            circle=circle,
            borrower=users["b2"],
            amount_matic=Decimal("0.05"),
            reason="School fees for the new term",
            repayment_days=30,
            status="approved",
            on_chain_loan_id=1,
        )
        LoanRequest.objects.create(
            circle=circle,
            borrower=users["c3"],
            amount_matic=Decimal("0.03"),
            reason="Restock for my mitumba stall",
            repayment_days=21,
            status="pending",
        )

    def _seed_notifications(self, users: dict):
        # Keep notifications tied to demo users idempotent.
        Notification.objects.filter(user__in=users.values()).delete()
        samples = [
            (users["c3"], "loan_request", "New loan request",
             "Grace Achieng requested 0.03 MATIC for her mitumba stall."),
            (users["b2"], "loan_approved", "Loan approved 🎉",
             "Your loan of 0.05 MATIC was approved by the chama."),
            (users["a1"], "payment_received", "Contribution received",
             "Aisha Hassan contributed KES 500 to Mama Wanjiku's Chama."),
            (users["a1"], "score_updated", "Credit score updated",
             "Your CreditLoop score increased to 720."),
        ]
        for user, ntype, title, body in samples:
            Notification.objects.create(
                user=user,
                notification_type=ntype,
                title=title,
                body=body,
                status="sent",
            )
