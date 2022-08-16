//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@zk-kit/incremental-merkle-tree.sol/IncrementalBinaryTree.sol";
import "./CertVerifier.sol";

/// @title zkCert: A smart contract for zero-knowledge digital certificates on the blockchain 
/// @author Theodoros Constantinides
/// @notice This is heavily based on the Semaphore smart contracts
contract Cert {
    using IncrementalBinaryTree for IncrementalTreeData;

    CertVerifier public verifier;

    mapping(uint256 => IncrementalTreeData) internal groups;
    mapping(uint256 => string) public groupDescription;
    mapping(uint256 => address) public groupAdmins;
    mapping(uint256 => bool) internal nullifierHashes;

    uint256 constant SNARK_SCALAR_FIELD = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    uint8 constant DEAPTH = 10;
    uint8 constant ZEROVAL = 0;

    uint256 internal groupId = 0;

    /// @notice Notify users about new groups
    event GroupCreated(
        uint256 indexed groupId,
        string description
    );

    /// @notice Inform users who the admin of a group is 
    event GroupAdminUpdated(
        uint256 indexed groupId, 
        address indexed newAdmin
    );

    /// @notice Notify users about new members in a group
    event MemberAdded(
        uint256 indexed groupId,
        uint256 identityCommitment,
        uint256 root
    );

    /// @notice Notify users about the removal of members from a group
    event MemberRemoved(
        uint256 indexed groupId,
        uint256 identityCommitment,
        uint256 root
    );

    /// @notice Notify users about new proofs
    event ProofVerified(
        uint256 indexed groupId, 
        address indexed recipient,
        uint256 grade
    );

    error CallerIsNotTheGroupAdmin();
    error MaxNumberGroups();
    error GroupAlreadyExists();
    error GroupDoesNotExist();
    error UsingTheSameNullifier();
    error InvalidProof();

    modifier onlyGroupAdmin(uint256 gId) {
        if (groupAdmins[gId] != msg.sender) {
            revert CallerIsNotTheGroupAdmin();
        }
        _;
    }


    /// @dev Constructor: sets up the verifier
    /// @param _verifier: address of the deployed verifier contract
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

        emit GroupCreated(groupId, groupDescription[groupId]);
    }

    /// @dev create new group
    /// @param description: group description (e.g. "ZKU certificate group")
    function createGroup(string calldata description) external {
        _createGroup();

        groupAdmins[groupId] = msg.sender;

        groupDescription[groupId] = description;

        emit GroupAdminUpdated(groupId, msg.sender);

        groupId += 1;
    }

    /// @dev update group admin
    /// @param gId: group id number
    /// @param newAdmin: future admin of the group
    function updateGroupAdmin(
        uint256 gId, 
        address newAdmin
    ) external onlyGroupAdmin(gId) {
        groupAdmins[gId] = newAdmin;

        emit GroupAdminUpdated(gId, newAdmin);
    }

    function _addMember(
        uint256 gId, 
        uint256 appId
    ) internal {
        if (getDepth(gId) == 0) {
            revert GroupDoesNotExist();
        }

        groups[gId].insert(appId);

        uint256 root = getRoot(gId);

        emit MemberAdded(gId, appId, root);
    }

    /// @dev add a new member to a group
    /// @param gId: group id number
    /// @param appId: the application id of a user
    function addMember(
        uint256 gId, 
        uint256 appId
    ) external onlyGroupAdmin(gId) {
        _addMember(gId, appId);
    }

    function _removeMember(
        uint256 gId,
        uint256 appId,
        uint256[] calldata proofSiblings,
        uint8[] calldata proofPathIndices
    ) internal {
        if (getDepth(gId) == 0) {
            revert GroupDoesNotExist();
        }

        groups[gId].remove(appId, proofSiblings, proofPathIndices);

        uint256 root = getRoot(gId);

        emit MemberRemoved(gId, appId, root);
    }

    /// @dev remove an existing member from a group
    /// @param gId: group id number
    /// @param appId: the application id of a user
    /// @param proofSiblings: array of the sibling nodes of the proof of membership
    /// @param proofPathIndices: path of the proof of membership
    function removeMember(
        uint256 gId,
        uint256 appId,
        uint256[] calldata proofSiblings,
        uint8[] calldata proofPathIndices
    ) external onlyGroupAdmin(gId) {
        _removeMember(gId, appId, proofSiblings, proofPathIndices);
    }

    /// @dev get the root of a group Merkle tree
    /// @param gId: group id number
    function getRoot(uint256 gId) public view returns (uint256) {
        return groups[gId].root;
    }

    /// @dev get the depth of a group Merkle tree
    /// @param gId: group id number
    function getDepth(uint256 gId) public view returns (uint8) {
        return uint8(groups[gId].depth);
    }

    /// @dev get number of leaves in a group Merkle tree (number of active and removed members)
    /// @param gId: group id number
    function getNumberOfLeaves(uint256 gId) public view returns (uint256) {
        return groups[gId].numberOfLeaves;
    }

    function _verifyProof(
        uint256 root,
        uint256 nullifier,
        uint256 minGrade,
        uint256[8] calldata proof
    ) internal view returns (bool r) {
        if (nullifierHashes[nullifier]) {
            revert UsingTheSameNullifier();
        }

        return verifier.verifyProof(
            [proof[0], proof[1]],
            [[proof[2], proof[3]], [proof[4], proof[5]]],
            [proof[6], proof[7]],
            [root, nullifier, minGrade]
        );
    }

    function _saveNullifierHash(uint256 nullifier) internal {
        nullifierHashes[nullifier] = true;
    }

    /// @dev create new group
    /// @param gId: group id number
    /// @param nullifier: nullifier of proof
    /// @param minGrade: minimum grade checked in the proof
    /// @param proof: zero-knowledge proof data
    /// @param recipient: person who the proof is targeted at
    function verifyProof(
        uint256 gId,
        uint256 nullifier,
        uint256 minGrade,
        uint256[8] calldata proof,
        address recipient
    ) external {
        if (getDepth(gId) == 0) {
            revert GroupDoesNotExist();
        }

        uint256 root = getRoot(gId);

        bool outcome = _verifyProof(root, nullifier, minGrade, proof);

        if (!outcome) {
            revert InvalidProof();
        }

        _saveNullifierHash(nullifier);

        emit ProofVerified(gId, recipient, minGrade);        
    }
}
