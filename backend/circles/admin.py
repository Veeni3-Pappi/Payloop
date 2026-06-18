"""
Django admin configuration for the circles app.
"""

from django.contrib import admin

from .models import Circle, Contribution, LoanRequest, Membership


@admin.register(Circle)
class CircleAdmin(admin.ModelAdmin):
    list_display = ("name", "admin_wallet", "contribution_amount", "contribution_frequency", "is_active", "created_at")
    list_filter = ("is_active", "contribution_frequency", "created_at")
    search_fields = ("name", "admin_wallet", "contract_address")
    readonly_fields = ("id", "created_at")


@admin.register(Membership)
class MembershipAdmin(admin.ModelAdmin):
    list_display = ("user", "circle", "role", "joined_at")
    list_filter = ("role", "joined_at")
    search_fields = ("user__wallet_address", "circle__name")
    readonly_fields = ("id", "joined_at")


@admin.register(Contribution)
class ContributionAdmin(admin.ModelAdmin):
    list_display = ("user", "circle", "amount", "payment_method", "tx_hash", "created_at")
    list_filter = ("payment_method", "created_at")
    search_fields = ("user__wallet_address", "circle__name", "tx_hash")
    readonly_fields = ("id", "created_at")


@admin.register(LoanRequest)
class LoanRequestAdmin(admin.ModelAdmin):
    list_display = ("borrower", "circle", "amount_matic", "status", "repayment_days", "created_at")
    list_filter = ("status", "created_at")
    search_fields = ("borrower__wallet_address", "circle__name", "reason")
    readonly_fields = ("id", "created_at")
