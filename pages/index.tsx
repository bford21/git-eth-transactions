import WalletConnectProvider from '@walletconnect/web3-provider'
import { providers } from 'ethers'
import Head from 'next/head'
import { useCallback, useEffect, useReducer } from 'react'
import Web3Modal from 'web3modal'
import { ellipseAddress, getChainData } from '../lib/utilities'
import React from 'react'
import styles from '../styles/Home.module.css'
import CalendarHeatmap from 'react-calendar-heatmap'
import 'react-calendar-heatmap/dist/styles.css'

const providerOptions = {
  walletconnect: {
    package: WalletConnectProvider, // required
    options: {
      infuraId: process.env.NEXT_PUBLIC_INFURA_ID, // required
    },
  },
}

let web3Modal
if (typeof window !== 'undefined') {
  web3Modal = new Web3Modal({
    network: 'mainnet', // optional
    cacheProvider: true,
    providerOptions, // required
  })
}

type ChainReport = {
  totalTxs?: number,
  fees?: number,
  bestFriend?: string,
}

type ReportCard = {
  ethereum: ChainReport,
  polygon: ChainReport,
  arbitrum: ChainReport,
  optimism: ChainReport,
}

type StateType = {
  provider?: any
  web3Provider?: any
  address?: string
  chainId?: number
  heatmap?: {ethereum: { date: any; count: number }[], polygon: { date: any; count: number }[], arbitrum: { date: any; count: number }[], optimism: { date: any; count: number }[]}
  reportCard?: ReportCard
}

type ActionType =
  | {
      type: 'SET_WEB3_PROVIDER'
      provider?: StateType['provider']
      web3Provider?: StateType['web3Provider']
      address?: StateType['address']
      chainId?: StateType['chainId']
      heatmap?: StateType['heatmap']
      reportCard?: StateType['reportCard']
    }
  | {
      type: 'SET_ADDRESS'
      address?: StateType['address']
      heatmap?: StateType['heatmap']
      reportCard?: StateType['reportCard']
    }
  | {
      type: 'SET_CHAIN_ID'
      chainId?: StateType['chainId']
    }
  | {
      type: 'RESET_WEB3_PROVIDER'
    }

const initialState: StateType = {
  provider: null,
  web3Provider: null,
  address: null,
  chainId: null,
  heatmap: {ethereum: [], polygon: [], arbitrum: [], optimism: []},
  reportCard: null
}

function reducer(state: StateType, action: ActionType): StateType {
  switch (action.type) {
    case 'SET_WEB3_PROVIDER':
      return {
        ...state,
        provider: action.provider,
        web3Provider: action.web3Provider,
        address: action.address,
        chainId: action.chainId,
        heatmap: action.heatmap,
        reportCard: action.reportCard
      }
    case 'SET_ADDRESS':
      return {
        ...state,
        address: action.address,
        heatmap: action.heatmap,
        reportCard: action.reportCard
      }
    case 'SET_CHAIN_ID':
      return {
        ...state,
        chainId: action.chainId,
      }
    case 'RESET_WEB3_PROVIDER':
      return initialState
    default:
      throw new Error()
  }
}

function generateReportCard(txs) {
  console.log(txs)
  // TODO Clean this garbage up
  let report: ReportCard = {
    ethereum: {totalTxs: 0, fees: 0, bestFriend: ""},
    polygon: {totalTxs: 0, fees: 0, bestFriend: ""},
    arbitrum: {totalTxs: 0, fees: 0, bestFriend: ""},
    optimism: {totalTxs: 0, fees: 0, bestFriend: ""},
  }

  txs.ethereum.forEach((tx) => {
    report.ethereum.totalTxs++;
    report.ethereum.fees = report.ethereum.fees + ((tx.gasPrice * tx.gasUsed)/10**18)
  });

  txs.polygon.forEach((tx) => {
    report.polygon.totalTxs++;
    report.polygon.fees = report.polygon.fees + ((tx.gasPrice * tx.gasUsed)/10**18)
  });

  console.log(report);
  return report
}

