"""
Blockchain bridge for PayLoop.

Provides helper functions to interact with the CircleVault smart
contract on Polygon Amoy testnet via web3.py.

Used by the M-Pesa callback to trigger on-chain contributions
after a successful mobile money payment.

Environment variables required:
    POLYGON_RPC_URL              -- Polygon Amoy RPC endpoint
    BACKEND_WALLET_PRIVATE_KEY   -- Private key of the backend wallet
    CIRCLE_VAULT_ADDRESS         -- Deployed CircleVault contract address
"""

import logging
import os
from decimal import Decimal

from web3 import Web3

from .abi import CIRCLE_VAULT_ABI

logger = logging.getLogger(__name__)

# KES to MATIC conversion rate (approximate, for demo purposes)
KES_TO_MATIC_RATE = Decimal("0.000005")


def get_web3() -> Web3:
    """Create and return a Web3 instance connected to Polygon Amoy."""
    rpc_url = os.environ.get(
        "POLYGON_RPC_URL", "https://rpc-amoy.polygon.technology"
    )
    w3 = Web3(Web3.HTTPProvider(rpc_url))
    if not w3.is_connected():
        logger.error("Failed to connect to Polygon RPC: %s", rpc_url)
    return w3


def get_vault_contract(w3: Web3):
    """Return a web3 contract instance for CircleVault."""
    address = os.environ.get("CIRCLE_VAULT_ADDRESS", "")
    if not address:
        raise ValueError("CIRCLE_VAULT_ADDRESS not set in environment")
    return w3.eth.contract(
        address=Web3.to_checksum_address(address),
        abi=CIRCLE_VAULT_ABI,
    )


def kes_to_matic(amount_kes: Decimal) -> Decimal:
    """Convert KES amount to MATIC using the demo conversion rate."""
    return amount_kes * KES_TO_MATIC_RATE


def trigger_on_chain_contribution(amount_kes: Decimal) -> str | None:
    """
    Send a MATIC contribution to CircleVault on behalf of a member.

    This is called after a successful M-Pesa payment. The backend
    wallet signs and sends the transaction.

    Args:
        amount_kes: The M-Pesa payment amount in KES.

    Returns:
        The transaction hash hex string, or None on failure.
    """
    private_key = os.environ.get("BACKEND_WALLET_PRIVATE_KEY", "")
    if not private_key:
        logger.warning("BACKEND_WALLET_PRIVATE_KEY not set, skipping on-chain tx")
        return None

    try:
        w3 = get_web3()
        if not w3.is_connected():
            logger.error("Web3 not connected, skipping on-chain tx")
            return None

        contract = get_vault_contract(w3)
        account = w3.eth.account.from_key(private_key)

        # Convert KES to MATIC, then to wei
        matic_amount = kes_to_matic(amount_kes)
        value_wei = w3.to_wei(float(matic_amount), "ether")

        # Build transaction
        nonce = w3.eth.get_transaction_count(account.address)
        tx = contract.functions.contribute().build_transaction(
            {
                "from": account.address,
                "value": value_wei,
                "nonce": nonce,
                "gas": 100000,
                "gasPrice": w3.eth.gas_price,
            }
        )

        # Sign and send
        signed_tx = w3.eth.account.sign_transaction(tx, private_key)
        tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
        hex_hash = tx_hash.hex()

        logger.info(
            "On-chain contribution sent: KES %s -> %s MATIC, tx: %s",
            amount_kes, matic_amount, hex_hash,
        )
        return hex_hash

    except Exception as exc:
        logger.error("On-chain contribution failed: %s", exc)
        return None
