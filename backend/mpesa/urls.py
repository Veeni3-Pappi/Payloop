"""
URL configuration for the mpesa app.

Routes:
- /api/mpesa/stkpush/            -- initiate STK Push via PayHero
- /api/mpesa/callback/           -- webhook for PayHero callbacks
- /api/mpesa/status/<reference>/ -- check payment status
"""

from django.urls import path
from . import views

urlpatterns = [
    path("stkpush/", views.stk_push_view, name="mpesa-stkpush"),
    path("callback/", views.payment_callback, name="mpesa-callback"),
    path("status/<str:reference>/", views.payment_status_view, name="mpesa-status"),
]
