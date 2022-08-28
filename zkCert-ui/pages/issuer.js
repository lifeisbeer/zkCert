import { useState } from "react";
import Head from 'next/head';
import { Grid, TextField, Button } from "@mui/material";
import { useAccount, useContract, useProvider, useSigner, useNetwork } from "wagmi";
import { saveAs } from 'file-saver';
import { poseidonHash } from "../code/hash.js";

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

  const createForm = {
    desc: ""
  };
  const [createFormValues, setCreateFormValues] = useState(createForm)
  const handleCreateFormInputChange = (e) => {
    const { name, value } = e.target;
    setCreateFormValues({
      ...createFormValues,
      [name]: value,
    });
  };
  const handleCreateFormSubmit = async (event) => {
    event.preventDefault();
    console.log(createFormValues);

    contract.once("GroupCreated", (groupId, desc) => {
      console.log(`Group created, group id: ${groupId}, and description: ${desc}.`);
      alert(`Group created, group id: ${groupId}, and description: ${desc}.`);
    });

    if (isConnected) {
      if (chain.name.slice(6) == networks.selectedChain) {
        contract.createGroup(createFormValues.desc);
      } else {
        alert("Please switch to "+networks[networks.selectedChain].chainName);
      }      
    } else {
      alert("Please connect wallet");
    }
  };

  const addForm = {
    gId: "",
    userId: "",
    grade: ""
  };
  const [addFormValues, setAddFormValues] = useState(addForm)
  const handleAddFormInputChange = (e) => {
    const { name, value } = e.target;
    setAddFormValues({
      ...addFormValues,
      [name]: value,
    });
  };
  const handleAddFormSubmit = async (event) => {
    event.preventDefault();
    console.log(addFormValues);
    
    const salt = Math.floor(Math.random()*MAX);
    const newIndex = await contract.getNextIndex(addFormValues.gId);

    contract.once("MemberAdded", (groupId, identityCommitment, root) => {
      console.log(`Index ${newIndex}, app id ${identityCommitment}, app salt ${salt}, grade ${addFormValues.grade}, group ${groupId}.`);
      alert(`Member with index ${newIndex}, grade ${addFormValues.grade}, and app salt ${salt} added to certificate group ${groupId}.`);
      const blob = new Blob([
        `Member added to certificate group ${groupId}: \n index: ${newIndex}, \n grade ${addFormValues.grade}, \n app salt: ${salt}, \n app id: ${identityCommitment}`
      ], {
        type: "text/plain;charset=utf-8"
      });
      saveAs(blob, `${addFormValues.userId}_credentials.txt`);
    });

    if (isConnected) {
      if (chain.name.slice(6) == networks.selectedChain) {
        const appId = await poseidonHash([addFormValues.userId, salt, addFormValues.grade]);
        contract.addMember(addFormValues.gId, appId);
      } else {
        alert("Please switch to "+networks[networks.selectedChain].chainName);
      }      
    } else {
      alert("Please connect wallet");
    }
  };

  const removeForm = {
    gId: "",
    index: ""
  };
  const [removeFormValues, setRemoveFormValues] = useState(removeForm)
  const handleRemoveFormInputChange = (e) => {
    const { name, value } = e.target;
    setRemoveFormValues({
      ...removeFormValues,
      [name]: value,
    });
  };
  const handleRemoveFormSubmit = async (event) => {
    event.preventDefault();
    console.log(removeFormValues);

    contract.once("MemberRemoved", (groupId, identityCommitment, root) => {
      console.log(`App id ${identityCommitment}, group ${groupId}.`);
      alert(`Member removed.`);
    });

    if (isConnected) {
      if (chain.name.slice(6) == networks.selectedChain) {
        const appId = await contract.getElement(removeFormValues.gId, removeFormValues.index);
        contract.removeMember(removeFormValues.gId, appId);
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
          Issuer Page
        </h1>

        <div className={styles.grid_small}>

          <form onSubmit={handleCreateFormSubmit}>
            <p className={styles.description}>
              Create new certificate group:
            </p>
            <Grid container spacing={2} alignItems="center" justify="center">
            
              <Grid item>
                <TextField
                  required
                  id="desc-input"
                  name="desc"
                  label="Description"
                  type="text"
                  value={createFormValues.desc}
                  onChange={handleCreateFormInputChange}
                />
              </Grid>

              <Grid item>
                <Button variant="contained" color="primary" type="submit">
                  Submit
                </Button>
              </Grid>

            </Grid>
          </form>

          <form onSubmit={handleAddFormSubmit}>
            <p className={styles.description}>
              Add member to a certificate group:
            </p>
            <Grid container spacing={2} alignItems="center" justify="center">
            
              <Grid item>
                <TextField
                  required
                  id="gId-input"
                  name="gId"
                  label="Group ID"
                  type="number"
                  value={addFormValues.gId}
                  onChange={handleAddFormInputChange}
                />
              </Grid>

              <Grid item>
                <TextField
                  required
                  id="userId-input"
                  name="userId"
                  label="User Id"
                  type="number"
                  value={addFormValues.userId}
                  onChange={handleAddFormInputChange}
                />
              </Grid>

              <Grid item>
                <TextField
                  required
                  id="gade-input"
                  name="grade"
                  label="User grade"
                  type="number"
                  value={addFormValues.grade}
                  onChange={handleAddFormInputChange}
                />
              </Grid>

              <Grid item>
                <Button variant="contained" color="primary" type="submit">
                  Submit
                </Button>
              </Grid>

            </Grid>
          </form>

          <form onSubmit={handleRemoveFormSubmit}>
            <p className={styles.description}>
              Remove member from a certificate group:
            </p>
        
            <Grid container spacing={2} alignItems="center" justify="center">            
              <Grid item>
                <TextField
                  required
                  id="gId-input"
                  name="gId"
                  label="Group ID"
                  type="number"
                  value={removeFormValues.gId}
                  onChange={handleRemoveFormInputChange}
                />
              </Grid>

              <Grid item>
                <TextField
                  required
                  id="index-input"
                  name="index"
                  label="Index"
                  type="number"
                  value={removeFormValues.index}
                  onChange={handleRemoveFormInputChange}
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