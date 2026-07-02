// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {LoopToken} from "../contracts/LoopToken.sol";

contract LoopTokenTest is Test {
    LoopToken internal token;

    address internal owner = address(this); // deployer is admin/owner
    address internal alice = makeAddr("alice");
    address internal stranger = makeAddr("stranger");

    event TokensMinted(address indexed to, uint256 amount);
    event TokensBurned(address indexed from, uint256 amount);

    function setUp() public {
        token = new LoopToken(owner);
    }

    // ── Metadata ───────────────────────────────────────────
    function test_Metadata() public view {
        assertEq(token.name(), "LoopPoints");
        assertEq(token.symbol(), "LOOP");
        assertEq(token.decimals(), 18);
        assertEq(token.totalSupply(), 0); // no initial supply
        assertEq(token.owner(), owner);
    }

    // ── Mint ───────────────────────────────────────────────
    function test_OwnerCanMint() public {
        vm.expectEmit(true, false, false, true);
        emit TokensMinted(alice, 100e18);
        token.mint(alice, 100e18);

        assertEq(token.balanceOf(alice), 100e18);
        assertEq(token.totalSupply(), 100e18);
    }

    function test_MintAccumulates() public {
        token.mint(alice, 40e18);
        token.mint(alice, 60e18);
        assertEq(token.balanceOf(alice), 100e18);
    }

    function test_NonOwnerCannotMint() public {
        vm.expectRevert(
            abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, stranger)
        );
        vm.prank(stranger);
        token.mint(alice, 1e18);
    }

    function test_MintToZeroReverts() public {
        vm.expectRevert("Cannot mint to zero address");
        token.mint(address(0), 1e18);
    }

    function test_MintZeroAmountReverts() public {
        vm.expectRevert("Amount must be greater than 0");
        token.mint(alice, 0);
    }

    // ── Burn ───────────────────────────────────────────────
    function test_OwnerCanBurn() public {
        token.mint(alice, 100e18);

        vm.expectEmit(true, false, false, true);
        emit TokensBurned(alice, 30e18);
        token.burn(alice, 30e18);

        assertEq(token.balanceOf(alice), 70e18);
        assertEq(token.totalSupply(), 70e18);
    }

    function test_NonOwnerCannotBurn() public {
        token.mint(alice, 100e18);
        vm.expectRevert(
            abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, stranger)
        );
        vm.prank(stranger);
        token.burn(alice, 1e18);
    }

    function test_BurnFromZeroReverts() public {
        vm.expectRevert("Cannot burn from zero address");
        token.burn(address(0), 1e18);
    }

    function test_BurnZeroAmountReverts() public {
        vm.expectRevert("Amount must be greater than 0");
        token.burn(alice, 0);
    }

    function test_BurnMoreThanBalanceReverts() public {
        token.mint(alice, 10e18);
        // OZ ERC20 reverts with ERC20InsufficientBalance
        vm.expectRevert();
        token.burn(alice, 11e18);
    }
}
