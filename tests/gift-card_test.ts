import {
    Clarinet,
    Tx,
    Chain,
    Account,
    types
} from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
    name: "Can create a new gift card",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const wallet1 = accounts.get('wallet_1')!;
        const amount = 1000;
        
        let block = chain.mineBlock([
            Tx.contractCall('gift-card', 'create-gift-card', [
                types.uint(amount),
                types.none(),
                types.utf8("Happy Birthday!")
            ], wallet1.address)
        ]);
        
        block.receipts[0].result.expectOk().expectUint(0);
        
        let cardBlock = chain.mineBlock([
            Tx.contractCall('gift-card', 'get-gift-card', [
                types.uint(0)
            ], wallet1.address)
        ]);
        
        const card = cardBlock.receipts[0].result.expectOk().expectSome();
        assertEquals(card['amount'], types.uint(amount));
        assertEquals(card['claimed'], false);
    },
});

Clarinet.test({
    name: "Can claim a gift card",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const wallet1 = accounts.get('wallet_1')!;
        const wallet2 = accounts.get('wallet_2')!;
        const amount = 1000;
        
        let block = chain.mineBlock([
            Tx.contractCall('gift-card', 'create-gift-card', [
                types.uint(amount),
                types.some(wallet2.address),
                types.utf8("Happy Birthday!")
            ], wallet1.address),
            
            Tx.contractCall('gift-card', 'claim-gift-card', [
                types.uint(0)
            ], wallet2.address)
        ]);
        
        block.receipts[1].result.expectOk().expectBool(true);
        
        let cardBlock = chain.mineBlock([
            Tx.contractCall('gift-card', 'get-gift-card', [
                types.uint(0)
            ], wallet1.address)
        ]);
        
        const card = cardBlock.receipts[0].result.expectOk().expectSome();
        assertEquals(card['claimed'], true);
    },
});