// TODO: Refactor to be more reusable
function getHeatmapData(txs) {
  const heatmap: {ethereum: { date: any; count: number }[], polygon: { date: any; count: number }[], arbitrum: { date: any; count: number }[], optimism: { date: any; count: number }[]} = {ethereum: [], polygon: [], arbitrum: [], optimism: []}

  // ethereum transactions 
  if(txs.ethereum.length > 0) {
    let timestamps: any[] = []
    txs.ethereum.forEach((tx: any) => {
      const epoch = new Date(tx.timeStamp * 1000)
      const year = epoch.getFullYear()
      const month = epoch.getMonth()
      const day = epoch.getDate()
      const date = year + '-' + month + '-' + day
      timestamps.push(date)
    })
    let unique_timestamps = [...new Set(timestamps)] // strip dupes
    unique_timestamps.forEach((timestamp) => {
      heatmap.ethereum.push({ date: timestamp, count: 100 })
    })
  }

  // polygon transactions 
  if(txs.polygon.length > 0) {
    let timestamps: any[] = []
    txs.polygon.forEach((tx: any) => {
      const epoch = new Date(tx.timeStamp * 1000)
      const year = epoch.getFullYear()
      const month = epoch.getMonth()
      const day = epoch.getDate()
      const date = year + '-' + month + '-' + day
      timestamps.push(date)
    })
    let unique_timestamps = [...new Set(timestamps)] // strip dupes
    unique_timestamps.forEach((timestamp) => {
      heatmap.polygon.push({ date: timestamp, count: 1 })
    })
  }

  // arbitrum transactions 
  if(txs.arbitrum && txs.arbitrum.length > 0) {
    let timestamps: any[] = []
    txs.arbitrum.forEach((tx: any) => {
      const epoch = new Date(tx.timeStamp * 1000)
      const year = epoch.getFullYear()
      const month = epoch.getMonth()
      const day = epoch.getDate()
      const date = year + '-' + month + '-' + day
      timestamps.push(date)
    })
    let unique_timestamps = [...new Set(timestamps)] // strip dupes
    unique_timestamps.forEach((timestamp) => {
      heatmap.arbitrum.push({ date: timestamp, count: 1 })
    })
  }

  // arbitrum transactions 
  if(txs.optimism && txs.optimism.length > 0) {
    let timestamps: any[] = []
    txs.optimism.forEach((tx: any) => {
      const epoch = new Date(tx.timeStamp * 1000)
      const year = epoch.getFullYear()
      const month = epoch.getMonth()
      const day = epoch.getDate()
      const date = year + '-' + month + '-' + day
      timestamps.push(date)
    })
    let unique_timestamps = [...new Set(timestamps)] // strip dupes
    unique_timestamps.forEach((timestamp) => {
      heatmap.optimism.push({ date: timestamp, count: 1 })
    })
  }
  

  return heatmap
}

async function getTransactions(address) {
  const startBlock = 11565019 // Jan-01-2021 12:00:00 AM +UTC
  const endBlock = 99999999
  let txs = {ethereum: null, polygon: null, arbitrum: null, optimism: null}

  // ethereum txs
  // TODO: better logging/error handling
  const ethRes = await fetch(
    `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=${startBlock}&endblock=${endBlock}&page=1&offset=10000&sort=asc&apikey=${process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY}`
  )
  const data = await ethRes.json()
  txs.ethereum = data.result
  
  // polygon txs
  const polyRes = await fetch(
    `https://api.polygonscan.com/api?module=account&action=txlist&address=${address}&startblock=${startBlock}&endblock=${endBlock}&page=1&offset=10000&sort=asc&apikey=${process.env.NEXT_PUBLIC_POLYGONSCAN_API_KEY}`
  )
  const data2 = await polyRes.json()
  txs.polygon = data2.result

  // arbitrum txs
  const arbRes = await fetch(
    `https://api.arbiscan.io/api?module=account&action=txlist&address=${address}&startblock=${startBlock}&endblock=${endBlock}&page=1&offset=10000&sort=asc&apikey=${process.env.NEXT_PUBLIC_ARBISCAN_API_KEY}`
  )
  const data3 = arbRes
  txs.arbitrum = data3

  // // optimism txs
  const opRes = await fetch(
    `https://api-optimistic.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=${startBlock}&endblock=${endBlock}&page=1&offset=10000&sort=asc&apikey=${process.env.NEXT_PUBLIC_OPTIMISM_API_KEY}`
  )
  const data4 = await opRes.json()
  txs.optimism = data4.result

  return txs
}

