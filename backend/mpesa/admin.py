"""
Django admin configuration for the mpesa app.
"""

from django.contrib import admin

from .models import MpesaPayment


@admin.register(MpesaPayment)
class MpesaPaymentAdmin(admin.ModelAdmin):
    list_display = ("phone_number", "amount", "status", "mpesa_receipt_number", "circle", "created_at")
    list_filter = ("status", "created_at")
    search_fields = ("phone_number", "mpesa_receipt_number", "merchant_request_id", "checkout_request_id")
    readonly_fields = ("id", "created_at")
