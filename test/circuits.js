const { buildPoseidon } = require("circomlibjs");
const wasm_tester = require("circom_tester").wasm;
const F1Field = require("ffjavascript").F1Field;
const Scalar = require("ffjavascript").Scalar;
const { assert } = require("chai");

exports.p = Scalar.fromString("21888242871839275222246405745257275088548364400416034343698204186575808495617");
const Fr = new F1Field(exports.p);

const poseidonHash = async (items) => {
    let poseidon = await buildPoseidon()
    return poseidon.F.toObject(poseidon(items))
}

describe("Cert circuit tests", function () {
    this.timeout(100000000);

    let certCircuit;

    const password = 1;
    const userSalt = 2;
    const appSalt = 3;
    const nonce = 4;
    const grade = 70;
    const minGrade = 50;
    const nLevels = 10;
    const treePathIndices = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const treeSiblings = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    const nullifier = 12814787478331773156215995380435585311823759424381788229928076957868900783128n;
    // const userId = 7853200120776062878684798364095072458815029376092732009249414926327459813530n;
    // const appId = 60006026078093692816695823458380415376319091172243287451831605082846150052n;
    const root = 4068613235613342243794163368396056065476402536578893582255495660941022755827n;
  
    before(async function () {
        certCircuit = await wasm_tester("circuits/cert.circom");

        // userId = await poseidonHash([password, userSalt]);
        // console.log(userId);
        // appId = await poseidonHash([userId, appSalt, grade]);
        // console.log(appId);
        // nullifier = await poseidonHash([appId, nonce])
        // console.log(nullifier);

        // let hash = appId;

        // for (let i = 0; i < nLevels; i++) {
        //     hash = poseidonHash(hash, treeSiblings[i]);
        //     console.log(hash);
        // }

        // root = await hash;
    });

    it("Should generate the witness successfully", async function () {
    
        const INPUT = {
            password: password,
            userSalt: userSalt,
            appSalt: appSalt,
            grade: grade,
            nonce: nonce,
            treePathIndices: treePathIndices,
            treeSiblings: treeSiblings,
            nullifier: nullifier,
            minGrade: minGrade           
        };
        //console.log(INPUT);

        const witness = await certCircuit.calculateWitness(INPUT);
        //console.log(witness);

        assert(Fr.eq(Fr.e(witness[0]),Fr.e(1)));
        assert(Fr.eq(Fr.e(witness[1]),Fr.e(root)));
        assert(Fr.eq(Fr.e(witness[2]),Fr.e(nullifier)));
        assert(Fr.eq(Fr.e(witness[3]),Fr.e(minGrade)));
        assert(Fr.eq(Fr.e(witness[4]),Fr.e(password)));
        assert(Fr.eq(Fr.e(witness[5]),Fr.e(userSalt)));
        assert(Fr.eq(Fr.e(witness[6]),Fr.e(appSalt)));
        assert(Fr.eq(Fr.e(witness[7]),Fr.e(grade)));
        assert(Fr.eq(Fr.e(witness[8]),Fr.e(nonce)));
    });

    it("Should fail when the nullifier is wrong", async function () {
    
        const INPUT = {
            password: password,
            userSalt: userSalt,
            appSalt: appSalt,
            grade: grade,
            nonce: nonce,
            treePathIndices: treePathIndices,
            treeSiblings: treeSiblings,
            nullifier: 1, //wrong
            minGrade: minGrade           
        };
        //console.log(INPUT);

        try {
            await certCircuit.calculateWitness(INPUT, true);
        } catch (err) {
            // console.log(err);
            assert(err.message.includes("Assert Failed"));
        }
    });

    it("Should fail when the grade is less than the min grade", async function () {
    
        const INPUT = {
            password: password,
            userSalt: userSalt,
            appSalt: appSalt,
            grade: grade,
            nonce: nonce,
            treePathIndices: treePathIndices,
            treeSiblings: treeSiblings,
            nullifier: nullifier,
            minGrade: 100 // more than grade (70)          
        };
        //console.log(INPUT);

        try {
            await certCircuit.calculateWitness(INPUT, true);
        } catch (err) {
            // console.log(err);
            assert(err.message.includes("Assert Failed"));
        }
    });

    it("Should fail if any of the inputs are wrong as the nullifier won't match", async function () {
    
        let INPUT = {
            password: password,
            userSalt: userSalt,
            appSalt: appSalt,
            grade: grade,
            nonce: nonce,
            treePathIndices: treePathIndices,
            treeSiblings: treeSiblings,
            nullifier: nullifier,
            minGrade: minGrade         
        };

        INPUT["password"] = 5;
        try {
            await certCircuit.calculateWitness(INPUT, true);
        } catch (err) {
            // console.log(err);
            assert(err.message.includes("Assert Failed"));
        }
        INPUT["userSalt"] = 5;
        try {
            await certCircuit.calculateWitness(INPUT, true);
        } catch (err) {
            // console.log(err);
            assert(err.message.includes("Assert Failed"));
        }
        INPUT["appSalt"] = 5;
        try {
            await certCircuit.calculateWitness(INPUT, true);
        } catch (err) {
            // console.log(err);
            assert(err.message.includes("Assert Failed"));
        }
        INPUT["grade"] = 5;
        try {
            await certCircuit.calculateWitness(INPUT, true);
        } catch (err) {
            // console.log(err);
            assert(err.message.includes("Assert Failed"));
        }
        INPUT["nonce"] = 5;
        try {
            await certCircuit.calculateWitness(INPUT, true);
        } catch (err) {
            // console.log(err);
            assert(err.message.includes("Assert Failed"));
        }
    });

    it("Should produce the wrong root if any of the inputs are wrong but consistent", async function () {
        
        let INPUT = {
            password: password,
            userSalt: userSalt,
            appSalt: appSalt,
            grade: grade,
            nonce: nonce,
            treePathIndices: treePathIndices,
            treeSiblings: treeSiblings,
            nullifier: nullifier,
            minGrade: minGrade         
        };
    
        INPUT["password"] = 5;
        let newUserId = await poseidonHash([5, userSalt]);
        let newAppId = await poseidonHash([newUserId, appSalt, grade]);
        let newNullifier = await poseidonHash([newAppId, nonce]);
        INPUT["nullifier"] = newNullifier;        
        let witness = await certCircuit.calculateWitness(INPUT);
        assert(!Fr.eq(Fr.e(witness[1]),Fr.e(root)));
        INPUT["password"] = password;

        INPUT["userSalt"] = 5;
        newUserId = await poseidonHash([password, 5]);
        newAppId = await poseidonHash([newUserId, appSalt, grade]);
        newNullifier = await poseidonHash([newAppId, nonce]);
        INPUT["nullifier"] = newNullifier;
        witness = await certCircuit.calculateWitness(INPUT);
        assert(!Fr.eq(Fr.e(witness[1]),Fr.e(root)));
        INPUT["userSalt"] = userSalt;

        INPUT["appSalt"] = 5;
        newUserId = await poseidonHash([password, userSalt]);
        newAppId = await poseidonHash([newUserId, 5, grade]);
        newNullifier = await poseidonHash([newAppId, nonce]);
        INPUT["nullifier"] = newNullifier;
        witness = await certCircuit.calculateWitness(INPUT);
        assert(!Fr.eq(Fr.e(witness[1]),Fr.e(root)));
        INPUT["appSalt"] = appSalt;

        INPUT["grade"] = 51;
        newUserId = await poseidonHash([password, userSalt]);
        newAppId = await poseidonHash([newUserId, appSalt, 51]);
        newNullifier = await poseidonHash([newAppId, nonce]);
        INPUT["nullifier"] = newNullifier;
        witness = await certCircuit.calculateWitness(INPUT);
        assert(!Fr.eq(Fr.e(witness[1]),Fr.e(root)));
        INPUT["grade"] = grade;
    });
});