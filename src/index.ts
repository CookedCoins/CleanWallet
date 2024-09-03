import { 
    Keypair,
    PublicKey,
    SystemProgram,
    Connection,    
    Transaction,
    TransactionInstruction,    
    ComputeBudgetProgram    
} from "@solana/web3.js";

import { createCloseAccountInstruction
} from "@solana/spl-token";

const GLOBAL = new PublicKey("4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf");
const FEE_RECIPIENT = new PublicKey("CebN5WGQ4jvEPvsVU4EoHEpgzq1VV7AbicfhtW4xC9iM");
const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const ASSOC_TOKEN_ACC_PROG = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");
const RENT = new PublicKey("SysvarRent111111111111111111111111111111111");
const PUMP_FUN_PROGRAM = new PublicKey("6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P");
const PUMP_FUN_ACCOUNT = new PublicKey("Ce6TQqeHC9p8KetsN6JsjHK7UTZk7nasjjnr7XxXp9F1");
const SYSTEM_PROGRAM_ID = SystemProgram.programId;
import bs58 from 'bs58';

// Function to make delay
function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

// Function to generate Sell and Close Account Instructions
async function getSellCloseTransaction(wallet_keypair: Keypair, latest_BlockHash:string, solanaTip: number, token_mint: string, bonding_curve: string, associated_bonding: string, token_balance: number, token_account_created: PublicKey) :Promise<Transaction>{
    try{
        
      const txBuilder = new Transaction();
  
      const microLamports = Math.trunc(solanaTip);
      const computeUnitPriceInstruction = ComputeBudgetProgram.setComputeUnitPrice({ microLamports });
      const computeUnitLimitInstruction = ComputeBudgetProgram.setComputeUnitLimit({ units: 50e3 });   
  
      const payer = wallet_keypair;
      const owner = payer.publicKey;
      const mint = new PublicKey(token_mint);
      
      const tokenAccount = token_account_created;
      const minSolOutput = 0;
  
      const keys = [
        {pubkey: GLOBAL,isSigner: false,isWritable: false},
        {pubkey: FEE_RECIPIENT,isSigner: false,isWritable: true},
        {pubkey: mint,isSigner: false,isWritable: false},
        {pubkey: new PublicKey(bonding_curve),isSigner: false,isWritable: true},
        {pubkey: new PublicKey(associated_bonding),isSigner: false,isWritable: true},
        {pubkey: tokenAccount,isSigner: false,isWritable: true},
        {pubkey: owner,isSigner: false,isWritable: true},
        {pubkey: SYSTEM_PROGRAM_ID,isSigner: false,isWritable: false},
        {pubkey: ASSOC_TOKEN_ACC_PROG,isSigner: false,isWritable: false},
        {pubkey: TOKEN_PROGRAM_ID,isSigner: false,isWritable: false},
        {pubkey: PUMP_FUN_ACCOUNT,isSigner: false,isWritable: false},
        {pubkey: PUMP_FUN_PROGRAM,isSigner: false,isWritable: false}
      ];
  
      let bufferDiscriminator = Buffer.alloc(8);
      bufferDiscriminator.writeBigUInt64LE(BigInt("12502976635542562355"));
      let bufferTokenOut = Buffer.alloc(8);
      bufferTokenOut.writeBigUInt64LE(BigInt(token_balance));
      let bufferMaxSolCost = Buffer.alloc(8);
      bufferMaxSolCost.writeBigUInt64LE(BigInt(minSolOutput));
  
      const data = Buffer.concat([bufferDiscriminator,bufferTokenOut,bufferMaxSolCost]);
  
      const sellInstruction = new TransactionInstruction({
          keys:keys, 
          programId: PUMP_FUN_PROGRAM, 
          data:data 
      });
    
      const closeAccountInstructions = createCloseAccountInstruction(tokenAccount, wallet_keypair.publicKey, wallet_keypair.publicKey);
  
      await Promise.all([
        txBuilder.add(computeUnitPriceInstruction),
        txBuilder.add(computeUnitLimitInstruction),
        txBuilder.add(sellInstruction),
        txBuilder.add(closeAccountInstructions)
      ]);   
  
      txBuilder.recentBlockhash = latest_BlockHash;
      txBuilder.feePayer = wallet_keypair.publicKey;
  
      txBuilder.sign(wallet_keypair);
  
      return txBuilder;
    }catch (e){
      console.log("getSellCloseTransaction",e);
      throw e;
    }
}

// Main Function
async function main(){
    console.log(new Date(),"CookedCoins Clean Wallet Coins and Close Associated Accounts");

    // REPLACE BU YOUR RPC NODE CONNECTION
    const solanaConnection = new Connection('https://api.mainnet-beta.solana.com');

    // REPLACE BY YOUR WALLET
    const main_wallet_decoded = bs58.decode("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
    const wallet_keypair = Keypair.fromSecretKey(main_wallet_decoded);

    console.log(new Date(),"CookedCoins Fetching Token Data in Wallet");    
    const token_data = await solanaConnection.getParsedTokenAccountsByOwner(wallet_keypair.publicKey, {programId: new PublicKey(TOKEN_PROGRAM_ID)});    

    console.log(new Date(),`CookedCoins Processing Token Array of ${token_data.value.length} elements`);  
    for (const element of token_data.value) {
        const associated_account = new PublicKey(element.pubkey);
        const token_mint = element.account.data.parsed.info.mint;
        const token_amount = element.account.data.parsed.info.tokenAmount.amount;           
    
        const [bondingCurve] = PublicKey.findProgramAddressSync([Buffer.from("bonding-curve"), new PublicKey(token_mint).toBytes()], PUMP_FUN_PROGRAM);
        const [associatedBondingCurve] = PublicKey.findProgramAddressSync([bondingCurve.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), new PublicKey(token_mint).toBytes()], ASSOC_TOKEN_ACC_PROG);
    
        const latest_BlockHash = await solanaConnection.getLatestBlockhash();
                
        const transaction = await getSellCloseTransaction(
            wallet_keypair, 
            latest_BlockHash.blockhash, 
            10000, 
            token_mint, 
            bondingCurve.toString(), 
            associatedBondingCurve.toString(), 
            token_amount, 
            associated_account);

        // USE WHAT YOU PREFER
        console.log(new Date(),`Sending Sell Transaction for Token Mint: ${token_mint} and Closing Account: ${associated_account} Token Amount = ${token_amount}`);
        // const transactionConfirmationResult = await sendAndConfirmTransaction(solanaConnection, transaction,[wallet_keypair], {skipPreflight:true});        
        // console.log(new Date(),`https://solscan.io/tx/${transactionConfirmationResult}`);        

        const transactionResult = await solanaConnection.sendTransaction(transaction,[wallet_keypair], {skipPreflight:true});        
        console.log(new Date(),`https://solscan.io/tx/${transactionResult}`);        

        // IF https://api.mainnet-beta.solana.com ADJUST DELAY TO REQUEST PER SECONDS ALLOWED
        await delay(1);
    }
}

main();