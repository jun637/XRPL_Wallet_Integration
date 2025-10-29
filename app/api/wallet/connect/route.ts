import { NextResponse } from 'next/server';

import {
  getOrCreateWallet,
  isConnected,
  setConnectionState,
  getWalletNetwork,
} from '@/lib/server/wallet-store';

interface ConnectRequestBody {
  approve?: boolean;
}

export async function POST(request: Request) {
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

  let approve: boolean | undefined;
  try {
    const body = (await request.json()) as ConnectRequestBody;
    approve = body.approve;
  } catch {
    approve = undefined;
  }

  if (typeof approve !== 'boolean') {
    return NextResponse.json(
      { message: 'Approval decision required.' },
      { status: 400 }
    );
  }

  if (!approve) {
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
