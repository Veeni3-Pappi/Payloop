"""
CircleVault ABI for web3.py interactions.

Only includes the functions needed by the backend bridge:
- contribute() -- payable, for M-Pesa-to-chain bridging
- getBalance() -- view, for checking vault balance
"""

CIRCLE_VAULT_ABI = [
    {
        "inputs": [],
        "name": "contribute",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function",
    },
    {
        "inputs": [{"internalType": "address", "name": "member", "type": "address"}],
        "name": "contributeFor",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function",
    },
    {
        "inputs": [],
        "name": "getBalance",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [{"internalType": "address", "name": "member", "type": "address"}],
        "name": "addMember",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    },
    {
        "inputs": [],
        "name": "totalVault",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [],
        "name": "getMemberCount",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "stateMutability": "payable",
        "type": "receive",
    },
]

CREDIT_SCORE_ABI = [
    {
        "inputs": [
            {"internalType": "address", "name": "wallet", "type": "address"},
            {"internalType": "bool", "name": "onTime", "type": "bool"}
        ],
        "name": "recordContribution",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    },
    {
        "inputs": [{"internalType": "address", "name": "wallet", "type": "address"}],
        "name": "recordRepayment",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    },
    {
        "inputs": [{"internalType": "address", "name": "wallet", "type": "address"}],
        "name": "recordMissed",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    },
    {
        "inputs": [{"internalType": "address", "name": "wallet", "type": "address"}],
        "name": "getScore",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function",
    }
]

LENDING_POOL_ABI = [
    {
        "inputs": [{"internalType": "uint256", "name": "_totalMembers", "type": "uint256"}],
        "name": "setTotalMembers",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    }
]

LOOP_TOKEN_ABI = [
    {
        "inputs": [
            {"internalType": "address", "name": "to", "type": "address"},
            {"internalType": "uint256", "name": "amount", "type": "uint256"}
        ],
        "name": "mint",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    }
]
