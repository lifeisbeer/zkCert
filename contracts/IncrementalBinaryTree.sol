// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {PoseidonT3} from "./Hashes.sol";

// Each incremental tree has certain properties and data that will
// be used to add new leaves.
struct IncrementalTreeData {
    uint8 depth; // Depth of the tree.
    uint256 root; // Root hash of the tree.
    uint256 numberOfLeaves; // Number of leaves of the tree.
    uint256 nextIndex; // This is the position where the next leaf will be stored
    mapping(uint256 => uint256) tree; // List representing the Merkle tree
}

/// @title Incremental binary Merkle tree.
/// @dev The incremental tree allows to calculate the root hash each time a leaf is added, ensuring
/// the integrity of the tree.
/// @author Theodoros Constantinides
/// @notice This is based on the zk-kit smart contracts
library IncrementalBinaryTree {
    uint8 internal constant MAX_DEPTH = 32;
    uint256 internal constant SNARK_SCALAR_FIELD =
        21888242871839275222246405745257275088548364400416034343698204186575808495617;

    /// @dev Initializes a tree.
    /// @param self: Tree data.
    /// @param depth: Depth of the tree.
    function init(
        IncrementalTreeData storage self,
        uint8 depth
    ) public {
        require(depth > 0 && depth <= MAX_DEPTH, "IncrementalBinaryTree: tree depth must be between 1 and 32");

        self.depth = depth;

        uint256 zero = 0;
        for (uint8 i = 0; i < depth; ) {
            zero = PoseidonT3.poseidon([zero, zero]);

            unchecked {
                ++i;
            }
        }

        self.root = zero;
        self.nextIndex = 2**depth-1;
    }

    /// @dev Return the element in the tree that corresponds to the given index.
    /// @notice The element might not be part of the tree (in those cases 0 will be returned)
    /// @param self: Tree data.
    /// @param index: Index of leaf.
    function getElement(
        IncrementalTreeData storage self,
        uint256 index
    ) public view returns (uint256)  {
        return self.tree[index];
    }

    /// @dev Verify if the element with given index is part of the tree.
    /// @param self: Tree data.
    /// @param index: Index of leaf.
    function verifyByIndex(
        IncrementalTreeData storage self,
        uint256 index
    ) public view returns (bool)  {
        return self.tree[index] != 0;
    }

    /// @dev Return the indices in the tree in the path from a leaf to the root.
    /// @param self: Tree data.
    /// @param index: Index of leaf.
    function getIndices(
        IncrementalTreeData storage self,
        uint256 index
    ) public view returns (uint256[MAX_DEPTH] memory)  {
        uint8 l = self.depth;
        uint256[MAX_DEPTH] memory indices;
        indices[0] = index;

        for (uint256 i = 1; i < self.depth; ) {

            if (indices[i-1] % 2 == 0) { //?? indices[i] & 1 == 0 might be cheaper
                indices[i] = (indices[i-1] - (2**l - 1))/2 + (2**(l-1) - 1);
            } else {
                indices[i] = (indices[i-1] - (2**l - 1))/2 + (2**(l-1) - 1);
            }

            l -= 1;

            unchecked {
                ++i;
            }
        }
    
        return indices;
    }

    /// @dev Return the indices of the siblings in the tree in the path from a leaf to the root.
    /// @param self: Tree data.
    /// @param index: Index of leaf.
    function getSiblingIndices(
        IncrementalTreeData storage self,
        uint256 index
    ) public view returns (uint256[MAX_DEPTH] memory)  {
        uint256[MAX_DEPTH] memory indices;

        indices = getIndices(self, index);

        for (uint256 i = 0; i < self.depth; ) {
            if (indices[i] % 2 == 0) { // this is the right child, we need to get to the previous
                indices[i] = indices[i]-1;
            } else { // this is the left child, we need to get to the next
                indices[i] = indices[i]+1;
            }

            unchecked {
                ++i;
            }
        }

        return indices;
    }

    /// @dev Return the binary path indices of the siblings in the tree in the path from a leaf to the root.
    /// @param self: Tree data.
    /// @param index: Index of leaf.
    function getSiblingPathIndices(
        IncrementalTreeData storage self,
        uint256 index
    ) public view returns (uint256[MAX_DEPTH] memory)  {
        uint256[MAX_DEPTH] memory indices;

        indices = getSiblingIndices(self, index);

        for (uint256 i = 0; i < self.depth; ) {

            if (indices[i] % 2 == 0) { // this is the right child
                indices[i] = 0;
            } else {
                indices[i] = 1;
            }

            unchecked {
                ++i;
            }
        }
    
        return indices;
    }

    /// @dev Return the siblings in the tree in the path from a leaf to the root.
    /// @param self: Tree data.
    /// @param index: Index of leaf.
    function getSiblings(
        IncrementalTreeData storage self,
        uint256 index
    ) public view returns (uint256[MAX_DEPTH] memory)  {
        uint256[MAX_DEPTH] memory indices;

        indices = getSiblingIndices(self, index);

        for (uint256 i = 0; i < self.depth; ) {

            indices[i] = self.tree[indices[i]];

            unchecked {
                ++i;
            }
        }
    
        return indices;
    }

    /// @dev Updates a leaf in the tree.
    /// @param self: Tree data.
    /// @param leafIndex: Index of leaf to be updated.
    /// @param newLeaf: New leaf.
    function update(
        IncrementalTreeData storage self,
        uint256 leafIndex,
        uint256 newLeaf
    ) public {
        require(self.tree[leafIndex] != 0, "IncrementalBinaryTree: leaf is not part of the tree");
        require(newLeaf < SNARK_SCALAR_FIELD, "IncrementalBinaryTree: leaf must be < SNARK_SCALAR_FIELD");

        uint8 depth = self.depth;
        uint256 hash = newLeaf;
        uint256[MAX_DEPTH] memory indices = getIndices(self, leafIndex);

        for (uint8 i = 0; i < depth; ) {
            uint256 index = indices[i];

            self.tree[index] = hash;

            if (index % 2 == 0) { // this is the right child
                hash = PoseidonT3.poseidon([self.tree[index-1], self.tree[index]]);
            } else {
                hash = PoseidonT3.poseidon([self.tree[index], self.tree[index+1]]);
            }

            unchecked {
                ++i;
            }
        }

        self.root = hash;
    }

    /// @dev Inserts a leaf in the tree.
    /// @param self: Tree data.
    /// @param leaf: Leaf to be inserted.
    function insert(
        IncrementalTreeData storage self, 
        uint256 leaf
    ) public {
        require(leaf < SNARK_SCALAR_FIELD, "IncrementalBinaryTree: leaf must be < SNARK_SCALAR_FIELD");
        require(self.numberOfLeaves < 2**self.depth, "IncrementalBinaryTree: tree is full");

        self.tree[self.nextIndex] = 1; // so that update can be used to avoid code repetition 
        update(self, self.nextIndex, leaf);
        
        self.numberOfLeaves += 1;
        self.nextIndex += 1;
    }

    /// @dev Removes a leaf from the tree.
    /// @notice This doesn't remove the leaf, it just sets its value to zero
    /// @param self: Tree data.
    /// @param leafIndex: Index of leaf to be updated.
    function remove( // can be improved by keeping unused positions in a list
        IncrementalTreeData storage self,
        uint256 leafIndex
    ) public {
        update(self, leafIndex, 0);
    }

    /// @dev Verify if the path is correct and the leaf is part of the tree.
    /// @param self: Tree data.
    /// @param leaf: Leaf to be checked.
    /// @param proofSiblings: Array of the sibling nodes of the proof of membership.
    /// @param proofPathIndices: Path of the proof of membership.
    function verify(
        IncrementalTreeData storage self,
        uint256 leaf,
        uint256[] calldata proofSiblings,
        uint8[] calldata proofPathIndices
    ) private view returns (bool) {
        require(leaf < SNARK_SCALAR_FIELD, "IncrementalBinaryTree: leaf must be < SNARK_SCALAR_FIELD");
        uint8 depth = self.depth;
        require(
            proofPathIndices.length == depth && proofSiblings.length == depth,
            "IncrementalBinaryTree: length of path is not correct"
        );

        uint256 hash = leaf;

        for (uint8 i = 0; i < depth; ) {
            require(
                proofSiblings[i] < SNARK_SCALAR_FIELD,
                "IncrementalBinaryTree: sibling node must be < SNARK_SCALAR_FIELD"
            );

            if (proofPathIndices[i] == 0) {
                hash = PoseidonT3.poseidon([hash, proofSiblings[i]]);
            } else {
                hash = PoseidonT3.poseidon([proofSiblings[i], hash]);
            }

            unchecked {
                ++i;
            }
        }

        return hash == self.root;
    }
}
