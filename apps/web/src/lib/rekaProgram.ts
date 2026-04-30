import {
  AnchorProvider,
  Program,
  type Idl,
} from '@coral-xyz/anchor'
import {
  clusterApiUrl,
  Connection,
  PublicKey,
  SystemProgram,
  type Transaction,
} from '@solana/web3.js'
import { Buffer } from 'buffer'
import rekaIdl from '../idl/reka.json'

export const REKA_PROGRAM_ID = new PublicKey(
  'AkRsKmDKtdwE6A4fU3M56L5mh1UxspS4MqMCCY4sG1Mg',
)
export const REKA_CLUSTER = 'devnet'

export type BrowserWallet = {
  publicKey?: PublicKey
  connect: () => Promise<{ publicKey: PublicKey }>
  signTransaction?: <T extends Transaction>(transaction: T) => Promise<T>
  signAllTransactions?: <T extends Transaction>(transactions: T[]) => Promise<T[]>
}

export type CreatePassportOnChainInput = {
  category: string
  brand: string
  model: string
  serialHash: string
  condition: string
  batteryHealth: string
  estimatedValue: string
  city: string
  owner: PublicKey
  ownerName: string
  verifierName: string
}

export type AddHistoryOnChainInput = {
  passport: PublicKey
  entryId: string
  kind: number
  title: string
  notes: string
  evidenceHash: string
  evidenceUri: string
}

export type RegisterVerifierOnChainInput = {
  verifier: PublicKey
  name: string
  location: string
  evidenceUri: string
}

type RekaRpcBuilder = {
  accounts: (accounts: Record<string, PublicKey | undefined>) => {
    rpc: () => Promise<string>
  }
}

type RekaMethods = {
  initializeRegistry: (authorityName: string) => RekaRpcBuilder
  registerVerifier: (
    name: string,
    location: string,
    evidenceUri: string,
  ) => RekaRpcBuilder
  setVerifierStatus: (active: boolean) => RekaRpcBuilder
  createPassport: (input: Record<string, unknown>) => RekaRpcBuilder
  addHistory: (input: Record<string, unknown>) => RekaRpcBuilder
  transferPassport: (newOwner: PublicKey, newOwnerName: string) => RekaRpcBuilder
}

const REKA_IDL = rekaIdl as Idl

export function derivePassportPda(serialHash: string) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('passport'), Buffer.from(serialHash)],
    REKA_PROGRAM_ID,
  )[0]
}

export function deriveRegistryConfigPda() {
  return PublicKey.findProgramAddressSync([Buffer.from('config')], REKA_PROGRAM_ID)[0]
}

export function deriveVerifierProfilePda(verifier: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('verifier'), verifier.toBuffer()],
    REKA_PROGRAM_ID,
  )[0]
}

export function deriveHistoryPda(passport: PublicKey, entryId: string) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('history'), passport.toBuffer(), Buffer.from(entryId)],
    REKA_PROGRAM_ID,
  )[0]
}

export async function createPassportOnChain(
  wallet: BrowserWallet,
  input: CreatePassportOnChainInput,
) {
  const program = getRekaProgram(wallet)
  const methods = program.methods as unknown as RekaMethods
  const passport = derivePassportPda(input.serialHash)
  const signature = await methods
    .createPassport({
      category: input.category,
      brand: input.brand,
      model: input.model,
      serialHash: input.serialHash,
      condition: input.condition,
      batteryHealth: input.batteryHealth,
      estimatedValue: input.estimatedValue,
      city: input.city,
      owner: input.owner,
      ownerName: input.ownerName,
      verifierName: input.verifierName,
    })
    .accounts({
      passport,
      payer: wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc()

  return { signature, passport }
}

export async function initializeRegistryOnChain(
  wallet: BrowserWallet,
  authorityName: string,
) {
  const program = getRekaProgram(wallet)
  const methods = program.methods as unknown as RekaMethods
  const config = deriveRegistryConfigPda()
  const signature = await methods
    .initializeRegistry(authorityName)
    .accounts({
      config,
      authority: wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc()

  return { signature, config }
}

export async function registerVerifierOnChain(
  wallet: BrowserWallet,
  input: RegisterVerifierOnChainInput,
) {
  const program = getRekaProgram(wallet)
  const methods = program.methods as unknown as RekaMethods
  const config = deriveRegistryConfigPda()
  const verifierProfile = deriveVerifierProfilePda(input.verifier)
  const signature = await methods
    .registerVerifier(input.name, input.location, input.evidenceUri)
    .accounts({
      config,
      verifierProfile,
      authority: wallet.publicKey,
      verifier: input.verifier,
      systemProgram: SystemProgram.programId,
    })
    .rpc()

  return { signature, verifierProfile }
}

export async function addHistoryOnChain(
  wallet: BrowserWallet,
  input: AddHistoryOnChainInput,
) {
  const program = getRekaProgram(wallet)
  const methods = program.methods as unknown as RekaMethods
  const historyEntry = deriveHistoryPda(input.passport, input.entryId)
  const verifierProfile = deriveVerifierProfilePda(wallet.publicKey!)
  const signature = await methods
    .addHistory({
      entryId: input.entryId,
      kind: input.kind,
      title: input.title,
      notes: input.notes,
      evidenceHash: input.evidenceHash,
      evidenceUri: input.evidenceUri,
    })
    .accounts({
      passport: input.passport,
      verifierProfile,
      historyEntry,
      verifier: wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc()

  return { signature, historyEntry }
}

export async function transferPassportOnChain(
  wallet: BrowserWallet,
  passport: PublicKey,
  newOwner: PublicKey,
  newOwnerName: string,
) {
  const program = getRekaProgram(wallet)
  const methods = program.methods as unknown as RekaMethods
  const signature = await methods
    .transferPassport(newOwner, newOwnerName)
    .accounts({
      passport,
      owner: wallet.publicKey,
    })
    .rpc()

  return { signature }
}

export async function checkRekaProgramStatus() {
  const connection = createRekaConnection()
  const account = await connection.getAccountInfo(REKA_PROGRAM_ID)

  return {
    programId: REKA_PROGRAM_ID.toBase58(),
    deployed: Boolean(account),
    executable: Boolean(account?.executable),
  }
}

export function getRekaProgramExplorerUrl() {
  return `https://explorer.solana.com/address/${REKA_PROGRAM_ID.toBase58()}?cluster=${REKA_CLUSTER}`
}

function getRekaProgram(wallet: BrowserWallet) {
  if (!wallet.publicKey || !wallet.signTransaction || !wallet.signAllTransactions) {
    throw new Error('Wallet harus tersambung dan mendukung signing transaksi.')
  }

  const connection = createRekaConnection()
  const provider = new AnchorProvider(connection, wallet as unknown as AnchorProvider['wallet'], {
    commitment: 'confirmed',
    preflightCommitment: 'confirmed',
  })

  return new Program(REKA_IDL, provider)
}

function createRekaConnection() {
  return new Connection(clusterApiUrl(REKA_CLUSTER), 'confirmed')
}
