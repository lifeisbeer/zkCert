import { useState } from "react";
import Head from 'next/head';
import { Grid, TextField, Button } from "@mui/material";
import { useAccount, useContract, useProvider, useSigner, useNetwork } from "wagmi";
import { saveAs } from 'file-saver';
import { poseidonHash } from "../code/hash.js";
import { certCalldata } from "../code/zkp.js";

import styles from '../styles/Pages.module.css';
import contractAddress from "../code/contractAddress.json";
import Cert from "../code/Cert.json";
import networks from "../code/networks.json";

export default function Home() {

  const { isConnected } = useAccount()
  const { chain } = useNetwork();
  const { data: signer } = useSigner();
  const provider = useProvider();
  const contract = useContract({
    addressOrName: contractAddress.address,
    contractInterface: Cert.abi,
    signerOrProvider: signer || provider,
  });

  const MAX = Number.MAX_SAFE_INTEGER;

  const registerForm = {
    password: ""
  };
  const [registerFormValues, setRegisterFormValues] = useState(registerForm)
  const handleRegisterFormInputChange = (e) => {
    const { name, value } = e.target;
    setRegisterFormValues({
      ...registerFormValues,
      [name]: value,
    });
  };
  const handleRegisterFormSubmit = async (event) => {
    event.preventDefault();
    console.log(registerFormValues);
    // generate salt
    // present salt and user id to the user
    const salt = Math.floor(Math.random()*MAX);
    const userId = await poseidonHash([registerFormValues.password, salt]);
    console.log(`user id: ${userId}, password: ${registerFormValues.password}, user salt: ${salt}.`);
    alert(`Account created! \nuser id: ${userId}, \npassword: ${registerFormValues.password}, \nuser salt: ${salt} \nYou can share your user id, but keep your password and user salt hidden!`);

    const blob = new Blob([
      `Account created! \n user id: ${userId}, \n password: ${registerFormValues.password}, \n user salt: ${salt} \nYou can share your user id, but keep your password and user salt hidden!`
    ], {
      type: "text/plain;charset=utf-8"
    });
    saveAs(blob, "credentials.txt");
  };

  const verifyForm = {
    gId: "",
    appSalt: "",
    password: "",
    userSalt: "",
    grade: "",
    minGrade: "",
    verifyTo: "",
    ref: ""
  };
  const [verifyFormValues, setVerifyFormValues] = useState(verifyForm)
  const handleVerifyFormInputChange = (e) => {
    const { name, value } = e.target;
    setVerifyFormValues({
      ...verifyFormValues,
      [name]: value,
    });
  };
  const handleVerifyFormSubmit = async (event) => {
    event.preventDefault();
    console.log(verifyFormValues);

    contract.once("ProofVerified", (groupId, recipient, grade) => {
      alert("Proof verified!");
      console.log(groupId.toString(), recipient, grade.toString())
    });

    if (isConnected) {
      if (chain.name.slice(6) == networks.selectedChain) {
        const nonce = Math.floor(Math.random()*MAX);
        const userId = await poseidonHash([verifyFormValues.password, verifyFormValues.userSalt]);
        const appId = await poseidonHash([userId, verifyFormValues.appSalt, verifyFormValues.grade]);
        const nullifier = await poseidonHash([appId, nonce]);
        const index = await contract.getIndexFromAppId(verifyFormValues.gId, appId);
        const siblings = await (await contract.getSiblings(verifyFormValues.gId, index)).map((x) => x.toString());
        const siblingPathIndices = await (await contract.getSiblingPathIndices(verifyFormValues.gId, index)).map((x) => x.toString());;

        const dataResult = await certCalldata(
          verifyFormValues.password, 
          verifyFormValues.userSalt, 
          verifyFormValues.appSalt, 
          verifyFormValues.grade, 
          nonce, 
          siblingPathIndices, 
          siblings, 
          nullifier, 
          verifyFormValues.minGrade
        )

        contract.verifyProof(
          verifyFormValues.gId, 
          nullifier,
          verifyFormValues.minGrade,
          dataResult,
          verifyFormValues.verifyTo,
          verifyFormValues.ref
        );
      } else {
        alert("Please switch to "+networks[networks.selectedChain].chainName);
      }      
    } else {
      alert("Please connect wallet");
    }    
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>zkCert</title>
        <meta name="description" content="Digital certificates on blockchain using ZKPs" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Holder Page
        </h1>

        <div className={styles.grid_small}>

          <form onSubmit={handleRegisterFormSubmit}>
            <p className={styles.description}>
              Create user id:
            </p>
            <Grid container spacing={2} alignItems="center" justify="center">
            
              <Grid item>
                <TextField
                  required
                  id="password-input"
                  name="password"
                  label="Password"
                  type="number"
                  helperText="User password: please keep this hidden"
                  value={registerFormValues.password}
                  onChange={handleRegisterFormInputChange}
                />
              </Grid>

              <Grid item>
                <Button variant="contained" color="primary" type="submit">
                  Submit
                </Button>
              </Grid>

            </Grid>
          </form>

          <form onSubmit={handleVerifyFormSubmit}>
            <p className={styles.description}>
              Send proof of certificate:
            </p>
        
            <Grid container spacing={2} alignItems="center" justify="center">            
              <Grid item>
                <TextField
                  required
                  id="gId-input"
                  name="gId"
                  label="Group ID"
                  type="number"
                  helperText="Group id: provided by the issuer"
                  value={verifyFormValues.gId}
                  onChange={handleVerifyFormInputChange}
                />
              </Grid>

              <Grid item>
                <TextField
                  required
                  id="password-input"
                  name="password"
                  label="Password"
                  type="number"
                  helperText="Your password"
                  value={verifyFormValues.password}
                  onChange={handleVerifyFormInputChange}
                />
              </Grid>

              <Grid item>
                <TextField
                  required
                  id="userSalt-input"
                  name="userSalt"
                  label="User Salt"
                  type="number"
                  helperText="Your user salt"
                  value={verifyFormValues.userSalt}
                  onChange={handleVerifyFormInputChange}
                />
              </Grid>

              <Grid item>
                <TextField
                  required
                  id="appSalt-input"
                  name="appSalt"
                  label="App Salt"
                  type="number"
                  helperText="App salt: provided by the issuer"
                  value={verifyFormValues.appId}
                  onChange={handleVerifyFormInputChange}
                />
              </Grid>

              <Grid item>
                <TextField
                  required
                  id="grade-input"
                  name="grade"
                  label="Grade"
                  type="number"
                  helperText="Your grade"
                  value={verifyFormValues.grade}
                  onChange={handleVerifyFormInputChange}
                />
              </Grid>

              <Grid item>
                <TextField
                  required
                  id="minGrade-input"
                  name="minGrade"
                  label="Minimum Grade"
                  type="number"
                  helperText="Minimum grade asked by verifier"
                  value={verifyFormValues.minGrade}
                  onChange={handleVerifyFormInputChange}
                />
              </Grid>

              <Grid item>
                <TextField
                  required
                  id="verifyTo-input"
                  name="verifyTo"
                  label="Address of verifier"
                  type="text"
                  helperText="Address of the person who needs to verify the certificate"
                  value={verifyFormValues.verifyTo}
                  onChange={handleVerifyFormInputChange}
                />
              </Grid>

              <Grid item>
                <TextField
                  required
                  id="ref-input"
                  name="ref"
                  label="Proof reference"
                  type="text"
                  helperText="Reference of the proof"
                  value={verifyFormValues.ref}
                  onChange={handleVerifyFormInputChange}
                />
              </Grid>

              <Grid item>
                <Button variant="contained" color="primary" type="submit">
                  Submit
                </Button>
              </Grid>

            </Grid>
          </form>
        </div>
      </main>
    </div>
  );
}