import { Wallet } from 'xrpl';

import { getConfiguredNetwork } from '@/lib/server/network';

let wallet: Wallet | null = null;
let connected = false;
const network = getConfiguredNetwork();

function logWalletDetails(instance: Wallet) {
  console.log('--- Generated XRPL Wallet ----------------------------------');
  console.log(`Network        : ${network.label} (${network.id})`);
  console.log(`Classic Address: ${instance.classicAddress}`);
  console.log(`Public Key     : ${instance.publicKey}`);
  console.log(`Seed           : ${instance.seed}`);
  console.log('-------------------------------------------------------------');
}

export function getOrCreateWallet() {
  if (!wallet) {
    wallet = Wallet.generate();
    logWalletDetails(wallet);
  }
  return wallet;
}

export function setConnectionState(state: boolean) {
  connected = state;
}

export function isConnected() {
  return connected;
}

export function resetWallet() {
  wallet = null;
  connected = false;
}

export function getWalletNetwork() {
  return network;
}