export const Home = (): JSX.Element => {
  const [state, dispatch] = useReducer(reducer, initialState)
  const { provider, web3Provider, address, chainId, heatmap, reportCard } = state

  const connect = useCallback(async function () {
    // This is the initial `provider` that is returned when
    // using web3Modal to connect. Can be MetaMask or WalletConnect.
    const provider = await web3Modal.connect()

    // We plug the initial `provider` into ethers.js and get back
    // a Web3Provider. This will add on methods from ethers.js and
    // event listeners such as `.on()` will be different.
    const web3Provider = new providers.Web3Provider(provider)

    const signer = web3Provider.getSigner()
    const address = await signer.getAddress()

    const network = await web3Provider.getNetwork()

    const txs = await getTransactions(address);
    const heatmap = getHeatmapData(txs);
    const reportCard = generateReportCard(txs);

    dispatch({
      type: 'SET_WEB3_PROVIDER',
      provider,
      web3Provider,
      address,
      chainId: network.chainId,
      heatmap,
      reportCard,
    })
  }, [])

  const disconnect = useCallback(
    async function () {
      await web3Modal.clearCachedProvider()
      if (provider?.disconnect && typeof provider.disconnect === 'function') {
        await provider.disconnect()
      }
      dispatch({
        type: 'RESET_WEB3_PROVIDER',
      })
    },
    [provider]
  )

  // Auto connect to the cached provider
  useEffect(() => {
    if (web3Modal.cachedProvider) {
      connect()
    }
  }, [connect])

  // A `provider` should come with EIP-1193 events. We'll listen for those events
  // here so that when a user switches accounts or networks, we can update the
  // local React state with that new information.
  useEffect(() => {
    if (provider?.on) {
      const handleAccountsChanged = async (accounts: string[]) => {
        // eslint-disable-next-line no-console
        console.log('accountsChanged', accounts)

        const txs = await getTransactions(accounts[0]);
        const heatmap = getHeatmapData(txs);
        const reportCard = generateReportCard(txs);

        dispatch({
          type: 'SET_ADDRESS',
          address: accounts[0],
          heatmap: heatmap,
          reportCard: reportCard
        })
      }

      // https://docs.ethers.io/v5/concepts/best-practices/#best-practices--network-changes
      const handleChainChanged = (_hexChainId: string) => {
        window.location.reload()
      }

      const handleDisconnect = (error: { code: number; message: string }) => {
        // eslint-disable-next-line no-console
        console.log('disconnect', error)
        disconnect()
      }

      provider.on('accountsChanged', handleAccountsChanged)
      provider.on('chainChanged', handleChainChanged)
      provider.on('disconnect', handleDisconnect)

      // Subscription Cleanup
      return () => {
        if (provider.removeListener) {
          provider.removeListener('accountsChanged', handleAccountsChanged)
          provider.removeListener('chainChanged', handleChainChanged)
          provider.removeListener('disconnect', handleDisconnect)
        }
      }
    }
  }, [provider, disconnect])

  const chainData = getChainData(chainId)

  return (
    <div className={styles.container}>
      <Head>
        <title>Git Eth Transactions</title>
        <meta
          name="description"
          content="visualize ethereum transaction activity via git style heatmap"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <header>
          {address && (
            <div className="grid">
              <div>
                <p className="mb-1">Network:</p>
                <p>{chainData?.name}</p>
              </div>
              <div>
                <p className="mb-1">Address:</p>
                <p>{ellipseAddress(address)}</p>
              </div>
            </div>
          )}
        </header>

        <h1 className={styles.title}>
          Welcome to{' '}
          <a target="_blank" href="">
            Git Eth Transactions!
          </a>
        </h1>

        {web3Provider ? (
          <button className="button" type="button" onClick={disconnect}>
            Disconnect
          </button>
        ) : (
          <button className="button" type="button" onClick={connect}>
            Connect
          </button>
        )}

        <h3>Ethereum</h3>
        <div className={styles.heatmap_container}>
          <CalendarHeatmap
            startDate={new Date('2020-12-31')}
            endDate={new Date('2021-12-31')}
            values={heatmap.ethereum}
          />
        </div>

        <h3>Polygon</h3>
        <div className={styles.heatmap_container}>
          <CalendarHeatmap
            startDate={new Date('2020-12-31')}
            endDate={new Date('2021-12-31')}
            values={heatmap.polygon}
          />
        </div>

        {/* <h3>Arbitrum</h3>
        <div className={styles.heatmap_container}>
          <CalendarHeatmap
            startDate={new Date('2020-12-31')}
            endDate={new Date('2021-12-31')}
            values={heatmap.arbitrum}
          />
        </div>

        <h3>Optimism</h3>
        <div className={styles.heatmap_container}>
          <CalendarHeatmap
            startDate={new Date('2020-12-31')}
            endDate={new Date('2021-12-31')}
            values={heatmap.optimism}
          />
        </div> */}

        <h1 className={styles.title}>2021 Report Card</h1>
        <h3 className={styles.description}>Transactions:</h3>
          <p>Ethereum: {reportCard?.ethereum?.totalTxs}</p>
          <p>Polygon: {reportCard?.polygon?.totalTxs}</p>
          <p>Arbitrum: {reportCard?.arbitrum?.totalTxs}</p>
          <p>Optimism: {reportCard?.optimism?.totalTxs}</p>
          <p>Total: {reportCard?.ethereum?.totalTxs + reportCard?.polygon?.totalTxs + reportCard?.arbitrum?.totalTxs + reportCard?.optimism?.totalTxs}</p>

        <h3 className={styles.description}>Fees:</h3>
          <p>Ethereum: {reportCard?.ethereum?.fees} ETH</p>
          <p>Polygon: {reportCard?.polygon?.fees} MATIC</p>
          <p>Arbitrum: {reportCard?.arbitrum?.fees} ETH</p>
          <p>Optimism: {reportCard?.optimism?.fees} ETH</p>
          <p>Totals:</p>
          <p>{reportCard?.ethereum?.fees + reportCard?.optimism?.fees + reportCard?.polygon?.fees} ETH</p>
          <p>Polygon: {reportCard?.polygon?.fees} MATIC</p>

        <h3 className={styles.description}>Best Friend: {reportCard?.ethereum.bestFriend}</h3>

      </main>

      </div>
  )
}

export default Home
