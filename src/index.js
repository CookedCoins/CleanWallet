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
Object.defineProperty(exports, "__esModule", { value: true });
const axios = require("axios");
const http = require('http');
const https = require('https');
const httpAgent = new http.Agent({ keepAlive: true });
const httpsAgent = new https.Agent({ keepAlive: true });
const rpc_instance = axios.create({
    httpAgent: httpAgent,
    httpsAgent: httpsAgent,
});
function GetTokenData() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const payload = JSON.stringify({
                "jsonrpc": "2.0",
                "id": 1,
                "method": "getTokenAccountBalance",
                "params": ["getTokenAccountBalance"]
            });
            const config = { headers: { 'Content-Type': 'application/json' } };
            const response = yield rpc_instance.post('https://mainnet-beta.solana.com', payload, config);
            return response === null || response === void 0 ? void 0 : response.data;
        }
        catch (e) {
            console.log(e);
        }
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(new Date(), "CookedCoins Clean Wallet Coins and Close Associated Accounts");
        const token_data = yield GetTokenData();
    });
}
main();
