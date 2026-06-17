"""
DRF serializers for wallet-based authentication.

WalletAuthSerializer validates a MetaMask signature and returns
the wallet address after recovering the signer via eth_account.
"""

from rest_framework import serializers
from eth_account.messages import encode_defunct
from eth_account import Account


class WalletAuthSerializer(serializers.Serializer):
    """
    Validates a signed message from MetaMask.

    Expected request body::

        {
            "wallet_address": "0x...",
            "signature": "0x...",
            "message": "Sign this message to verify your wallet..."
        }
    """

    wallet_address = serializers.CharField(
        max_length=42,
        help_text="Ethereum wallet address (0x-prefixed, 42 characters).",
    )
    signature = serializers.CharField(
        help_text="Hex-encoded signature from MetaMask personal_sign.",
    )
    message = serializers.CharField(
        help_text="The original message the user signed.",
    )

    def validate(self, attrs):
        """
        Recover the signer from the signature and verify it matches
        the claimed wallet address.
        """
        wallet = attrs["wallet_address"].lower()
        signature = attrs["signature"]
        message = attrs["message"]

        try:
            msg = encode_defunct(text=message)
            recovered = Account.recover_message(msg, signature=signature)
        except Exception as exc:
            raise serializers.ValidationError(
                f"Signature verification failed: {exc}"
            )

        if recovered.lower() != wallet:
            raise serializers.ValidationError(
                "Signature does not match the provided wallet address."
            )

        attrs["wallet_address"] = wallet
        return attrs
