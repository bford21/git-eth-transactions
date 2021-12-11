import type { NextPage } from 'next'
import Head from 'next/head'
import React from 'react'
import styles from '../styles/Home.module.css'
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';

const Home: NextPage = ({ txCount, heatmap }: any) => {
  return (
    <div className={styles.container}>
      <Head>
        <title>Git Eth Transactions</title>
        <meta name="description" content="visualize ethereum transaction activity via git style heatmap" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Welcome to <a target="_blank" href="">Git Eth Transactions!</a>
        </h1>

        <input type='text' placeholder="0xe644be3a05ed983cC18f5c1769fc1A38917ED030" />

          <div className={styles.heatmap_container}>
              <CalendarHeatmap
                  startDate={new Date('2020-12-31')}
                  endDate={new Date('2021-12-31')}
                  values={heatmap}
              />
          </div>

          <h1 className={styles.description}>2021 Report Card</h1>
          <h3 className={styles.description}>Transactions in 2021: { txCount }</h3>

      </main>
    </div>
  )
}

export default Home

export async function getServerSideProps() {
  const startBlock=11565019
  const endBlock=99999999
  const address="0xe644be3a05ed983cC18f5c1769fc1A38917ED030"

  // get transactions
  const res = await fetch(`https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=${startBlock}&endblock=${endBlock}&page=1&offset=10000&sort=asc&apikey=${process.env.ETHERSCAN_API_KEY}`)
  const data = await res.json()

  if (!data) {
      return {
          notFound: true,
      }
  }

  let txs = data.result
  let txCount = data.result.length

  // get all dates there was a transaction
  let timestamps: any[] = []
  txs.forEach((tx: any) => {
      let epoch = new Date(tx.timeStamp*1000)
      var year = epoch.getFullYear();
      var month = epoch.getMonth();
      var day = epoch.getDate();
      var date = year + '-' + month + '-' + day;
      timestamps.push(date)
  });

  // strip dupes
  var unique_timestamps = [... new Set(timestamps)]
  console.log(unique_timestamps);

  var heatmap: { date: any; count: number; }[] = []
  unique_timestamps.forEach(timestamp => {
      heatmap.push({date: timestamp, count: 1})
  })

  return {
      props: {
          txCount,
          heatmap
      },
  }
}