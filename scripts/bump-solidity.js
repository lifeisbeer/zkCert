const fs = require("fs");
const solidityRegex = /pragma solidity \^\d+\.\d+\.\d+/ // this is for the solidity version

const verifierRegex = /contract Verifier/ // this is for the verifier contract name

let content = fs.readFileSync("./contracts/CertVerifier.sol", { encoding: 'utf-8' });
let bumped = content.replace(solidityRegex, 'pragma solidity ^0.8.0');
bumped = bumped.replace(verifierRegex, 'contract CertVerifier');

fs.writeFileSync("./contracts/CertVerifier.sol", bumped);
