import Head from "next/head";
import styles from '../styles/Pages.module.css';

export default function About() {
  return (
    <div>
      <Head>
        <title>zkSudoku - About</title>
        <meta name="title" content="zkCert - About" />
        <meta name="description" content="Digital certificates on blockchain using ZKPs" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          zkCert:
        </h1>

        <div className={styles.grid}>
          <p className={styles.description}>
            zkCert is an application for private digital certificates. Most certificates are still issued in paper format, making their verification lengthy, manually intensive, and expensive for all parties involved. With zkCert, we aim to change this. zkCert brings benefits to all involved parties, holders of certificates, their issuers as well as people that need to verify them. For holders of certificates, zkCert allows them to prove that they hold a certificate without making that information publicly available. For issuers, it allows them to publish the information once and never have to verify authenticity of certificates again in the future. Finally, for people checking certificates, zkCert gives them greater guarantees as it eliminates the possibility of counterfeit certificates.
          </p>
        </div>
      </main>
    </div>
  );
}
