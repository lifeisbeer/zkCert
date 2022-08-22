const { poseidonContract } = require("circomlibjs")
const { ethers } = require("hardhat");

async function main() {

    // Poseidon

    const poseidonT3ABI = poseidonContract.generateABI(2)
    const poseidonT3Bytecode = poseidonContract.createCode(2)

    const [signer] = await ethers.getSigners()

    const PoseidonLibT3Factory = new ethers.ContractFactory(poseidonT3ABI, poseidonT3Bytecode, signer)
    const poseidonT3Lib = await PoseidonLibT3Factory.deploy()

    await poseidonT3Lib.deployed()

    console.info(`PoseidonT3 library has been deployed to: ${poseidonT3Lib.address}`)

    // IncrementalBinaryTree

    const IncrementalBinaryTreeLibFactory = await ethers.getContractFactory("IncrementalBinaryTree", {
        libraries: {
            PoseidonT3: poseidonT3Lib.address
        }
    })
    const incrementalBinaryTreeLib = await IncrementalBinaryTreeLibFactory.deploy()

    await incrementalBinaryTreeLib.deployed()

    console.info(`IncrementalBinaryTree library has been deployed to: ${incrementalBinaryTreeLib.address}`)

    // Verifier

    const VerifierFactory = await ethers.getContractFactory("CertVerifier")

    const verifierContract = await VerifierFactory.deploy()

    await verifierContract.deployed()

    console.info(`Verifier contract has been deployed to: ${verifierContract.address}`)

    // Cert

    const CertFactory = await ethers.getContractFactory("Cert", {
        libraries: {
            IncrementalBinaryTree: incrementalBinaryTreeLib.address
        }
    })

    const cert = await CertFactory.deploy(verifierContract.address)

    await cert.deployed()

    console.info(`Cert contract has been deployed to: ${cert.address}`)

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
