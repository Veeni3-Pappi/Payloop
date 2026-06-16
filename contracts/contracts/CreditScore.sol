// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CreditScore
 * @dev On-chain credit reputation tracker for PayLoop.
 *      Score range: 0 – 1000.
 *      +10 on-time contribution, -20 missed, +15 loan repaid.
 */
contract CreditScore is Ownable {
    // ── Structs ────────────────────────────────────────────
    struct ScoreData {
        uint256 score;
        uint256 onTimeCount;
        uint256 missedCount;
        uint256 repaidCount;
        uint256 lastUpdated;
    }

    // ── State ──────────────────────────────────────────────
    mapping(address => ScoreData) public scores;
    uint256 public constant MAX_SCORE = 1000;
    uint256 public constant INITIAL_SCORE = 500;

    // Scoring weights
    uint256 public constant CONTRIBUTION_POINTS = 10;
    uint256 public constant MISSED_PENALTY = 20;
    uint256 public constant REPAYMENT_POINTS = 15;

    // ── Events ─────────────────────────────────────────────
    event ScoreUpdated(address indexed wallet, uint256 newScore, string reason);
    event ContributionRecorded(address indexed wallet, bool onTime);
    event RepaymentRecorded(address indexed wallet);

    // ── Constructor ────────────────────────────────────────
    constructor(address admin) Ownable(admin) {}

    // ── Core Functions ─────────────────────────────────────

    /**
     * @dev Record a contribution event. Rewards on-time, penalises missed.
     * @param wallet The member's wallet address.
     * @param onTime Whether the contribution was made on time.
     */
    function recordContribution(address wallet, bool onTime) external onlyOwner {
        require(wallet != address(0), "Invalid address");
        _initScoreIfNeeded(wallet);

        ScoreData storage data = scores[wallet];

        if (onTime) {
            data.onTimeCount++;
            data.score = _addScore(data.score, CONTRIBUTION_POINTS);
            emit ScoreUpdated(wallet, data.score, "on-time contribution");
        } else {
            data.missedCount++;
            data.score = _subtractScore(data.score, MISSED_PENALTY);
            emit ScoreUpdated(wallet, data.score, "missed contribution");
        }

        data.lastUpdated = block.timestamp;
        emit ContributionRecorded(wallet, onTime);
    }

    /**
     * @dev Record a successful loan repayment. Awards bonus points.
     * @param wallet The borrower's wallet address.
     */
    function recordRepayment(address wallet) external onlyOwner {
        require(wallet != address(0), "Invalid address");
        _initScoreIfNeeded(wallet);

        ScoreData storage data = scores[wallet];
        data.repaidCount++;
        data.score = _addScore(data.score, REPAYMENT_POINTS);
        data.lastUpdated = block.timestamp;

        emit RepaymentRecorded(wallet);
        emit ScoreUpdated(wallet, data.score, "loan repaid");
    }

    /**
     * @dev Record a missed contribution (alias for recordContribution(wallet, false)).
     */
    function recordMissed(address wallet) external onlyOwner {
        require(wallet != address(0), "Invalid address");
        _initScoreIfNeeded(wallet);

        ScoreData storage data = scores[wallet];
        data.missedCount++;
        data.score = _subtractScore(data.score, MISSED_PENALTY);
        data.lastUpdated = block.timestamp;

        emit ContributionRecorded(wallet, false);
        emit ScoreUpdated(wallet, data.score, "missed contribution");
    }

    // ── View Functions ─────────────────────────────────────

    function getScore(address wallet) external view returns (uint256) {
        if (scores[wallet].lastUpdated == 0) {
            return INITIAL_SCORE;
        }
        return scores[wallet].score;
    }

    function getScoreData(address wallet) external view returns (ScoreData memory) {
        if (scores[wallet].lastUpdated == 0) {
            return ScoreData({
                score: INITIAL_SCORE,
                onTimeCount: 0,
                missedCount: 0,
                repaidCount: 0,
                lastUpdated: 0
            });
        }
        return scores[wallet];
    }

    // ── Internal Helpers ───────────────────────────────────

    function _initScoreIfNeeded(address wallet) internal {
        if (scores[wallet].lastUpdated == 0) {
            scores[wallet].score = INITIAL_SCORE;
        }
    }

    function _addScore(uint256 current, uint256 points) internal pure returns (uint256) {
        uint256 newScore = current + points;
        return newScore > MAX_SCORE ? MAX_SCORE : newScore;
    }

    function _subtractScore(uint256 current, uint256 penalty) internal pure returns (uint256) {
        if (penalty >= current) return 0;
        return current - penalty;
    }
}
