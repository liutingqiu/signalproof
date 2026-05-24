// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Sentinel Watch — 反作弊案例存证与投票合约
 * @notice 将 AI 分析报告哈希存证于链上，支持社区投票
 * @dev 部署于 Mantle Network（主网或测试网）
 */
contract CaseReport {

    // ── 数据结构 ──────────────────────────────────────────

    enum Verdict { PENDING, CHEATING, CLEAN, INCONCLUSIVE }

    struct Case {
        string    caseId;          // 案例唯一标识
        address   reporter;        // 举报者地址
        string    evidenceHash;    // AI 分析报告 IPFS / 内容哈希
        uint256   reportedAt;      // 举报时间戳

        uint256   voteCheat;       // 「作弊」票数
        uint256   voteClean;       // 「清白」票数
        uint256   voteUncertain;   // 「不确定」票数

        Verdict   verdict;         // 最终判定
        bool      resolved;        // 是否已结案
    }

    // ── 状态变量 ──────────────────────────────────────────

    /// @notice 案例计数（用于生成递增 ID）
    uint256 public caseCount;

    /// @notice 案例映射：ID → 案例详情
    mapping(string => Case) public cases;

    /// @notice 投票记录：案例ID → 投票者地址 → 是否已投
    mapping(string => mapping(address => bool)) public hasVoted;

    /// @notice 案例 ID 列表
    string[] public caseIds;

    // ── 事件 ──────────────────────────────────────────────

    event CaseReported(string indexed caseId, address indexed reporter, string evidenceHash);
    event Voted(string indexed caseId, address indexed voter, uint8 choice);
    event CaseResolved(string indexed caseId, Verdict verdict);

    // ── 核心函数 ──────────────────────────────────────────

    /**
     * @notice 提交新案例 — AI 分析完成后上链存证
     * @param _caseId    案例唯一标识
     * @param _evidenceHash  AI 分析报告哈希
     */
    function reportCase(string calldata _caseId, string calldata _evidenceHash) external {
        require(bytes(cases[_caseId].caseId).length == 0, "Case ID already exists");

        Case storage c = cases[_caseId];
        c.caseId = _caseId;
        c.reporter = msg.sender;
        c.evidenceHash = _evidenceHash;
        c.reportedAt = block.timestamp;

        caseCount++;
        caseIds.push(_caseId);

        emit CaseReported(_caseId, msg.sender, _evidenceHash);
    }

    /**
     * @notice 社区投票
     * @param _caseId  案例 ID
     * @param _choice  投票选项：1=作弊, 2=清白, 3=不确定
     */
    function vote(string calldata _caseId, uint8 _choice) external {
        require(_choice >= 1 && _choice <= 3, "Invalid choice (1=cheat, 2=clean, 3=uncertain)");
        require(!hasVoted[_caseId][msg.sender], "Already voted");
        require(!cases[_caseId].resolved, "Case already resolved");

        hasVoted[_caseId][msg.sender] = true;

        if (_choice == 1) {
            cases[_caseId].voteCheat++;
        } else if (_choice == 2) {
            cases[_caseId].voteClean++;
        } else {
            cases[_caseId].voteUncertain++;
        }

        emit Voted(_caseId, msg.sender, _choice);
    }

    /**
     * @notice 结案判定（仅举报者或合约 owner 可调用）
     * @param _caseId 案例 ID
     */
    function resolveCase(string calldata _caseId) external {
        Case storage c = cases[_caseId];
        require(!c.resolved, "Already resolved");

        uint256 total = c.voteCheat + c.voteClean + c.voteUncertain;

        // 投票不足时默认 inconclusive
        if (total < 5) {
            c.verdict = Verdict.INCONCLUSIVE;
        } else if (c.voteCheat * 100 / total >= 66) {
            c.verdict = Verdict.CHEATING;
        } else if (c.voteClean * 100 / total >= 66) {
            c.verdict = Verdict.CLEAN;
        } else {
            c.verdict = Verdict.INCONCLUSIVE;
        }

        c.resolved = true;
        emit CaseResolved(_caseId, c.verdict);
    }

    // ── 查询函数 ──────────────────────────────────────────

    /// @notice 获取案例总数
    function getCaseCount() external view returns (uint256) {
        return caseCount;
    }

    /// @notice 获取所有案例 ID
    function getAllCaseIds() external view returns (string[] memory) {
        return caseIds;
    }

    /// @notice 获取案例详情
    function getCase(string calldata _caseId) external view returns (
        string  memory caseId,
        address reporter,
        string  memory evidenceHash,
        uint256 reportedAt,
        uint256 voteCheat,
        uint256 voteClean,
        uint256 voteUncertain,
        Verdict verdict,
        bool    resolved
    ) {
        Case storage c = cases[_caseId];
        return (
            c.caseId,
            c.reporter,
            c.evidenceHash,
            c.reportedAt,
            c.voteCheat,
            c.voteClean,
            c.voteUncertain,
            c.verdict,
            c.resolved
        );
    }

    /// @notice 检查是否已投票
    function checkVoted(string calldata _caseId, address _voter) external view returns (bool) {
        return hasVoted[_caseId][_voter];
    }
}
