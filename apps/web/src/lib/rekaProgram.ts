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

export const REKA_PROGRAM_ID = new PublicKey(
  '3CLJYRpGhR5ZKmaC3Asvtww7BECvbFsa5L81454NZWjX',
)

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
  verifierName: string
}

type RekaRpcBuilder = {
  accounts: (accounts: Record<string, PublicKey | undefined>) => {
    rpc: () => Promise<string>
  }
}

type RekaMethods = {
  createPassport: (input: Record<string, unknown>) => RekaRpcBuilder
  addHistory: (input: Record<string, unknown>) => RekaRpcBuilder
  transferPassport: (newOwner: PublicKey, newOwnerName: string) => RekaRpcBuilder
}

const REKA_IDL = {
  address: REKA_PROGRAM_ID.toBase58(),
  metadata: {
    name: 'reka',
    version: '0.1.0',
    spec: '0.1.0',
    description: 'Asset passport program for second-hand student devices',
    deployments: {
      devnet: REKA_PROGRAM_ID.toBase58(),
    },
  },
  instructions: [
    {
      name: 'createPassport',
      discriminator: [107, 136, 98, 163, 167, 217, 174, 84],
      accounts: [
        { name: 'passport', writable: true },
        { name: 'payer', writable: true, signer: true },
        { name: 'systemProgram', address: SystemProgram.programId.toBase58() },
      ],
      args: [
        {
          name: 'input',
          type: { defined: { name: 'CreatePassportInput' } },
        },
      ],
    },
    {
      name: 'addHistory',
      discriminator: [35, 145, 238, 126, 183, 72, 172, 72],
      accounts: [
        { name: 'passport', writable: true },
        { name: 'historyEntry', writable: true },
        { name: 'verifier', writable: true, signer: true },
        { name: 'systemProgram', address: SystemProgram.programId.toBase58() },
      ],
      args: [
        {
          name: 'input',
          type: { defined: { name: 'AddHistoryInput' } },
        },
      ],
    },
    {
      name: 'transferPassport',
      discriminator: [136, 240, 160, 85, 79, 87, 213, 229],
      accounts: [
        { name: 'passport', writable: true },
        { name: 'owner', signer: true },
      ],
      args: [
        { name: 'newOwner', type: 'pubkey' },
        { name: 'newOwnerName', type: 'string' },
      ],
    },
  ],
  accounts: [
    {
      name: 'DevicePassport',
      discriminator: [149, 14, 206, 51, 183, 17, 64, 37],
    },
    {
      name: 'HistoryEntry',
      discriminator: [14, 178, 110, 12, 9, 209, 227, 182],
    },
  ],
  events: [
    {
      name: 'PassportCreated',
      discriminator: [141, 164, 208, 246, 206, 99, 181, 228],
    },
    {
      name: 'HistoryAdded',
      discriminator: [138, 230, 17, 203, 117, 129, 38, 3],
    },
    {
      name: 'PassportTransferred',
      discriminator: [75, 188, 194, 167, 118, 90, 28, 221],
    },
  ],
  types: [
    {
      name: 'CreatePassportInput',
      type: {
        kind: 'struct',
        fields: [
          { name: 'category', type: 'string' },
          { name: 'brand', type: 'string' },
          { name: 'model', type: 'string' },
          { name: 'serialHash', type: 'string' },
          { name: 'condition', type: 'string' },
          { name: 'batteryHealth', type: 'string' },
          { name: 'estimatedValue', type: 'string' },
          { name: 'city', type: 'string' },
          { name: 'owner', type: 'pubkey' },
          { name: 'ownerName', type: 'string' },
          { name: 'verifierName', type: 'string' },
        ],
      },
    },
    {
      name: 'AddHistoryInput',
      type: {
        kind: 'struct',
        fields: [
          { name: 'entryId', type: 'string' },
          { name: 'kind', type: 'u8' },
          { name: 'title', type: 'string' },
          { name: 'notes', type: 'string' },
          { name: 'verifierName', type: 'string' },
        ],
      },
    },
    {
      name: 'DevicePassport',
      type: {
        kind: 'struct',
        fields: [
          { name: 'authority', type: 'pubkey' },
          { name: 'owner', type: 'pubkey' },
          { name: 'ownerName', type: 'string' },
          { name: 'category', type: 'string' },
          { name: 'brand', type: 'string' },
          { name: 'model', type: 'string' },
          { name: 'serialHash', type: 'string' },
          { name: 'condition', type: 'string' },
          { name: 'batteryHealth', type: 'string' },
          { name: 'estimatedValue', type: 'string' },
          { name: 'city', type: 'string' },
          { name: 'verifierName', type: 'string' },
          { name: 'trustScore', type: 'u8' },
          { name: 'historyCount', type: 'u32' },
          { name: 'transferCount', type: 'u32' },
          { name: 'createdAt', type: 'i64' },
          { name: 'updatedAt', type: 'i64' },
          { name: 'bump', type: 'u8' },
        ],
      },
    },
    {
      name: 'HistoryEntry',
      type: {
        kind: 'struct',
        fields: [
          { name: 'passport', type: 'pubkey' },
          { name: 'verifier', type: 'pubkey' },
          { name: 'entryId', type: 'string' },
          { name: 'kind', type: 'u8' },
          { name: 'title', type: 'string' },
          { name: 'notes', type: 'string' },
          { name: 'verifierName', type: 'string' },
          { name: 'createdAt', type: 'i64' },
          { name: 'bump', type: 'u8' },
        ],
      },
    },
  ],
  errors: [
    {
      code: 6000,
      name: 'FieldTooLong',
      msg: 'One of the text fields is longer than the supported MVP limit.',
    },
    {
      code: 6001,
      name: 'InvalidHistoryKind',
      msg: 'History kind must be 0 inspection, 1 repair, 2 warranty, or 3 ownership.',
    },
    {
      code: 6002,
      name: 'UnauthorizedOwner',
      msg: 'Only the current owner can transfer this passport.',
    },
    {
      code: 6003,
      name: 'CounterOverflow',
      msg: 'Counter overflow.',
    },
  ],
} satisfies Idl

export function derivePassportPda(serialHash: string) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('passport'), Buffer.from(serialHash)],
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

export async function addHistoryOnChain(
  wallet: BrowserWallet,
  input: AddHistoryOnChainInput,
) {
  const program = getRekaProgram(wallet)
  const methods = program.methods as unknown as RekaMethods
  const historyEntry = deriveHistoryPda(input.passport, input.entryId)
  const signature = await methods
    .addHistory({
      entryId: input.entryId,
      kind: input.kind,
      title: input.title,
      notes: input.notes,
      verifierName: input.verifierName,
    })
    .accounts({
      passport: input.passport,
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

function getRekaProgram(wallet: BrowserWallet) {
  if (!wallet.publicKey || !wallet.signTransaction || !wallet.signAllTransactions) {
    throw new Error('Wallet harus tersambung dan mendukung signing transaksi.')
  }

  const connection = new Connection(clusterApiUrl('devnet'), 'confirmed')
  const provider = new AnchorProvider(connection, wallet as unknown as AnchorProvider['wallet'], {
    commitment: 'confirmed',
    preflightCommitment: 'confirmed',
  })

  return new Program(REKA_IDL, provider)
}
