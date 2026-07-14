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

from .abi import CIRCLE_VAULT_ABI, CREDIT_SCORE_ABI, LENDING_POOL_ABI, LOOP_TOKEN_ABI

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


def get_vault_contract(w3: Web3, address: str | None = None):
    """Return a web3 contract instance for CircleVault."""
    vault_address = address or os.environ.get("CIRCLE_VAULT_ADDRESS", "")
    if not vault_address:
        raise ValueError("CIRCLE_VAULT_ADDRESS not set in environment")
    return w3.eth.contract(
        address=Web3.to_checksum_address(vault_address),
        abi=CIRCLE_VAULT_ABI,
    )


def kes_to_matic(amount_kes: Decimal) -> Decimal:
    """Convert KES amount to MATIC using the demo conversion rate."""
    return amount_kes * KES_TO_MATIC_RATE


def trigger_on_chain_contribution(
    amount_kes: Decimal,
    member_wallet: str | None = None,
    vault_address: str | None = None,
) -> str | None:
    """
    Send a MATIC contribution to CircleVault on behalf of a member.

    This is called after a successful M-Pesa payment. The backend
    wallet signs and sends the transaction.

    Args:
        amount_kes: The M-Pesa payment amount in KES.
        member_wallet: The wallet address of the contributing member.
        vault_address: The contract address of the CircleVault.

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

        contract = get_vault_contract(w3, vault_address)
        account = w3.eth.account.from_key(private_key)

        # Convert KES to MATIC, then to wei
        matic_amount = kes_to_matic(amount_kes)
        value_wei = w3.to_wei(float(matic_amount), "ether")

        # Build transaction
        nonce = w3.eth.get_transaction_count(account.address)
        if member_wallet:
            checksum_member = w3.to_checksum_address(member_wallet)
            tx = contract.functions.contributeFor(checksum_member).build_transaction(
                {
                    "from": account.address,
                    "value": value_wei,
                    "nonce": nonce,
                    "gas": 150000,
                    "gasPrice": w3.eth.gas_price,
                }
            )
        else:
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
            "On-chain contribution sent: KES %s -> %s MATIC, member: %s, vault: %s, tx: %s",
            amount_kes, matic_amount, member_wallet, vault_address or "default", hex_hash,
        )
        return hex_hash

    except Exception as exc:
        logger.error("On-chain contribution failed: %s", exc)
        return None


def get_credit_score_contract(w3: Web3):
    """Return a web3 contract instance for CreditScore."""
    address = os.environ.get("CREDIT_SCORE_ADDRESS", "")
    if not address:
        raise ValueError("CREDIT_SCORE_ADDRESS not set in environment")
    return w3.eth.contract(
        address=Web3.to_checksum_address(address),
        abi=CREDIT_SCORE_ABI,
    )


def get_lending_pool_contract(w3: Web3):
    """Return a web3 contract instance for LendingPool."""
    address = os.environ.get("LENDING_POOL_ADDRESS", "")
    if not address:
        raise ValueError("LENDING_POOL_ADDRESS not set in environment")
    return w3.eth.contract(
        address=Web3.to_checksum_address(address),
        abi=LENDING_POOL_ABI,
    )


def _send_owner_transaction(w3: Web3, contract_fn, gas_limit: int = 150000) -> str | None:
    private_key = os.environ.get("BACKEND_WALLET_PRIVATE_KEY", "")
    if not private_key:
        logger.warning("BACKEND_WALLET_PRIVATE_KEY not set, skipping owner-only tx")
        return None
    try:
        account = w3.eth.account.from_key(private_key)
        nonce = w3.eth.get_transaction_count(account.address)
        tx = contract_fn.build_transaction(
            {
                "from": account.address,
                "nonce": nonce,
                "gas": gas_limit,
                "gasPrice": w3.eth.gas_price,
            }
        )
        signed_tx = w3.eth.account.sign_transaction(tx, private_key)
        tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
        return tx_hash.hex()
    except Exception as exc:
        logger.error("On-chain owner transaction execution failed: %s", exc)
        return None


def trigger_record_credit_score_contribution(member_wallet: str, on_time: bool = True) -> str | None:
    """Record a contribution status (on-time or missed) on-chain in CreditScore contract."""
    try:
        w3 = get_web3()
        if not w3.is_connected():
            return None
        contract = get_credit_score_contract(w3)
        checksum_member = w3.to_checksum_address(member_wallet)
        tx_fn = contract.functions.recordContribution(checksum_member, on_time)
        tx_hash = _send_owner_transaction(w3, tx_fn)
        logger.info("Recorded contribution on-chain for %s (on_time=%s), tx: %s", member_wallet, on_time, tx_hash)
        return tx_hash
    except Exception as exc:
        logger.error("Failed to record credit score contribution: %s", exc)
        return None


def trigger_record_credit_score_repayment(member_wallet: str) -> str | None:
    """Record a loan repayment on-chain in CreditScore contract."""
    try:
        w3 = get_web3()
        if not w3.is_connected():
            return None
        contract = get_credit_score_contract(w3)
        checksum_member = w3.to_checksum_address(member_wallet)
        tx_fn = contract.functions.recordRepayment(checksum_member)
        tx_hash = _send_owner_transaction(w3, tx_fn)
        logger.info("Recorded loan repayment on-chain for %s, tx: %s", member_wallet, tx_hash)
        return tx_hash
    except Exception as exc:
        logger.error("Failed to record credit score repayment: %s", exc)
        return None


def trigger_set_lending_pool_total_members(total_members: int) -> str | None:
    """Update total member count in LendingPool contract (for majority vote calculations)."""
    try:
        w3 = get_web3()
        if not w3.is_connected():
            return None
        contract = get_lending_pool_contract(w3)
        tx_fn = contract.functions.setTotalMembers(total_members)
        tx_hash = _send_owner_transaction(w3, tx_fn)
        logger.info("Updated LendingPool totalMembers to %s on-chain, tx: %s", total_members, tx_hash)
        return tx_hash
    except Exception as exc:
        logger.error("Failed to update LendingPool total members: %s", exc)
        return None


def get_loop_token_contract(w3: Web3):
    """Return a web3 contract instance for LoopToken."""
    address = os.environ.get("LOOP_TOKEN_ADDRESS", "")
    if not address:
        raise ValueError("LOOP_TOKEN_ADDRESS not set in environment")
    return w3.eth.contract(
        address=Web3.to_checksum_address(address),
        abi=LOOP_TOKEN_ABI,
    )


def trigger_mint_loop_token(member_wallet: str, amount_ether: float = 10.0) -> str | None:
    """Mint ERC-20 LOOP reward tokens to a member's wallet for on-time contributions."""
    try:
        w3 = get_web3()
        if not w3.is_connected():
            return None
        contract = get_loop_token_contract(w3)
        checksum_member = w3.to_checksum_address(member_wallet)
        # Convert LOOP amount to wei units (18 decimals)
        amount_wei = w3.to_wei(amount_ether, "ether")
        tx_fn = contract.functions.mint(checksum_member, amount_wei)
        tx_hash = _send_owner_transaction(w3, tx_fn)
        logger.info("Minted %s LOOP reward tokens on-chain to %s, tx: %s", amount_ether, member_wallet, tx_hash)
        return tx_hash
    except Exception as exc:
        logger.error("Failed to mint LOOP reward tokens: %s", exc)
        return None
