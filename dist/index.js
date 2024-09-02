"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const web3_js_1 = require("@solana/web3.js");
const spl_token_1 = require("@solana/spl-token");
const GLOBAL = new web3_js_1.PublicKey("4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf");
const FEE_RECIPIENT = new web3_js_1.PublicKey("CebN5WGQ4jvEPvsVU4EoHEpgzq1VV7AbicfhtW4xC9iM");
const TOKEN_PROGRAM_ID = new web3_js_1.PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const ASSOC_TOKEN_ACC_PROG = new web3_js_1.PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");
const RENT = new web3_js_1.PublicKey("SysvarRent111111111111111111111111111111111");
const PUMP_FUN_PROGRAM = new web3_js_1.PublicKey("6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P");
const PUMP_FUN_ACCOUNT = new web3_js_1.PublicKey("Ce6TQqeHC9p8KetsN6JsjHK7UTZk7nasjjnr7XxXp9F1");
const SYSTEM_PROGRAM_ID = web3_js_1.SystemProgram.programId;
const bs58_1 = __importDefault(require("bs58"));
// Function to make delay
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
// Function to generate Sell and Close Account Instructions
function getSellCloseTransaction(wallet_keypair, latest_BlockHash, solanaTip, token_mint, bonding_curve, associated_bonding, token_balance, token_account_created) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const txBuilder = new web3_js_1.Transaction();
            const microLamports = Math.trunc(solanaTip);
            const computeUnitPriceInstruction = web3_js_1.ComputeBudgetProgram.setComputeUnitPrice({ microLamports });
            const computeUnitLimitInstruction = web3_js_1.ComputeBudgetProgram.setComputeUnitLimit({ units: 50e3 });
            const payer = wallet_keypair;
            const owner = payer.publicKey;
            const mint = new web3_js_1.PublicKey(token_mint);
            const tokenAccount = token_account_created;
            const minSolOutput = 0;
            const keys = [
                { pubkey: GLOBAL, isSigner: false, isWritable: false },
                { pubkey: FEE_RECIPIENT, isSigner: false, isWritable: true },
                { pubkey: mint, isSigner: false, isWritable: false },
                { pubkey: new web3_js_1.PublicKey(bonding_curve), isSigner: false, isWritable: true },
                { pubkey: new web3_js_1.PublicKey(associated_bonding), isSigner: false, isWritable: true },
                { pubkey: tokenAccount, isSigner: false, isWritable: true },
                { pubkey: owner, isSigner: false, isWritable: true },
                { pubkey: SYSTEM_PROGRAM_ID, isSigner: false, isWritable: false },
                { pubkey: ASSOC_TOKEN_ACC_PROG, isSigner: false, isWritable: false },
                { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
                { pubkey: PUMP_FUN_ACCOUNT, isSigner: false, isWritable: false },
                { pubkey: PUMP_FUN_PROGRAM, isSigner: false, isWritable: false }
            ];
            let bufferDiscriminator = Buffer.alloc(8);
            bufferDiscriminator.writeBigUInt64LE(BigInt("12502976635542562355"));
            let bufferTokenOut = Buffer.alloc(8);
            bufferTokenOut.writeBigUInt64LE(BigInt(token_balance));
            let bufferMaxSolCost = Buffer.alloc(8);
            bufferMaxSolCost.writeBigUInt64LE(BigInt(minSolOutput));
            const data = Buffer.concat([bufferDiscriminator, bufferTokenOut, bufferMaxSolCost]);
            const sellInstruction = new web3_js_1.TransactionInstruction({
                keys: keys,
                programId: PUMP_FUN_PROGRAM,
                data: data
            });
            const closeAccountInstructions = (0, spl_token_1.createCloseAccountInstruction)(tokenAccount, wallet_keypair.publicKey, wallet_keypair.publicKey);
            yield Promise.all([
                txBuilder.add(computeUnitPriceInstruction),
                txBuilder.add(computeUnitLimitInstruction),
                txBuilder.add(sellInstruction),
                txBuilder.add(closeAccountInstructions)
            ]);
            txBuilder.recentBlockhash = latest_BlockHash;
            txBuilder.feePayer = wallet_keypair.publicKey;
            txBuilder.sign(wallet_keypair);
            return txBuilder;
        }
        catch (e) {
            console.log("getSellCloseTransaction", e);
            throw e;
        }
    });
}
// Main Function
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(new Date(), "CookedCoins Clean Wallet Coins and Close Associated Accounts");
        // REPLACE BU YOUR RPC NODE CONNECTION
        const solanaConnection = new web3_js_1.Connection('https://api.mainnet-beta.solana.com');
        // REPLACE BY YOUR WALLET
        const main_wallet_decoded = bs58_1.default.decode("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
        const wallet_keypair = web3_js_1.Keypair.fromSecretKey(main_wallet_decoded);
        console.log(new Date(), "CookedCoins Fetching Token Data in Wallet");
        const token_data = yield solanaConnection.getParsedTokenAccountsByOwner(wallet_keypair.publicKey, { programId: new web3_js_1.PublicKey(TOKEN_PROGRAM_ID) });
        console.log(new Date(), `CookedCoins Processing Token Array of ${token_data.value.length} elements`);
        for (const element of token_data.value) {
            const associated_account = new web3_js_1.PublicKey(element.pubkey);
            const token_mint = element.account.data.parsed.info.mint;
            const token_amount = element.account.data.parsed.info.tokenAmount.amount;
            const [bondingCurve] = web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("bonding-curve"), new web3_js_1.PublicKey(token_mint).toBytes()], PUMP_FUN_PROGRAM);
            const [associatedBondingCurve] = web3_js_1.PublicKey.findProgramAddressSync([bondingCurve.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), new web3_js_1.PublicKey(token_mint).toBytes()], ASSOC_TOKEN_ACC_PROG);
            const latest_BlockHash = yield solanaConnection.getLatestBlockhash();
            const transaction = yield getSellCloseTransaction(wallet_keypair, latest_BlockHash.blockhash, 10000, token_mint, bondingCurve.toString(), associatedBondingCurve.toString(), token_amount, associated_account);
            // USE WHAT YOU PREFER
            console.log(new Date(), `Sending Sell Transaction for Token Mint: ${token_mint} and Closing Account: ${associated_account} Token Amount = ${token_amount}`);
            // const transactionConfirmationResult = await sendAndConfirmTransaction(solanaConnection, transaction,[wallet_keypair], {skipPreflight:true});        
            // console.log(new Date(),`https://solscan.io/tx/${transactionConfirmationResult}`);        
            const transactionResult = yield solanaConnection.sendTransaction(transaction, [wallet_keypair], { skipPreflight: true });
            console.log(new Date(), `https://solscan.io/tx/${transactionResult}`);
            // IF https://api.mainnet-beta.solana.com ADJUST DELAY TO REQUEST PER SECONDS ALLOWED
            yield delay(1);
        }
    });
}
main();
