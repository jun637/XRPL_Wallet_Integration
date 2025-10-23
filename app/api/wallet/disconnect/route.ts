import { NextResponse } from 'next/server';

import {
  getOrCreateWallet,
  isConnected,
  setConnectionState,
} from '@/lib/server/wallet-store';
import { promptYesNo } from '@/lib/server/prompt';

export async function POST() {
  if (!isConnected()) {
    return NextResponse.json(
      { message: 'Wallet is not connected.' },
      { status: 200 }
    );
  }

  const wallet = getOrCreateWallet();
  const approved = await promptYesNo('Disconnect wallet session?');

  if (!approved) {
    return NextResponse.json(
      { message: 'Disconnect cancelled.' },
      { status: 403 }
    );
  }

  setConnectionState(false);
  console.log(`Wallet disconnected for ${wallet.classicAddress}.`);

  return NextResponse.json(
    { message: 'Wallet disconnected.' },
    { status: 200 }
  );
}
