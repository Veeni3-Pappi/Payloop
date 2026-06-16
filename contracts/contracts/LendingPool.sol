// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title LendingPool
 * @dev Handles loan requests, member voting, auto-disbursement on majority,
 *      and repayment tracking for a PayLoop chama circle.
 */
contract LendingPool is Ownable {
    // ── Enums ──────────────────────────────────────────────
    enum LoanStatus { Pending, Approved, Rejected, Disbursed, Repaid }

    // ── Structs ────────────────────────────────────────────
    struct Loan {
        uint256 id;
        address borrower;
        uint256 amount;
        string reason;
        uint256 repaymentDays;
        uint256 votesFor;
        uint256 votesAgainst;
        LoanStatus status;
        uint256 createdAt;
        uint256 disbursedAt;
        uint256 repaidAt;
    }

    // ── State ──────────────────────────────────────────────
    mapping(uint256 => Loan) public loans;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    uint256 public loanCount;
    uint256 public totalMembers;

    // Reference to the CircleVault (for pulling funds)
    address public vaultAddress;

    // ── Events ─────────────────────────────────────────────
    event LoanRequested(uint256 indexed loanId, address indexed borrower, uint256 amount, string reason);
    event Voted(uint256 indexed loanId, address indexed voter, bool approved);
    event LoanApproved(uint256 indexed loanId);
    event LoanRejected(uint256 indexed loanId);
    event LoanDisbursed(uint256 indexed loanId, address indexed borrower, uint256 amount);
    event LoanRepaid(uint256 indexed loanId, address indexed borrower, uint256 amount);

    // ── Constructor ────────────────────────────────────────
    constructor(address admin, address _vaultAddress) Ownable(admin) {
        require(_vaultAddress != address(0), "Invalid vault address");
        vaultAddress = _vaultAddress;
    }

    // ── Core Functions ─────────────────────────────────────

    /**
     * @dev Request a loan from the circle pool.
     */
    function requestLoan(
        uint256 amount,
        string calldata reason,
        uint256 repaymentDays
    ) external returns (uint256) {
        require(amount > 0, "Amount must be greater than 0");
        require(repaymentDays > 0, "Repayment period required");
        require(bytes(reason).length > 0, "Reason required");

        uint256 loanId = loanCount;
        loans[loanId] = Loan({
            id: loanId,
            borrower: msg.sender,
            amount: amount,
            reason: reason,
            repaymentDays: repaymentDays,
            votesFor: 0,
            votesAgainst: 0,
            status: LoanStatus.Pending,
            createdAt: block.timestamp,
            disbursedAt: 0,
            repaidAt: 0
        });

        loanCount++;
        emit LoanRequested(loanId, msg.sender, amount, reason);
        return loanId;
    }

    /**
     * @dev Vote on a pending loan. Auto-approves/rejects on majority.
     */
    function vote(uint256 loanId, bool approved) external {
        Loan storage loan = loans[loanId];
        require(loan.status == LoanStatus.Pending, "Loan is not pending");
        require(loan.borrower != msg.sender, "Cannot vote on own loan");
        require(!hasVoted[loanId][msg.sender], "Already voted");

        hasVoted[loanId][msg.sender] = true;

        if (approved) {
            loan.votesFor++;
        } else {
            loan.votesAgainst++;
        }

        emit Voted(loanId, msg.sender, approved);

        // Auto-approve if majority votes for
        if (loan.votesFor > totalMembers / 2) {
            loan.status = LoanStatus.Approved;
            emit LoanApproved(loanId);
        }

        // Auto-reject if majority votes against
        if (loan.votesAgainst > totalMembers / 2) {
            loan.status = LoanStatus.Rejected;
            emit LoanRejected(loanId);
        }
    }

    /**
     * @dev Disburse an approved loan. Admin-only. Sends MATIC to borrower.
     */
    function disburseLoan(uint256 loanId) external onlyOwner {
        Loan storage loan = loans[loanId];
        require(loan.status == LoanStatus.Approved, "Loan not approved");
        require(address(this).balance >= loan.amount, "Insufficient pool balance");

        loan.status = LoanStatus.Disbursed;
        loan.disbursedAt = block.timestamp;

        payable(loan.borrower).transfer(loan.amount);
        emit LoanDisbursed(loanId, loan.borrower, loan.amount);
    }

    /**
     * @dev Repay a disbursed loan.
     */
    function repayLoan(uint256 loanId) external payable {
        Loan storage loan = loans[loanId];
        require(loan.status == LoanStatus.Disbursed, "Loan not disbursed");
        require(msg.sender == loan.borrower, "Only borrower can repay");
        require(msg.value >= loan.amount, "Must repay full amount");

        loan.status = LoanStatus.Repaid;
        loan.repaidAt = block.timestamp;

        // Refund excess
        if (msg.value > loan.amount) {
            payable(msg.sender).transfer(msg.value - loan.amount);
        }

        emit LoanRepaid(loanId, msg.sender, loan.amount);
    }

    /**
     * @dev Update total member count (admin only, synced from CircleVault).
     */
    function setTotalMembers(uint256 _totalMembers) external onlyOwner {
        totalMembers = _totalMembers;
    }

    // ── View Functions ─────────────────────────────────────

    function getLoan(uint256 loanId) external view returns (Loan memory) {
        return loans[loanId];
    }

    function getLoanCount() external view returns (uint256) {
        return loanCount;
    }

    // Allow receiving MATIC for loan pool funding
    receive() external payable {}
}
