require("@nomicfoundation/hardhat-toolbox");
require("hardhat-gas-reporter");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.9",
  settings: {
    optimizer: {
      enabled: true,
      runs: 1000,
    },
  },
  networks: {
    harmonyDevNet: {
      url: "https://api.s0.ps.hmny.io",
      accounts: [process.env.PRIVATE_KEY],
    },
  },
  paths: {
    tests: "./test_contracts"
  },
};
