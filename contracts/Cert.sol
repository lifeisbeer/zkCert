//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./IncrementalBinaryTree.sol";
import "./CertVerifier.sol";

/// @title zkCert: A smart contract for zero-knowledge digital certificates on the blockchain 
/// @author Theodoros Constantinides
/// @notice This is based on the Semaphore smart contracts
contract Cert {
    using IncrementalBinaryTree for IncrementalTreeData;

    CertVerifier public verifier;

    struct Proofs {
        uint256 groupId;
        uint256 grade;
        string ref;
    }    

    mapping(uint256 => IncrementalTreeData) internal groups;
    mapping(uint256 => string) public groupDescription;
    mapping(uint256 => address) public groupAdmins;
    mapping(uint256 => mapping(uint256 => uint256)) internal userIndex; // groupID -> appId -> index
    mapping(uint256 => mapping(uint256 => bool)) internal nullifierHashes; // groupID -> nullifierHash -> bool
    mapping(address => Proofs[]) public proofs;

    uint256 constant SNARK_SCALAR_FIELD = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    uint8 constant DEPTH = 10;
    uint8 constant MAXDEPTH = 32;

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

    /// @notice Notify users about a change in a group
    event MemberUpdated(
        uint256 indexed groupId,
        uint256 index,
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

        groups[groupId].init(DEPTH);   
    }

    /// @dev create new group
    /// @param description: group description (e.g. "ZKU certificate group")
    function createGroup(string calldata description) external {
        _createGroup();

        groupAdmins[groupId] = msg.sender;

        groupDescription[groupId] = description;

        emit GroupCreated(groupId, groupDescription[groupId]);
        emit GroupAdminUpdated(groupId, msg.sender);

        groupId += 1;
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
    function getNumberOfLeaves(uint256 gId) external view returns (uint256) {
        return groups[gId].numberOfLeaves;
    }

    /// @dev get next index in a group Merkle tree (position where the next leaf will be stored)
    /// @param gId: group id number
    function getNextIndex(uint256 gId) external view returns (uint256) {
        return groups[gId].nextIndex;
    }

    function getIndexFromAppId(
        uint gId, 
        uint256 appId
    ) external view returns (uint256) {
        return userIndex[gId][appId];
    }

    /// @dev get the element of a given index of a given group Merkle tree
    /// @param gId: group id number
    /// @param index: index of Merkle tree
    function getElement(
        uint256 gId, 
        uint256 index 
    ) external view returns (uint256) {
        return groups[gId].getElement(index);
    }

    /// @dev get the indices of the siblings in the tree in the path from a leaf to the root
    /// @param gId: group id number
    /// @param index: index of Merkle tree
    function getSiblingIndices(
        uint256 gId, 
        uint256 index 
    ) external view returns (uint256[DEPTH] memory) {
        uint256[MAXDEPTH] memory allIndices = groups[gId].getSiblingIndices(index);
        uint256[DEPTH] memory indices;
        for (uint8 i=0; i<DEPTH; i++) {
            indices[i] = allIndices[i];
        }
        return indices;
    }

    /// @dev get the siblings in the tree in the path from a leaf to the root.
    /// @param gId: group id number
    /// @param index: index of Merkle tree
    function getSiblings(
        uint256 gId, 
        uint256 index 
    ) external view returns (uint256[DEPTH] memory) {
        uint256[MAXDEPTH] memory allElements = groups[gId].getSiblings(index);
        uint256[DEPTH] memory elements;
        for (uint8 i=0; i<DEPTH; i++) {
            elements[i] = allElements[i];
        }
        return elements;
    }

    /// @dev get the binary path indices of the siblings in the tree in the path from a leaf to the root.
    /// @param gId: group id number
    /// @param index: index of Merkle tree
    function getSiblingPathIndices(
        uint256 gId, 
        uint256 index 
    ) external view returns (uint256[DEPTH] memory) {
        uint256[MAXDEPTH] memory allIndices = groups[gId].getSiblingPathIndices(index);
        uint256[DEPTH] memory indices;
        for (uint8 i=0; i<DEPTH; i++) {
            indices[i] = allIndices[i];
        }
        return indices;
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

        uint256 index = groups[gId].nextIndex;

        groups[gId].insert(appId);

        userIndex[gId][appId] = index;

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

    function _updateMember(
        uint256 gId, 
        uint256 index,
        uint256 newAppId
    ) internal {
        if (getDepth(gId) == 0) {
            revert GroupDoesNotExist();
        }

        groups[gId].update(index, newAppId);

        uint256 root = getRoot(gId);

        emit MemberUpdated(gId, index, newAppId, root);
    }

    /// @dev add a new member to a group
    /// @param gId: group id number
    /// @param index: index of the user in the Merkle tree
    /// @param newAppId: the application id of a user
    function updateMember(
        uint256 gId, 
        uint256 index,
        uint256 newAppId
    ) external onlyGroupAdmin(gId) {
        _updateMember(gId, index, newAppId);
    }

    function _removeMember(
        uint256 gId,
        uint256 appId
    ) internal {
        if (getDepth(gId) == 0) {
            revert GroupDoesNotExist();
        }

        uint256 index = userIndex[gId][appId];

        groups[gId].remove(index);

        uint256 root = getRoot(gId);

        emit MemberRemoved(gId, appId, root);
    }

    /// @dev remove an existing member from a group
    /// @param gId: group id number
    /// @param appId: the application id of a user
    function removeMember(
        uint256 gId,
        uint256 appId
    ) external onlyGroupAdmin(gId) {
        _removeMember(gId, appId);
    }

    function _verifyProof(
        uint256 root,
        uint256 nullifier,
        uint256 minGrade,
        uint256[8] calldata proof
    ) internal view returns (bool) {
        return verifier.verifyProof(
            [proof[0], proof[1]],
            [[proof[2], proof[3]], [proof[4], proof[5]]],
            [proof[6], proof[7]],
            [root, nullifier, minGrade]
        );
    }

    function _saveNullifierHash(
        uint256 gId,
        uint256 nullifier
    ) internal {
        nullifierHashes[gId][nullifier] = true;
    }

    /// @dev create new group
    /// @param gId: group id number
    /// @param nullifier: nullifier of proof
    /// @param minGrade: minimum grade checked in the proof
    /// @param proof: zero-knowledge proof data
    /// @param recipient: person who the proof is targeted at
    /// @param ref: reference for proof 
    function verifyProof(
        uint256 gId,
        uint256 nullifier,
        uint256 minGrade,
        uint256[8] calldata proof,
        address recipient,
        string calldata ref
    ) external {
        if (getDepth(gId) == 0) {
            revert GroupDoesNotExist();
        }

        if (nullifierHashes[gId][nullifier]) {
            revert UsingTheSameNullifier();
        }

        uint256 root = getRoot(gId);

        bool outcome = _verifyProof(root, nullifier, minGrade, proof);

        if (!outcome) {
            revert InvalidProof();
        }

        _saveNullifierHash(gId, nullifier);

        emit ProofVerified(gId, recipient, minGrade); 

        proofs[recipient].push(Proofs(gId, minGrade, ref));
    }
}
