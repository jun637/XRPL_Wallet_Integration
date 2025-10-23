import { NextResponse } from 'next/server';

import {
  getOrCreateWallet,
  isConnected,
  setConnectionState,
  getWalletNetwork,
} from '@/lib/server/wallet-store';
import { promptYesNo } from '@/lib/server/prompt';

export async function POST() {
  const wallet = getOrCreateWallet();

  if (isConnected()) {
    return NextResponse.json(
      {
        message: 'Wallet already connected.',
        address: wallet.classicAddress,
        network: getWalletNetwork(),
      },
      { status: 200 }
    );
  }

  const approved = await promptYesNo('Approve wallet connection?');
  if (!approved) {
    setConnectionState(false);
    return NextResponse.json(
      { message: 'Connection declined.' },
      { status: 403 }
    );
  }

  setConnectionState(true);
  console.log('Wallet connected to web application.');

  return NextResponse.json(
    {
      message: 'Connection approved.',
      address: wallet.classicAddress,
      publicKey: wallet.publicKey,
      network: getWalletNetwork(),
    },
    { status: 200 }
  );
}
