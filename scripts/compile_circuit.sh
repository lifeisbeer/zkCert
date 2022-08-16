#!/bin/bash

cd circuits

mkdir Cert

if [ -f ./powersOfTau28_hez_final_12.ptau ]; then
    echo "powersOfTau28_hez_final_12.ptau already exists. Skipping."
else
    echo 'Downloading powersOfTau28_hez_final_12.ptau'
    wget https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_12.ptau
fi

echo "Compiling cert.circom..."

# compile circuit

circom cert.circom --r1cs --wasm --sym -o Cert
snarkjs r1cs info Cert/cert.r1cs

# Start a new zkey and make a contribution

snarkjs groth16 setup Cert/cert.r1cs powersOfTau28_hez_final_12.ptau Cert/circuit_0000.zkey
snarkjs zkey contribute Cert/circuit_0000.zkey Cert/circuit_final.zkey --name="1st Contributor Name" -v -e="random text"
snarkjs zkey export verificationkey Cert/circuit_final.zkey Cert/verification_key.json

# generate solidity contract
snarkjs zkey export solidityverifier Cert/circuit_final.zkey ../contracts/CertVerifier.sol

echo "Circuits done."

cd ..