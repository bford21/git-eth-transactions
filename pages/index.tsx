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
      infuraId: process.env.INFURA_ID, // required
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

type StateType = {
  provider?: any
  web3Provider?: any
  address?: string
  chainId?: number
}

type ActionType =
  | {
      type: 'SET_WEB3_PROVIDER'
      provider?: StateType['provider']
      web3Provider?: StateType['web3Provider']
      address?: StateType['address']
      chainId?: StateType['chainId']
    }
  | {
      type: 'SET_ADDRESS'
      address?: StateType['address']
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
      }
    case 'SET_ADDRESS':
      return {
        ...state,
        address: action.address,
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

export const Home = ({ txCount, heatmap }): JSX.Element => {
  const [state, dispatch] = useReducer(reducer, initialState)
  const { provider, web3Provider, address, chainId } = state

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

    dispatch({
      type: 'SET_WEB3_PROVIDER',
      provider,
      web3Provider,
      address,
      chainId: network.chainId,
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
      const handleAccountsChanged = (accounts: string[]) => {
        // eslint-disable-next-line no-console
        console.log('accountsChanged', accounts)
        dispatch({
          type: 'SET_ADDRESS',
          address: accounts[0],
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
              <div>
                {web3Provider ? (
                  <button className="button" type="button" onClick={disconnect}>
                    Disconnect
                  </button>
                ) : (
                  <button className="button" type="button" onClick={connect}>
                    Connect
                  </button>
                )}
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

        <div className={styles.heatmap_container}>
          <CalendarHeatmap
            startDate={new Date('2020-12-31')}
            endDate={new Date('2021-12-31')}
            values={heatmap}
          />
        </div>

        <h1 className={styles.description}>2021 Report Card</h1>
        <h3 className={styles.description}>Transactions in 2021: {txCount}</h3>
      </main>

      <style jsx>{`
        main {
          padding: 5rem 0;
          text-align: center;
        }

        p {
          margin-top: 0;
        }

        .container {
          padding: 2rem;
          margin: 0 auto;
          max-width: 1200px;
        }

        .grid {
          display: grid;
          grid-template-columns: auto auto;
          justify-content: space-between;
        }

        .button {
          padding: 1rem 1.5rem;
          background: ${web3Provider ? 'red' : 'green'};
          border: none;
          border-radius: 0.5rem;
          color: #fff;
          font-size: 1.2rem;
        }

        .mb-0 {
          margin-bottom: 0;
        }
        .mb-1 {
          margin-bottom: 0.25rem;
        }
      `}</style>

      <style jsx global>{`
        html,
        body {
          padding: 0;
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto,
            Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue,
            sans-serif;
        }

        * {
          box-sizing: border-box;
        }
      `}</style>
    </div>
  )
}

export default Home

export async function getServerSideProps() {
  const startBlock = 11565019
  const endBlock = 99999999
  const address = '0xe644be3a05ed983cC18f5c1769fc1A38917ED030'

  // get transactions
  const res = await fetch(
    `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=${startBlock}&endblock=${endBlock}&page=1&offset=10000&sort=asc&apikey=${process.env.ETHERSCAN_API_KEY}`
  )
  const data = await res.json()

  if (!data) {
    return {
      notFound: true,
    }
  }

  const txs = data.result
  const txCount = data.result.length

  // get all dates there was a transaction
  const timestamps: any[] = []
  txs.forEach((tx: any) => {
    const epoch = new Date(tx.timeStamp * 1000)
    const year = epoch.getFullYear()
    const month = epoch.getMonth()
    const day = epoch.getDate()
    const date = year + '-' + month + '-' + day
    timestamps.push(date)
  })

  // strip dupes
  const unique_timestamps = [...new Set(timestamps)]

  const heatmap: { date: any; count: number }[] = []
  unique_timestamps.forEach((timestamp) => {
    heatmap.push({ date: timestamp, count: 1 })
  })

  return {
    props: {
      txCount,
      heatmap,
    },
  }
}
