"""
URL configuration for the mpesa app.

Routes:
- /api/mpesa/stkpush/            -- initiate STK Push via Daraja
- /api/mpesa/callback/           -- webhook for Daraja callbacks
- /api/mpesa/status/<reference>/ -- check payment status
"""

from django.urls import path
from . import views

urlpatterns = [
    path("stkpush/", views.stk_push_view, name="mpesa-stkpush"),
    path("callback/", views.payment_callback, name="mpesa-callback"),
    path("status/<str:reference>/", views.payment_status_view, name="mpesa-status"),
]
