// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CircleVault
 * @dev Holds group savings for a PayLoop chama circle.
 *      Members call contribute() to deposit MATIC into the vault.
 *      Only the admin (owner) can add/remove members and withdraw funds.
 */
contract CircleVault is Ownable {
    // ── State ──────────────────────────────────────────────
    mapping(address => uint256) public contributions;
    mapping(address => bool) public isMember;
    address[] public members;
    uint256 public totalVault;

    // ── Events ─────────────────────────────────────────────
    event Contributed(address indexed member, uint256 amount, uint256 timestamp);
    event MemberAdded(address indexed member);
    event MemberRemoved(address indexed member);
    event Withdrawn(address indexed to, uint256 amount);

    // ── Constructor ────────────────────────────────────────
    constructor(address admin) Ownable(admin) {}

    // ── Modifiers ──────────────────────────────────────────
    modifier onlyMember() {
        require(isMember[msg.sender], "Not a member of this circle");
        _;
    }

    // ── Core Functions ─────────────────────────────────────

    /**
     * @dev Deposit MATIC into the vault. Only circle members can contribute.
     */
    function contribute() external payable onlyMember {
        require(msg.value > 0, "Amount must be greater than 0");
        contributions[msg.sender] += msg.value;
        totalVault += msg.value;
        emit Contributed(msg.sender, msg.value, block.timestamp);
    }

    /**
     * @dev Admin-only: add a new member to the circle.
     */
    function addMember(address member) external onlyOwner {
        require(member != address(0), "Invalid address");
        require(!isMember[member], "Already a member");
        isMember[member] = true;
        members.push(member);
        emit MemberAdded(member);
    }

    /**
     * @dev Admin-only: remove a member from the circle.
     */
    function removeMember(address member) external onlyOwner {
        require(isMember[member], "Not a member");
        isMember[member] = false;
        // Remove from array (swap with last)
        for (uint256 i = 0; i < members.length; i++) {
            if (members[i] == member) {
                members[i] = members[members.length - 1];
                members.pop();
                break;
            }
        }
        emit MemberRemoved(member);
    }

    /**
     * @dev Admin-only: withdraw from the vault.
     */
    function withdraw(uint256 amount, address payable to) external onlyOwner {
        require(amount <= address(this).balance, "Insufficient vault balance");
        require(to != address(0), "Invalid recipient");
        totalVault -= amount;
        to.transfer(amount);
        emit Withdrawn(to, amount);
    }

    // ── View Functions ─────────────────────────────────────

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function getContribution(address member) external view returns (uint256) {
        return contributions[member];
    }

    function getMemberCount() external view returns (uint256) {
        return members.length;
    }

    function getAllMembers() external view returns (address[] memory) {
        return members;
    }

    // Allow the contract to receive MATIC directly (e.g., from backend bridge)
    receive() external payable {
        totalVault += msg.value;
    }
}
