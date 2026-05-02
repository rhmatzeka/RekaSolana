import { clusterApiUrl, Connection, PublicKey } from '@solana/web3.js'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

loadEnvFile(resolve(process.cwd(), '.env'))
loadEnvFile(resolve(process.cwd(), 'apps/web/.env'))

const cluster = readCluster(process.env.VITE_REKA_CLUSTER)
const rpcUrl = process.env.VITE_REKA_RPC_URL || clusterApiUrl(cluster)
const programId = new PublicKey(
  process.env.VITE_REKA_PROGRAM_ID || 'AkRsKmDKtdwE6A4fU3M56L5mh1UxspS4MqMCCY4sG1Mg',
)
const connection = new Connection(rpcUrl, 'confirmed')
const account = await connection.getAccountInfo(programId)

console.log(`Reka program: ${programId.toBase58()}`)
console.log(`Cluster: ${cluster}`)

if (!account) {
  console.log('Status: NOT DEPLOYED')
  process.exitCode = 1
} else if (!account.executable) {
  console.log('Status: ACCOUNT EXISTS, BUT IT IS NOT AN EXECUTABLE PROGRAM')
  console.log(`Owner: ${account.owner.toBase58()}`)
  console.log(`Lamports: ${account.lamports}`)
  process.exitCode = 1
} else {
  console.log('Status: DEPLOYED AND EXECUTABLE')
  console.log(`Owner: ${account.owner.toBase58()}`)
  console.log(`Data length: ${account.data.length} bytes`)
}

function loadEnvFile(path) {
  if (!existsSync(path)) return

  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const [key, ...valueParts] = trimmed.split('=')
    if (!key || process.env[key]) continue
    process.env[key] = valueParts.join('=').replace(/^["']|["']$/g, '')
  }
}

function readCluster(value) {
  if (value === 'devnet' || value === 'testnet' || value === 'mainnet-beta') {
    return value
  }

  return 'devnet'
}
