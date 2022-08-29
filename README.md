# zkCert

zkCert is an application for private digital certificates. Most certificates are still issued in paper format, making their verification lengthy, manually intensive, and expensive for all parties involved. With zkCert, we aim to change this. zkCert brings benefits to all involved parties, holders of certificates, their issuers as well as people that need to verify them. 

For holders of certificates, zkCert allows them to prove that they hold a certificate without making that information publicly available. For issuers, it allows them to publish the information once and never have to verify authenticity of certificates again in the future. Finally, for people checking certificates, zkCert gives them greater guarantees as it eliminates the possibility of counterfeit certificates.

This project is still in development. However an MVP is available. The [smart contracts](https://explorer.ps.hmny.io/address/0x38aa3cac3cf2729928cd8c9e247863247b3e3754) are deployed on Harmony dev net and the [front-end](https://zk-cert.vercel.app/) on Vercel.

## Usage

You can use the application online by visiting: https://zk-cert.vercel.app/

You will first be redirected to the welcome page. First you need to connect your wallet by clicking on the `connect wallet` button on the top right. In case you are not on the Harmony Dev Net, the button will turn into a `switch network` button. Clicking this, will add and switch your network to the Harmony Dev Net.

Then you can select your role within zkCert, this will give you access to the functionalities available for that role. There are three different roles: 
1) Issuer of certificates, 
2) Holder of certificates, 
3) Verifier of certificates.

Starting with the issuer, you get three functions on the front-end: 
1) Create new certificate group, 
2) Add member to a certificate group (you must be the creator of the certificate group),
3) Remove members from the certificate group (again you must be the creator of the certificate group).

Moving to the Holder, you get two functions on the front-end:
1) Create user id, which creates a reusable identity that can be used to register in multiple certificate groups,
2) Send proof of certificate, which allows you to prove that you hold a certificate.

Finally the Verifier has one function:
1) You can check for proofs that are directed to your address in the smart contract and see their details.

For a demonstration please check the demo video at: https://youtu.be/QaeJ9MyzT_g

## Run locally

zkCert in an open source project and thus all the code is freely available online for anyone to download, try and modify. All the code is available in the project repository: https://github.com/lifeisbeer/zkCert

To run zkCert locally:
1) First clone the repository,
2) Then cd into the project folder,
3) Run `yard` to install everything,
4) cd into the front-end folder (*"zkCert-ui"*),
5) Run `yard` to install everything related to the front-end.

### Front-end:
While in the front-end folder, you can interact with the front-end locally by running:
```
yarn dev
```
The output will be available at http://localhost:3000/

This front-end will interact with the contract deployed at the address specified in *"code/contractAddress.json"* file and the network specified in *"code/contractAddress.json"* file. In case you deploy the contract elsewhere, you will need to update these. If you make any changes to the smart contract make sure to also update the *"code/Cert.json"* file. 

### Circuits:
Going back to the main folder (`cd ..`), you can find the project circuits in the *"circuits"* folder. In case you modify the circuits, you can:
1) Compile the circuits by running:
```
yarn compile_circ
```
2) Test the circuits by running:
```
yarn test_circ
```

### Smart Contracts:
The smart contracts of zkCert can be found in the *"contracts"* folder. In case you modify any of the smart contracts, you can:
1) Compile the smart contracts by running:
```
yarn compile
```
2) Test them by running:
```
yarn test
```
3) Deploy them by running:
```
yarn deploy
```
To deploy the smart contracts to a different network, you need to specify the network in *"hardhat.config.js"*, then pass the network to the deploy script. Make sure to also include your private key in a *".env"* file and pass it in the network specification (check *"hardhat.config.js"* for an example of network specification). For example to deploy to the Harmony Dev Net, you can:
```
yarn deploy --network harmonyDevNet
```
 
