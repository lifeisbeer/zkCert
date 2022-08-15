//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@zk-kit/incremental-merkle-tree.sol/IncrementalBinaryTree.sol";
import "./CertVerifier.sol";

abstract contract Cert {
    using IncrementalBinaryTree for IncrementalTreeData;

    mapping(uint256 => IncrementalTreeData) internal groups;
    mapping(uint256 => address) public groupAdmins;
    mapping(uint256 => bool) internal nullifierHashes;

    uint256 constant SNARK_SCALAR_FIELD = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    uint8 constant DEAPTH = 31;
    uint8 constant ZEROVAL = 0;

    CertVerifier public verifier;

    uint256 groupId = 0;

    event GroupCreated(
        uint256 indexed groupId
    );

    event MemberAdded(
        uint256 indexed groupId,
        uint256 identityCommitment,
        uint256 root
    );

    event MemberRemoved(
        uint256 indexed groupId,
        uint256 identityCommitment,
        uint256 root
    );

    event GroupAdminUpdated(
        uint256 indexed groupId, 
        address indexed newAdmin
    );

    event ProofVerified(
        uint256 indexed groupId, 
        bytes32 signal
    );

    error CallerIsNotTheGroupAdmin();
    error MaxNumberGroups();
    error GroupAlreadyExists();
    error GroupDoesNotExist();
    error UsingTheSameNillifier();

    modifier onlyGroupAdmin(uint256 gId) {
        if (groupAdmins[gId] != msg.sender) {
            revert CallerIsNotTheGroupAdmin();
        }
        _;
    }


    constructor(address _verifier) {
        verifier = CertVerifier(_verifier);
    }

    function _createGroup() internal {
        if (groupId >= SNARK_SCALAR_FIELD) {
            revert MaxNumberGroups();
        }

        if (getDepth(groupId) != 0) {
            revert GroupAlreadyExists();
        }

        groups[groupId].init(DEAPTH, ZEROVAL);

        emit GroupCreated(groupId);

        groupId += 1;
    }

    function createGroup() external {
        _createGroup();

        groupAdmins[groupId] = msg.sender;

        emit GroupAdminUpdated(groupId, msg.sender);
    }

    function updateGroupAdmin(
        uint256 gId, 
        address newAdmin
    ) external onlyGroupAdmin(gId) {
        groupAdmins[gId] = newAdmin;

        emit GroupAdminUpdated(gId, newAdmin);
    }

    /// @dev Adds an identity commitment to an existing group.
    /// @param gId: Id of the group.
    /// @param identityCommitment: New identity commitment.
    function _addMember(
        uint256 gId, 
        uint256 identityCommitment
    ) internal {
        if (getDepth(gId) == 0) {
            revert GroupDoesNotExist();
        }

        groups[gId].insert(identityCommitment);

        uint256 root = getRoot(gId);

        emit MemberAdded(gId, identityCommitment, root);
    }

    function addMember(
        uint256 gId, 
        uint256 identityCommitment
    ) external onlyGroupAdmin(gId) {
        _addMember(gId, identityCommitment);
    }

    /// @dev Removes an identity commitment from an existing group. A proof of membership is
    /// needed to check if the node to be deleted is part of the tree.
    /// @param gId: Id of the group.
    /// @param identityCommitment: Existing identity commitment to be deleted.
    /// @param proofSiblings: Array of the sibling nodes of the proof of membership.
    /// @param proofPathIndices: Path of the proof of membership.
    function _removeMember(
        uint256 gId,
        uint256 identityCommitment,
        uint256[] calldata proofSiblings,
        uint8[] calldata proofPathIndices
    ) internal {
        if (getDepth(gId) == 0) {
            revert GroupDoesNotExist();
        }

        groups[gId].remove(identityCommitment, proofSiblings, proofPathIndices);

        uint256 root = getRoot(gId);

        emit MemberRemoved(gId, identityCommitment, root);
    }

    function removeMember(
        uint256 gId,
        uint256 identityCommitment,
        uint256[] calldata proofSiblings,
        uint8[] calldata proofPathIndices
    ) external onlyGroupAdmin(gId) {
        _removeMember(gId, identityCommitment, proofSiblings, proofPathIndices);
    }

    function getRoot(uint256 gId) public view returns (uint256) {
        return groups[gId].root;
    }

    function getDepth(uint256 gId) public view returns (uint8) {
        return uint8(groups[gId].depth);
    }

    function getNumberOfLeaves(uint256 gId) public view returns (uint256) {
        return groups[gId].numberOfLeaves;
    }

    /// @dev Asserts that no nullifier already exists and if the zero-knowledge proof is valid.
    /// Otherwise it reverts.
    /// @param signal: Semaphore signal.
    /// @param root: Root of the Merkle tree.
    /// @param nullifierHash: Nullifier hash.
    /// @param externalNullifier: External nullifier.
    /// @param proof: Zero-knowledge proof.
    function _verifyProof(
        bytes32 signal,
        uint256 root,
        uint256 nullifierHash,
        uint256 externalNullifier,
        uint256[8] calldata proof
    ) internal view {
        if (nullifierHashes[nullifierHash]) {
            revert UsingTheSameNillifier();
        }

        uint256 signalHash = _hashSignal(signal);

        verifier.verifyProof(
            [proof[0], proof[1]],
            [[proof[2], proof[3]], [proof[4], proof[5]]],
            [proof[6], proof[7]],
            [root, nullifierHash, signalHash, externalNullifier]
        );
    }

    function _saveNullifierHash(uint256 nullifierHash) internal {
        nullifierHashes[nullifierHash] = true;
    }

    function _hashSignal(bytes32 signal) private pure returns (uint256) {
        return uint256(keccak256(abi.encodePacked(signal))) >> 8;
    }

    function verifyProof(
        uint256 gId,
        bytes32 signal,
        uint256 nullifierHash,
        uint256 externalNullifier,
        uint256[8] calldata proof
    ) external {
        uint256 root = getRoot(gId);
        uint8 depth = getDepth(gId);

        if (depth == 0) {
            revert GroupDoesNotExist();
        }

        _verifyProof(signal, root, nullifierHash, externalNullifier, proof);

        _saveNullifierHash(nullifierHash);

        emit ProofVerified(gId, signal);
    }
}
