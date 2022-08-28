import { useState } from "react";
import Head from 'next/head';
import { Grid, TextField, Button } from "@mui/material";
import { useAccount, useContract, useProvider, useSigner, useNetwork, useBlockNumber } from "wagmi";
import { saveAs } from 'file-saver';
import { poseidonHash } from "../code/hash.js";

import styles from '../styles/Pages.module.css';
import contractAddress from "../code/contractAddress.json";
import Cert from "../code/Cert.json";
import networks from "../code/networks.json";

export default function Home() {
  const [items, setItems] = useState("Nothing to show, press the button to retrieve proofs")

  const { address, isConnected } = useAccount()
  const { chain } = useNetwork();
  const { data: blockNumber } = useBlockNumber()
  const { data: signer } = useSigner();
  const provider = useProvider();
  const contract = useContract({
    addressOrName: contractAddress.address,
    contractInterface: Cert.abi,
    signerOrProvider: signer || provider,
  });

  const retrieve = async () => {
    if (isConnected) {
      if (chain.name.slice(6) == networks.selectedChain) {
        let listEl = document.getElementById("myList");
        let index = 0;
        const list = [];

        while (true) {
          try {
            const proof = await contract.proofs(address, index);
            console.log(index, proof);
            list[index] = [proof.groupId.toString(), proof.ref, proof.grade.toString()];
            index++; 
            console.log(list);
          } catch {
            break;
          }
        }

        setItems(`Proofs for ${address}:`);
        list.forEach((item)=>{
          let li = document.createElement("li");
          li.innerText = `Group: ${item[0]}, Reference: ${item[1]}, Minimum grade: ${item[2]}`;
          listEl.appendChild(li);
        })
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
          Verifier Page
        </h1>

        <div className={styles.grid_tiny}>

          <Button 
            variant="contained" 
            color="primary" 
            type="submit" 
            sx={{ m: 5 }} 
            onClick={() => retrieve()}
          >
            Check for proofs
          </Button>

          <div>
            {items}
            <ul id="myList"></ul>
          </div>
        </div>
      </main>
    </div>
  );
}