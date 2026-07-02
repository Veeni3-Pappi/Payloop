// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {LendingPool} from "../contracts/LendingPool.sol";

contract LendingPoolTest is Test {
    LendingPool internal pool;

    address internal admin = address(this); // deployer is owner
    address internal vaultAddr = makeAddr("vault");
    address internal borrower = makeAddr("borrower");
    address internal m1 = makeAddr("member1");
    address internal m2 = makeAddr("member2");
    address internal stranger = makeAddr("stranger");

    event LoanRequested(uint256 indexed loanId, address indexed borrower, uint256 amount, string reason);
    event LoanApproved(uint256 indexed loanId);
    event LoanRejected(uint256 indexed loanId);
    event LoanDisbursed(uint256 indexed loanId, address indexed borrower, uint256 amount);
    event LoanRepaid(uint256 indexed loanId, address indexed borrower, uint256 amount);

    function setUp() public {
        pool = new LendingPool(admin, vaultAddr);
        pool.setTotalMembers(3); // majority threshold = 2
    }

    function _fundPool(uint256 amount) internal {
        (bool ok, ) = address(pool).call{value: amount}("");
        assertTrue(ok);
    }

    function _request(uint256 amount) internal returns (uint256 id) {
        vm.prank(borrower);
        id = pool.requestLoan(amount, "business stock", 30);
    }

    // ── Constructor ────────────────────────────────────────
    function test_ConstructorStoresVault() public view {
        assertEq(pool.vaultAddress(), vaultAddr);
        assertEq(pool.owner(), admin);
    }

    function test_ConstructorRejectsZeroVault() public {
        vm.expectRevert("Invalid vault address");
        new LendingPool(admin, address(0));
    }

    // ── requestLoan ────────────────────────────────────────
    function test_RequestLoanStoresData() public {
        vm.expectEmit(true, true, false, true);
        emit LoanRequested(0, borrower, 1 ether, "business stock");
        uint256 id = _request(1 ether);

        assertEq(id, 0);
        assertEq(pool.getLoanCount(), 1);

        LendingPool.Loan memory loan = pool.getLoan(id);
        assertEq(loan.borrower, borrower);
        assertEq(loan.amount, 1 ether);
        assertEq(loan.repaymentDays, 30);
        assertEq(uint256(loan.status), uint256(LendingPool.LoanStatus.Pending));
    }

    function test_LoanIdsIncrement() public {
        uint256 a = _request(1 ether);
        uint256 b = _request(2 ether);
        assertEq(a, 0);
        assertEq(b, 1);
        assertEq(pool.getLoanCount(), 2);
    }

    function test_RequestZeroAmountReverts() public {
        vm.prank(borrower);
        vm.expectRevert("Amount must be greater than 0");
        pool.requestLoan(0, "reason", 30);
    }

    function test_RequestZeroDaysReverts() public {
        vm.prank(borrower);
        vm.expectRevert("Repayment period required");
        pool.requestLoan(1 ether, "reason", 0);
    }

    function test_RequestEmptyReasonReverts() public {
        vm.prank(borrower);
        vm.expectRevert("Reason required");
        pool.requestLoan(1 ether, "", 30);
    }

    // ── Voting ─────────────────────────────────────────────
    function test_MajorityForApprovesLoan() public {
        uint256 id = _request(1 ether);

        vm.prank(m1);
        pool.vote(id, true);
        // one vote is not yet a majority of 3
        assertEq(uint256(pool.getLoan(id).status), uint256(LendingPool.LoanStatus.Pending));

        vm.expectEmit(true, false, false, false);
        emit LoanApproved(id);
        vm.prank(m2);
        pool.vote(id, true);

        LendingPool.Loan memory loan = pool.getLoan(id);
        assertEq(uint256(loan.status), uint256(LendingPool.LoanStatus.Approved));
        assertEq(loan.votesFor, 2);
    }

    function test_MajorityAgainstRejectsLoan() public {
        uint256 id = _request(1 ether);

        vm.prank(m1);
        pool.vote(id, false);

        vm.expectEmit(true, false, false, false);
        emit LoanRejected(id);
        vm.prank(m2);
        pool.vote(id, false);

        assertEq(uint256(pool.getLoan(id).status), uint256(LendingPool.LoanStatus.Rejected));
    }

    function test_BorrowerCannotVoteOwnLoan() public {
        uint256 id = _request(1 ether);
        vm.prank(borrower);
        vm.expectRevert("Cannot vote on own loan");
        pool.vote(id, true);
    }

    function test_CannotVoteTwice() public {
        uint256 id = _request(1 ether);
        vm.prank(m1);
        pool.vote(id, true);

        vm.prank(m1);
        vm.expectRevert("Already voted");
        pool.vote(id, true);
    }

    function test_CannotVoteOnNonPendingLoan() public {
        uint256 id = _request(1 ether);
        vm.prank(m1);
        pool.vote(id, true);
        vm.prank(m2);
        pool.vote(id, true); // now Approved

        vm.prank(stranger);
        vm.expectRevert("Loan is not pending");
        pool.vote(id, true);
    }

    // ── Disbursement ───────────────────────────────────────
    function _approvedLoan(uint256 amount) internal returns (uint256 id) {
        id = _request(amount);
        vm.prank(m1);
        pool.vote(id, true);
        vm.prank(m2);
        pool.vote(id, true);
    }

    function test_DisburseSendsFundsToBorrower() public {
        uint256 id = _approvedLoan(1 ether);
        _fundPool(2 ether);

        uint256 before = borrower.balance;
        vm.expectEmit(true, true, false, true);
        emit LoanDisbursed(id, borrower, 1 ether);
        pool.disburseLoan(id);

        assertEq(borrower.balance, before + 1 ether);
        LendingPool.Loan memory loan = pool.getLoan(id);
        assertEq(uint256(loan.status), uint256(LendingPool.LoanStatus.Disbursed));
        assertGt(loan.disbursedAt, 0);
    }

    function test_NonOwnerCannotDisburse() public {
        uint256 id = _approvedLoan(1 ether);
        _fundPool(2 ether);
        vm.expectRevert(
            abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, stranger)
        );
        vm.prank(stranger);
        pool.disburseLoan(id);
    }

    function test_CannotDisburseUnapprovedLoan() public {
        uint256 id = _request(1 ether); // still Pending
        _fundPool(2 ether);
        vm.expectRevert("Loan not approved");
        pool.disburseLoan(id);
    }

    function test_CannotDisburseWithInsufficientBalance() public {
        uint256 id = _approvedLoan(5 ether);
        _fundPool(1 ether); // not enough
        vm.expectRevert("Insufficient pool balance");
        pool.disburseLoan(id);
    }

    // ── Repayment ──────────────────────────────────────────
    function _disbursedLoan(uint256 amount) internal returns (uint256 id) {
        id = _approvedLoan(amount);
        _fundPool(amount);
        pool.disburseLoan(id);
    }

    function test_BorrowerRepaysExactAmount() public {
        uint256 id = _disbursedLoan(1 ether);
        vm.deal(borrower, 1 ether);

        vm.expectEmit(true, true, false, true);
        emit LoanRepaid(id, borrower, 1 ether);
        vm.prank(borrower);
        pool.repayLoan{value: 1 ether}(id);

        assertEq(uint256(pool.getLoan(id).status), uint256(LendingPool.LoanStatus.Repaid));
    }

    function test_RepayRefundsExcess() public {
        uint256 id = _disbursedLoan(1 ether);
        vm.deal(borrower, 1.5 ether);

        vm.prank(borrower);
        pool.repayLoan{value: 1.5 ether}(id);

        // 0.5 ether refunded, so borrower keeps it
        assertEq(borrower.balance, 0.5 ether);
        assertEq(uint256(pool.getLoan(id).status), uint256(LendingPool.LoanStatus.Repaid));
    }

    function test_OnlyBorrowerCanRepay() public {
        uint256 id = _disbursedLoan(1 ether);
        vm.deal(stranger, 1 ether);
        vm.prank(stranger);
        vm.expectRevert("Only borrower can repay");
        pool.repayLoan{value: 1 ether}(id);
    }

    function test_CannotRepayUndisbursedLoan() public {
        uint256 id = _approvedLoan(1 ether); // Approved, not Disbursed
        vm.deal(borrower, 1 ether);
        vm.prank(borrower);
        vm.expectRevert("Loan not disbursed");
        pool.repayLoan{value: 1 ether}(id);
    }

    function test_CannotUnderpayRepayment() public {
        uint256 id = _disbursedLoan(1 ether);
        vm.deal(borrower, 1 ether);
        vm.prank(borrower);
        vm.expectRevert("Must repay full amount");
        pool.repayLoan{value: 0.5 ether}(id);
    }

    // ── Admin ──────────────────────────────────────────────
    function test_NonOwnerCannotSetTotalMembers() public {
        vm.expectRevert(
            abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, stranger)
        );
        vm.prank(stranger);
        pool.setTotalMembers(10);
    }
}
