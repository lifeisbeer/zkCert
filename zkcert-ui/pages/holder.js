import Head from 'next/head'
import Link from 'next/link';
import styles from '../styles/Pages.module.css'

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
          Holder Page
        </h1>

        <div className={styles.grid}>
            <Link href="/">
                <div className={styles.card}>
                <h2>Back home &rarr;</h2>
                </div>
            </Link>
        </div>    
      </main>
    </div>
  )
}