// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title LoopToken
 * @dev ERC-20 reward token for PayLoop.
 *      Name: "LoopPoints", Symbol: "LOOP"
 *      Minted by owner (backend wallet) on each on-time contribution.
 *      No initial supply — minted on demand.
 */
contract LoopToken is ERC20, Ownable {

    // ── Events ─────────────────────────────────────────────
    event TokensMinted(address indexed to, uint256 amount);
    event TokensBurned(address indexed from, uint256 amount);

    // ── Constructor ────────────────────────────────────────
    constructor(address admin) ERC20("LoopPoints", "LOOP") Ownable(admin) {}

    // ── Core Functions ─────────────────────────────────────

    /**
     * @dev Mint LOOP tokens to a member. Owner-only.
     * @param to Recipient wallet address.
     * @param amount Number of tokens (with 18 decimals).
     */
    function mint(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Cannot mint to zero address");
        require(amount > 0, "Amount must be greater than 0");
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }

    /**
     * @dev Burn LOOP tokens from an address. Owner-only (penalty mechanic).
     * @param from Wallet to burn from.
     * @param amount Number of tokens to burn.
     */
    function burn(address from, uint256 amount) external onlyOwner {
        require(from != address(0), "Cannot burn from zero address");
        require(amount > 0, "Amount must be greater than 0");
        _burn(from, amount);
        emit TokensBurned(from, amount);
    }
}
