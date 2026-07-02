// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {CreditScore} from "../contracts/CreditScore.sol";

contract CreditScoreTest is Test {
    CreditScore internal credit;

    address internal admin = address(this); // deployer is owner
    address internal alice = makeAddr("alice");
    address internal stranger = makeAddr("stranger");

    uint256 constant INITIAL = 500;
    uint256 constant MAX = 1000;

    function setUp() public {
        credit = new CreditScore(admin);
    }

    // ── Initial state ──────────────────────────────────────
    function test_UntouchedWalletReturnsInitialScore() public view {
        assertEq(credit.getScore(alice), INITIAL);

        CreditScore.ScoreData memory d = credit.getScoreData(alice);
        assertEq(d.score, INITIAL);
        assertEq(d.onTimeCount, 0);
        assertEq(d.missedCount, 0);
        assertEq(d.repaidCount, 0);
        assertEq(d.lastUpdated, 0);
    }

    function test_Constants() public view {
        assertEq(credit.MAX_SCORE(), MAX);
        assertEq(credit.INITIAL_SCORE(), INITIAL);
        assertEq(credit.CONTRIBUTION_POINTS(), 10);
        assertEq(credit.MISSED_PENALTY(), 20);
        assertEq(credit.REPAYMENT_POINTS(), 15);
    }

    // ── On-time contribution ───────────────────────────────
    function test_OnTimeContributionAddsFromInitial() public {
        credit.recordContribution(alice, true);
        assertEq(credit.getScore(alice), INITIAL + 10); // 510

        CreditScore.ScoreData memory d = credit.getScoreData(alice);
        assertEq(d.onTimeCount, 1);
        assertGt(d.lastUpdated, 0);
    }

    function test_ScoreClampsAtMax() public {
        // from 500, +10 each; 50 calls -> exactly 1000, extras stay clamped
        for (uint256 i = 0; i < 60; i++) {
            credit.recordContribution(alice, true);
        }
        assertEq(credit.getScore(alice), MAX);
    }

    // ── Missed contribution ────────────────────────────────
    function test_MissedContributionSubtracts() public {
        credit.recordContribution(alice, false);
        assertEq(credit.getScore(alice), INITIAL - 20); // 480

        CreditScore.ScoreData memory d = credit.getScoreData(alice);
        assertEq(d.missedCount, 1);
    }

    function test_RecordMissedAliasSubtracts() public {
        credit.recordMissed(alice);
        assertEq(credit.getScore(alice), INITIAL - 20);
        assertEq(credit.getScoreData(alice).missedCount, 1);
    }

    function test_ScoreFloorsAtZero() public {
        // from 500, -20 each; 25 calls -> 0, extras stay at 0 (no underflow)
        for (uint256 i = 0; i < 30; i++) {
            credit.recordMissed(alice);
        }
        assertEq(credit.getScore(alice), 0);
    }

    // ── Repayment ──────────────────────────────────────────
    function test_RepaymentAddsBonus() public {
        credit.recordRepayment(alice);
        assertEq(credit.getScore(alice), INITIAL + 15); // 515
        assertEq(credit.getScoreData(alice).repaidCount, 1);
    }

    // ── Combined history ───────────────────────────────────
    function test_MixedHistory() public {
        credit.recordContribution(alice, true); // 510
        credit.recordContribution(alice, true); // 520
        credit.recordMissed(alice); // 500
        credit.recordRepayment(alice); // 515

        CreditScore.ScoreData memory d = credit.getScoreData(alice);
        assertEq(d.score, 515);
        assertEq(d.onTimeCount, 2);
        assertEq(d.missedCount, 1);
        assertEq(d.repaidCount, 1);
    }

    // ── Access control ─────────────────────────────────────
    function test_NonOwnerCannotRecordContribution() public {
        vm.expectRevert(
            abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, stranger)
        );
        vm.prank(stranger);
        credit.recordContribution(alice, true);
    }

    function test_NonOwnerCannotRecordRepayment() public {
        vm.expectRevert(
            abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, stranger)
        );
        vm.prank(stranger);
        credit.recordRepayment(alice);
    }

    function test_NonOwnerCannotRecordMissed() public {
        vm.expectRevert(
            abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, stranger)
        );
        vm.prank(stranger);
        credit.recordMissed(alice);
    }

    function test_ZeroAddressReverts() public {
        vm.expectRevert("Invalid address");
        credit.recordContribution(address(0), true);
    }
}
