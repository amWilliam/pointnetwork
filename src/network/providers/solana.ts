import * as web3 from '@solana/web3.js';
import {mnemonicToSeedSync} from 'bip39';
import {getSecretPhrase} from '../../wallet/keystore';
import config from 'config';
import axios from 'axios';
const logger = require('../../core/log');
const log = logger.child({module: 'SolanaProvider'});

// These interfaces are copied from @solana/web3
// However, they are not exported in index file, and trying to import them leads to
// a bunch of ts errors in other library files
export interface TransactionJSON {
    recentBlockhash: string | null;
    feePayer: string | null;
    nonceInfo: {
        nonce: string;
        nonceInstruction: TransactionInstructionJSON;
    } | null;
    instructions: TransactionInstructionJSON[];
    signers: string[];
}

interface TransactionInstructionJSON {
    keys: {
        pubkey: string;
        isSigner: boolean;
        isWritable: boolean;
    }[];
    programId: string;
    data: number[];
}

const createSolanaConnection = (blockchainUrl: string) => {
    const connection = new web3.Connection(
        blockchainUrl,
        'confirmed'
    );

    log.debug({blockchainUrl}, 'Created solana instance');
    return connection;
};

const createSolanaWallet = () => {
    const seed = mnemonicToSeedSync(getSecretPhrase());
    return web3.Keypair.fromSeed(Uint8Array.from(seed.toJSON().data.slice(0, 32)));
};

const networks: Record<string, {type: string; address: string}> = config.get('network.web3');
const providers: Record<string, {connection: web3.Connection; wallet: web3.Keypair}> =
    Object.keys(networks)
        .filter(key => networks[key].type === 'solana')
        .reduce(
            (acc, cur) => ({
                ...acc,
                [cur]: {
                    connection: createSolanaConnection(networks[cur].address),
                    wallet: createSolanaWallet()
                }
            }),
            {}
        );

const instructionFromJson = (json: TransactionInstructionJSON): web3.TransactionInstruction => ({
    keys: json.keys.map(({
        pubkey,
        isSigner,
        isWritable
    }) => ({
        pubkey: new web3.PublicKey(pubkey),
        isSigner,
        isWritable
    })),
    programId: new web3.PublicKey(json.programId),
    data: Buffer.from(json.data)
});

const solana = {
    requestAccount: async (id: number, network: string) => {
        const provider = providers[network];
        if (!provider) {
            throw new Error(`Unknown network ${network}`);
        }
        return {
            jsonrpc: '2.0',
            result: {publicKey: provider.wallet.publicKey.toString()},
            id
        };
    },
    signAndSendTransaction: async (id: number, txProps: TransactionJSON, network: string) => {
        const provider = providers[network];
        if (!provider) {
            throw new Error(`Unknown network ${network}`);
        }
        const {connection, wallet} = provider;
        const transaction = new web3.Transaction();

        if (txProps.recentBlockhash) {
            transaction.recentBlockhash = txProps.recentBlockhash;
        }
        if (txProps.feePayer) {
            transaction.feePayer = new web3.PublicKey(txProps.feePayer);
        }
        if (txProps.nonceInfo) {
            transaction.nonceInfo = {
                nonce: txProps.nonceInfo.nonce,
                nonceInstruction: instructionFromJson(txProps.nonceInfo.nonceInstruction)
            };
        }
        transaction.instructions = txProps.instructions.map(instr => instructionFromJson(instr));
        transaction.signatures = txProps.signers.map(s => ({
            signature: null,
            publicKey: new web3.PublicKey(s)
        }));

        const hash = await web3.sendAndConfirmTransaction(
            connection,
            transaction,
            [wallet]
        );

        return {
            jsonrpc: '2.0',
            result: hash,
            id
        };
    },
    send: async ({method, params = [], id = new Date().getTime(), network}: {
        method: string,
        params?: unknown[],
        id?: number,
        network: string
    }) => {
        const blockchainUrl = networks[network];
        if (!blockchainUrl) {
            throw new Error(`Unknown network ${network}`);
        }
        if (blockchainUrl.type !== 'solana') {
            throw new Error(`Wrong network type for ${network}, solana expected`);
        }
        const res = await axios.post(
            blockchainUrl.address,
            {method, params, id, jsonrpc: '2.0'},
            {validateStatus: () => true}
        );
        if (res.status !== 200) {
            throw new Error(
                `RPC call failed with status ${res.status}: ${JSON.stringify(res.data)}`
            );
        }
        return res.data;
    }
};

export default solana;