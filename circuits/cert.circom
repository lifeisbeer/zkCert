pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/comparators.circom";
include "./tree.circom";

// each group represents one certificate, 
// groups are created by institutions or instructors
// the user can verify that they are the owner of the certificate by verifying membership in the group
// additionally, some certificates contain a grade
// in such cases, the user can verify both that they belong to the group and that their grade is above a value

// this produces the identity of a user which can be used in many certificates
// the user must know a password and a randomly generated salt to calculate their id
// the password and salt must be kept secret, otherwise the identity of the user can be compromised
// the user id can be shared with the group owner as it doesn't reveal the password or salt
template CalculateUserId() {
    signal input password;
    signal input userSalt;

    signal output out;

    component poseidon = Poseidon(2);

    poseidon.inputs[0] <== password;
    poseidon.inputs[1] <== userSalt;

    out <== poseidon.out;
}

// the salt and grade is added by the group owner when the user is registered
// the salt is used so that the user can't be identified across different certificate groups
// in the case where the certificate doesn't contain a grade, the grade is set to zero
template CalculateAppId() {
    signal input userId;
    signal input appSalt;
    signal input grade;

    signal output out;

    component poseidon = Poseidon(3);

    poseidon.inputs[0] <== userId;
    poseidon.inputs[1] <== appSalt;
    poseidon.inputs[2] <== grade;

    out <== poseidon.out;
}

// the nullifier is used to prevent double spending, the nullifier is:
// the hash of the app id and a nonce which can be a random number
template CalculateNullifier() {
    signal input appId;
    signal input nonce;

    signal output out;

    component poseidon = Poseidon(2);

    poseidon.inputs[0] <== appId;
    poseidon.inputs[1] <== nonce;

    out <== poseidon.out;
}

// nLevels must be < 32.
template Cert(nLevels) {
    // private inputs
    signal input password;
    signal input userSalt;
    signal input appSalt;
    signal input grade;
    signal input nonce;
    signal input treePathIndices[nLevels];
    signal input treeSiblings[nLevels];

    // public inputs
    signal input nullifier;
    signal input pubRoot;
    signal input minGrade; // in the case where the certificate doesn't contain a grade, the minGrade is set to zero

    // outputs
    signal output root;

    // calculate user id
    component CalculateUserId = CalculateUserId();
    CalculateUserId.password <== password;
    CalculateUserId.userSalt <== userSalt;

    // calculate app id
    component CalculateAppId = CalculateAppId();
    CalculateAppId.userId <== CalculateUserId.out;
    CalculateAppId.appSalt <== appSalt;
    CalculateAppId.grade <== grade;
    signal appId <== CalculateAppId.out;

    // calculate and verify nullifier
    component CalculateNullifier = CalculateNullifier();
    CalculateNullifier.appId <== appId;
    CalculateNullifier.nonce <== nonce;
    nullifier === CalculateNullifier.out;

    // calculate root using the app id as leaf
    component inclusionProof = MerkleTreeInclusionProof(nLevels);
    inclusionProof.leaf <== appId;

    for (var i = 0; i < nLevels; i++) {
        inclusionProof.siblings[i] <== treeSiblings[i];
        inclusionProof.pathIndices[i] <== treePathIndices[i];
    } 

    root <== inclusionProof.root;

    // verify root
    pubRoot === root;

    // verify that the grade is at least the minimum grade, 
    // or that 0 = 0 if the certificate doesn't contain a grade
    component less = LessEqThan(10); // 10 bits, range: 0 - 1023
    less.in[0] <== minGrade;
    less.in[1] <== grade;
    less.out === 1; // 1 if minGrade <= grade, 0 otherwise
}

component main {public [pubRoot, minGrade]} = Cert(20);
