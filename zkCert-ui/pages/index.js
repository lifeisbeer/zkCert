import Head from 'next/head';
import Link from 'next/link';
import styles from '../styles/Home.module.css';

export default function Home() {
  return (
    <div className={styles.container}>
      <Head>
        <title>zkCert</title>
        <meta name="description" content="Digital certificates on blockchain using ZKPs" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Welcome to zkCert!
        </h1>

        <p className={styles.description}>
          The blockchain solution to digital certificates using ZK!
        </p>

        <div className={styles.grid}>
          <Link href="/issuer">
            <div className={styles.card}>
              <h2>Issuer &rarr;</h2>
              <p>Issue and manage digital certificates on the blockchain using ZK!</p>
            </div>
          </Link>

          <Link href="/holder">
            <div className={styles.card}>
              <h2>Holder &rarr;</h2>
              <p>Create an account and prove ownership of you certificates in ZK!</p>
            </div>
          </Link>

          <Link href="/verifier">
            <div className={styles.card}>
              <h2>Verifier &rarr;</h2>
              <p>Verify certificates, eliminate the possibility of counterfeits and fraud!</p>
            </div>
          </Link>
        </div>    
      </main>
    </div>
  )
}
