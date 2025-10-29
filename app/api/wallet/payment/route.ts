import { NextResponse } from 'next/server';
import { Client, type Payment as PaymentTx } from 'xrpl';

import { getOrCreateWallet, getWalletNetwork, isConnected } from '@/lib/server/wallet-store';

interface PaymentRequestBody {
  amount?: string;
  destination?: string;
  destinationTag?: number | string;
}

export async function POST(request: Request) {
  const body = (await request.json()) as PaymentRequestBody;
  const amount = body.amount?.trim();
  const destination = body.destination?.trim();
  const rawDestinationTag = body.destinationTag;
  let destinationTag: number | undefined;

  if (rawDestinationTag !== undefined && rawDestinationTag !== null && rawDestinationTag !== '') {
    const parsed = Number(rawDestinationTag);
    if (!Number.isInteger(parsed) || parsed < 0 || parsed > 0xffffffff) {
      return NextResponse.json(
        { message: 'Destination tag must be an integer between 0 and 4294967295.' },
        { status: 400 }
      );
    }
    destinationTag = parsed;
  }

  if (!amount || !destination) {
    return NextResponse.json(
      { message: 'Amount and destination are required.' },
      { status: 400 }
    );
  }

  if (!isConnected()) {
    return NextResponse.json(
      { message: 'Connect the wallet before submitting a payment.' },
      { status: 409 }
    );
  }

  const wallet = getOrCreateWallet();
  const network = getWalletNetwork();

  const client = new Client(network.rpcEndpoint);
  let prepared: PaymentTx | null = null;
  let signed: ReturnType<typeof wallet.sign> | null = null;
  let result: Awaited<ReturnType<typeof client.submitAndWait>> | null = null;

  try {
    await client.connect();

    const tx: PaymentTx = {
      TransactionType: 'Payment',
      Account: wallet.classicAddress,
      Destination: destination,
      Amount: amount,
      ...(destinationTag !== undefined ? { DestinationTag: destinationTag } : {}),
    };

    prepared = (await client.autofill(tx)) as PaymentTx;
    signed = wallet.sign(prepared);
    result = await client.submitAndWait(signed.tx_blob);
  } catch (error) {
    console.error('Payment submission failed:', error);
    return NextResponse.json(
      { message: 'Failed to submit payment to XRPL testnet.' },
      { status: 502 }
    );
  } finally {
    try {
      await client.disconnect();
    } catch (disconnectError) {
      console.warn('Failed to disconnect XRPL client:', disconnectError);
    }
  }

  console.log('Payment submitted:', result);

  if (!prepared || !signed || !result) {
    return NextResponse.json(
      { message: 'Payment signing failed.' },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      message: 'Payment submitted to XRPL testnet.',
      prepared,
      signedTransaction: signed?.tx_blob,
      hash: signed?.hash,
      result,
    },
    { status: 200 }
  );
}
