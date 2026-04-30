import { clusterApiUrl, Connection, PublicKey } from '@solana/web3.js'

const programId = new PublicKey('AkRsKmDKtdwE6A4fU3M56L5mh1UxspS4MqMCCY4sG1Mg')
const connection = new Connection(clusterApiUrl('devnet'), 'confirmed')
const account = await connection.getAccountInfo(programId)

console.log(`Reka program: ${programId.toBase58()}`)
console.log('Cluster: devnet')

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
