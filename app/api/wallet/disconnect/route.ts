import { NextResponse } from 'next/server';

import {
  getOrCreateWallet,
  isConnected,
  setConnectionState,
} from '@/lib/server/wallet-store';

interface DisconnectRequestBody {
  approve?: boolean;
}

export async function POST(request: Request) {
  if (!isConnected()) {
    return NextResponse.json(
      { message: 'Wallet is not connected.' },
      { status: 200 }
    );
  }

  let approve: boolean | undefined;
  try {
    const body = (await request.json()) as DisconnectRequestBody;
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
    return NextResponse.json(
      { message: 'Disconnect cancelled.' },
      { status: 403 }
    );
  }

  const wallet = getOrCreateWallet();
  setConnectionState(false);
  console.log(`Wallet disconnected for ${wallet.classicAddress}.`);

  return NextResponse.json(
    { message: 'Wallet disconnected.' },
    { status: 200 }
  );
}
