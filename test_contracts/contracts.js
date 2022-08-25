const { ethers } = require("hardhat");
const { exportCallDataGroth16 } = require("../scripts/genCalldata.js");
const { poseidonContract } = require("circomlibjs");
const { expect } = require("chai");

//let newUserId = await poseidonHash([5, userSalt]);

describe("Cert contract tests:", function () {
    let cert;

    const password = 1;
    const userSalt = 2;
    const userId = 7853200120776062878684798364095072458815029376092732009249414926327459813530n;
    const appSalt = 3;
    const grade = 70;
    const appId = 60006026078093692816695823458380415376319091172243287451831605082846150052n;
    const nonce = 4;
    const nullifier = 12814787478331773156215995380435585311823759424381788229928076957868900783128n;
    const minGrade = 50;
  
    before(async function () {
        // Poseidon
        const poseidonT3ABI = poseidonContract.generateABI(2)
        const poseidonT3Bytecode = poseidonContract.createCode(2)
        const [signer] = await ethers.getSigners()
        const PoseidonLibT3Factory = new ethers.ContractFactory(poseidonT3ABI, poseidonT3Bytecode, signer)
        const poseidonT3Lib = await PoseidonLibT3Factory.deploy()
        await poseidonT3Lib.deployed()
        // IncrementalBinaryTree
        const IncrementalBinaryTreeLibFactory = await ethers.getContractFactory("IncrementalBinaryTree", {
            libraries: {
                PoseidonT3: poseidonT3Lib.address
            }
        })
        const incrementalBinaryTreeLib = await IncrementalBinaryTreeLibFactory.deploy()
        await incrementalBinaryTreeLib.deployed()
        // Verifier
        const VerifierFactory = await ethers.getContractFactory("CertVerifier")
        const verifierContract = await VerifierFactory.deploy()
        await verifierContract.deployed()
         // Cert
        const CertFactory = await ethers.getContractFactory("Cert", {
            libraries: {
                IncrementalBinaryTree: incrementalBinaryTreeLib.address
            }
        })
        cert = await CertFactory.deploy(verifierContract.address)
        await cert.deployed()
    });
  
    it("Should create a group, add members and verify grade", async function () {
        const desc = "FTGP22-23@UoB";
        await cert.createGroup(desc);
        expect(await cert.groupDescription(0)).to.equal(desc);

        const pos = await cert.getNextIndex(0);
        expect(pos).to.equal(1023);

        await cert.addMember(0, appId);
        expect(await cert.getElement(0, pos)).to.equal(appId);
        expect(await cert.getNumberOfLeaves(0)).to.equal(1);
        expect(await cert.getNextIndex(0)).to.equal(1024);

        const depth = await cert.getDepth(0);
        expect(depth).to.equal(10);
        let siblings = await cert.getSiblings(0, pos);
        siblings = await siblings.map((x) => x.toString());
        let pathIndices = await cert.getSiblingPathIndices(0, pos);
        pathIndices = await pathIndices.map((x) => x.toString());

        const INPUT = {
            password: password,
            userSalt: userSalt,
            appSalt: appSalt,
            grade: grade,
            nonce: nonce,
            treePathIndices: pathIndices,
            treeSiblings: siblings,
            nullifier: nullifier,
            minGrade: minGrade           
        };
        //console.log(INPUT);
    
        let dataResult = await exportCallDataGroth16(INPUT);
        //console.log(dataResult);
        
        await expect(
            await cert.verifyProof(
                0,
                nullifier,
                minGrade,
                dataResult.slice(0,8),
                "0x000000000000000000000000000000000000dEaD"
            )
        ).to.emit(cert, 'ProofVerified').withArgs(0, "0x000000000000000000000000000000000000dEaD", minGrade);
    });
});
