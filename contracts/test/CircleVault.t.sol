// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {CircleVault} from "../contracts/CircleVault.sol";

contract CircleVaultTest is Test {
    CircleVault internal vault;

    address internal admin = address(this); // deployer is owner
    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");
    address internal carol = makeAddr("carol");
    address payable internal recipient = payable(makeAddr("recipient"));
    address internal stranger = makeAddr("stranger");

    event Contributed(address indexed member, uint256 amount, uint256 timestamp);
    event MemberAdded(address indexed member);
    event MemberRemoved(address indexed member);
    event Withdrawn(address indexed to, uint256 amount);

    function setUp() public {
        vault = new CircleVault(admin);
    }

    // ── Membership ─────────────────────────────────────────
    function test_OwnerAddsMember() public {
        vm.expectEmit(true, false, false, false);
        emit MemberAdded(alice);
        vault.addMember(alice);

        assertTrue(vault.isMember(alice));
        assertEq(vault.getMemberCount(), 1);
        assertEq(vault.getAllMembers()[0], alice);
    }

    function test_NonOwnerCannotAddMember() public {
        vm.expectRevert(
            abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, stranger)
        );
        vm.prank(stranger);
        vault.addMember(alice);
    }

    function test_CannotAddZeroAddress() public {
        vm.expectRevert("Invalid address");
        vault.addMember(address(0));
    }

    function test_CannotAddDuplicateMember() public {
        vault.addMember(alice);
        vm.expectRevert("Already a member");
        vault.addMember(alice);
    }

    function test_RemoveMemberSwapsArrayCorrectly() public {
        vault.addMember(alice);
        vault.addMember(bob);
        vault.addMember(carol);

        vm.expectEmit(true, false, false, false);
        emit MemberRemoved(bob); // remove the middle one
        vault.removeMember(bob);

        assertFalse(vault.isMember(bob));
        assertEq(vault.getMemberCount(), 2);

        // bob was swapped with the last element (carol)
        address[] memory remaining = vault.getAllMembers();
        assertEq(remaining[0], alice);
        assertEq(remaining[1], carol);
    }

    function test_CannotRemoveNonMember() public {
        vm.expectRevert("Not a member");
        vault.removeMember(alice);
    }

    // ── Contribute ─────────────────────────────────────────
    function test_MemberCanContribute() public {
        vault.addMember(alice);
        vm.deal(alice, 5 ether);

        vm.expectEmit(true, false, false, true);
        emit Contributed(alice, 2 ether, block.timestamp);
        vm.prank(alice);
        vault.contribute{value: 2 ether}();

        assertEq(vault.getContribution(alice), 2 ether);
        assertEq(vault.totalVault(), 2 ether);
        assertEq(vault.getBalance(), 2 ether);
    }

    function test_ContributionsAccumulate() public {
        vault.addMember(alice);
        vm.deal(alice, 5 ether);

        vm.startPrank(alice);
        vault.contribute{value: 1 ether}();
        vault.contribute{value: 1.5 ether}();
        vm.stopPrank();

        assertEq(vault.getContribution(alice), 2.5 ether);
        assertEq(vault.totalVault(), 2.5 ether);
    }

    function test_NonMemberCannotContribute() public {
        vm.deal(stranger, 1 ether);
        vm.expectRevert("Not a member of this circle");
        vm.prank(stranger);
        vault.contribute{value: 1 ether}();
    }

    function test_ZeroContributionReverts() public {
        vault.addMember(alice);
        vm.prank(alice);
        vm.expectRevert("Amount must be greater than 0");
        vault.contribute{value: 0}();
    }

    // ── contributeFor ──────────────────────────────────────
    function test_OwnerCanContributeForMember() public {
        vault.addMember(alice);
        vm.deal(admin, 5 ether);

        vm.expectEmit(true, false, false, true);
        emit Contributed(alice, 2 ether, block.timestamp);
        vault.contributeFor{value: 2 ether}(alice);

        assertEq(vault.getContribution(alice), 2 ether);
        assertEq(vault.totalVault(), 2 ether);
        assertEq(vault.getBalance(), 2 ether);
    }

    function test_NonOwnerCannotContributeForMember() public {
        vault.addMember(alice);
        vm.deal(stranger, 5 ether);

        vm.expectRevert(
            abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, stranger)
        );
        vm.prank(stranger);
        vault.contributeFor{value: 2 ether}(alice);
    }

    function test_ContributeForNonMemberReverts() public {
        vm.deal(admin, 5 ether);
        vm.expectRevert("Recipient is not a member of this circle");
        vault.contributeFor{value: 2 ether}(stranger);
    }

    function test_ContributeForZeroAmountReverts() public {
        vault.addMember(alice);
        vm.expectRevert("Amount must be greater than 0");
        vault.contributeFor{value: 0}(alice);
    }

    // ── receive() direct funding ───────────────────────────
    function test_ReceiveTracksTotalVault() public {
        (bool ok, ) = address(vault).call{value: 3 ether}("");
        assertTrue(ok);
        assertEq(vault.totalVault(), 3 ether);
        assertEq(vault.getBalance(), 3 ether);
    }

    // ── Withdraw ───────────────────────────────────────────
    function test_OwnerCanWithdraw() public {
        vault.addMember(alice);
        vm.deal(alice, 5 ether);
        vm.prank(alice);
        vault.contribute{value: 4 ether}();

        uint256 before = recipient.balance;
        vm.expectEmit(true, false, false, true);
        emit Withdrawn(recipient, 1 ether);
        vault.withdraw(1 ether, recipient);

        assertEq(recipient.balance, before + 1 ether);
        assertEq(vault.getBalance(), 3 ether);
        assertEq(vault.totalVault(), 3 ether);
    }

    function test_NonOwnerCannotWithdraw() public {
        vm.expectRevert(
            abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, stranger)
        );
        vm.prank(stranger);
        vault.withdraw(1, recipient);
    }

    function test_WithdrawMoreThanBalanceReverts() public {
        vault.addMember(alice);
        vm.deal(alice, 1 ether);
        vm.prank(alice);
        vault.contribute{value: 1 ether}();

        vm.expectRevert("Insufficient vault balance");
        vault.withdraw(2 ether, recipient);
    }

    function test_WithdrawToZeroReverts() public {
        (bool ok, ) = address(vault).call{value: 1 ether}("");
        assertTrue(ok);
        vm.expectRevert("Invalid recipient");
        vault.withdraw(1 ether, payable(address(0)));
    }
}
