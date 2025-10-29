'use client';

import { FormEvent, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface WalletDetails {
  address: string;
  publicKey?: string;
  network: {
    id: string;
    label: string;
    rpcEndpoint: string;
  };
}

interface PaymentResponse {
  message: string;
  hash?: string;
  signedTransaction?: string;
  prepared?: {
    Amount?: string;
    Destination?: string;
    Fee?: string;
    Sequence?: number;
    DestinationTag?: number;
  };
  result?: {
    engine_result?: string;
    engine_result_message?: string;
  };
}

interface PendingPayment {
  destination: string;
  amount: string;
  destinationTag?: string;
}

interface ConfirmDialogState {
  type: 'connect' | 'disconnect';
  title: string;
  description?: string;
}

export default function Page() {
  const [wallet, setWallet] = useState<WalletDetails | null>(null);
  const [connectMessage, setConnectMessage] = useState<string>();
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [confirmation, setConfirmation] = useState<ConfirmDialogState | null>(null);

  const [destination, setDestination] = useState('');
  const [amount, setAmount] = useState('');
  const [destinationTag, setDestinationTag] = useState('');
  const [paymentState, setPaymentState] = useState<PaymentResponse>();
  const [preparingPayment, setPreparingPayment] = useState(false);
  const [signingPayment, setSigningPayment] = useState(false);
  const [pendingPayment, setPendingPayment] = useState<PendingPayment | null>(null);

  const submitConnect = async (approve: boolean) => {
    setConnecting(true);
    setConnectMessage(undefined);

    try {
      const response = await fetch('/api/wallet/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ approve }),
      });
      const data = (await response.json()) as WalletDetails & {
        message: string;
      };

      if (response.ok) {
        setWallet({
          address: data.address,
          publicKey: data.publicKey,
          network: data.network,
        });

        if (data.message === 'Wallet already connected.') {
          setConnectMessage('이미 지갑이 연결되어 있습니다.');
        }
      } else if (response.status === 403) {
        setConnectMessage('터미널에서 연결을 거절했습니다.');
      } else {
        setConnectMessage('지갑 연결 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error(error);
      setConnectMessage('지갑 연결 중 오류가 발생했습니다.');
    } finally {
      setConnecting(false);
    }
  };

  const submitDisconnect = async (approve: boolean) => {
    setDisconnecting(true);
    setConnectMessage(undefined);

    try {
      const response = await fetch('/api/wallet/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ approve }),
      });
      const data = (await response.json()) as { message?: string };

      if (response.ok) {
        setWallet(null);
        setPaymentState(undefined);
        setPendingPayment(null);

        if (data.message === 'Wallet is not connected.') {
          setConnectMessage('이미 지갑 연결이 해제된 상태입니다.');
        } else {
          setConnectMessage('지갑 연결을 해제했습니다.');
        }
      } else if (response.status === 403) {
        setConnectMessage('터미널에서 연결 해제를 취소했습니다.');
      } else {
        setConnectMessage('지갑 연결 해제 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error(error);
      setConnectMessage('지갑 연결 해제 중 오류가 발생했습니다.');
    } finally {
      setDisconnecting(false);
    }
  };

  const handleConnectClick = () => {
    if (connecting) {
      return;
    }

    setConfirmation({
      type: 'connect',
      title: 'Approve connection?',
      description: 'Allow this web application to access the XRPL wallet.',
    });
  };

  const handleDisconnectClick = () => {
    if (disconnecting) {
      return;
    }

    setConfirmation({
      type: 'disconnect',
      title: 'Disconnect wallet session?',
      description: 'End the current XRPL wallet session for this web application.',
    });
  };

  const handleDialogDecision = (approve: boolean) => {
    const current = confirmation;
    setConfirmation(null);

    if (!current) {
      return;
    }

    if (current.type === 'connect') {
      void submitConnect(approve);
      return;
    }

    void submitDisconnect(approve);
  };

  const handleSubmitPayment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!wallet) {
      setPaymentState({
        message: '지갑을 먼저 연결한 뒤 결제 요청을 준비할 수 있습니다.',
      });
      return;
    }

    const trimmedDestination = destination.trim();
    const trimmedAmount = amount.trim();
    const trimmedDestinationTag = destinationTag.trim();

    if (!trimmedDestination || !trimmedAmount || Number(trimmedAmount) <= 0) {
      setPaymentState({
        message: '결제 대상 주소와 금액을 올바르게 입력해 주세요.',
      });
      return;
    }

    if (trimmedDestinationTag) {
      const parsedTag = Number(trimmedDestinationTag);
      if (!Number.isInteger(parsedTag) || parsedTag < 0 || parsedTag > 0xffffffff) {
        setPaymentState({
          message: 'Destination Tag는 0 이상 4294967295 이하의 정수로 입력해주세요.',
        });
        return;
      }
    }

    setPreparingPayment(true);
    setPendingPayment({
      destination: trimmedDestination,
      amount: trimmedAmount,
      destinationTag: trimmedDestinationTag || undefined,
    });
    setPaymentState({
      message: '트랜잭션 요청이 준비되었습니다. Transaction Sign 버튼으로 서명하세요.',
    });
    setPreparingPayment(false);
  };

  const handleSignPayment = async () => {
    if (!pendingPayment) {
      return;
    }

    setSigningPayment(true);

    try {
      const response = await fetch('/api/wallet/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          destination: pendingPayment.destination,
          amount: pendingPayment.amount,
          destinationTag:
            pendingPayment.destinationTag !== undefined
              ? Number(pendingPayment.destinationTag)
              : undefined,
        }),
      });

      const data = (await response.json()) as PaymentResponse;

      if (response.ok) {
        setPaymentState(data);
        setPendingPayment(null);
        setDestination('');
        setAmount('');
        setDestinationTag('');
      } else {
        setPaymentState({
          message: data.message || '결제 요청 중 오류가 발생했습니다.',
        });
      }
    } catch (error) {
      console.error(error);
      setPaymentState({
        message: '결제 요청 중 오류가 발생했습니다.',
      });
    } finally {
      setSigningPayment(false);
    }
  };

  const isReadyToSubmit = Boolean(
    wallet && destination.trim().length > 0 && Number(amount) > 0
  );

  return (
    <main className="mx-auto flex max-w-3xl flex-col space-y-12 px-4 py-16 text-white">
      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-white translate-y-[-32px]">
          XRPL Wallet Integration example
        </h1>
        <p className="text-sm text-white">
          백엔드에서 생성한 XRPL 지갑을 웹앱에 연결 후 사용하는
          흐름을 보여주는 예제입니다.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className={cn('text-2xl font-semibold', !wallet && 'text-[#b497ff]')}>
          1. 지갑 연결
        </h2>
        <p className="text-sm text-white">
          Connect Wallet 버튼을 눌러 백엔드 지갑과 연결 요청을 전송하세요.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          {wallet ? (
            <Button onClick={handleDisconnectClick} disabled={disconnecting}>
              {disconnecting ? 'Disconnecting...' : 'Disconnect Wallet'}
            </Button>
          ) : (
            <Button onClick={handleConnectClick} disabled={connecting}>
              {connecting ? '연결 요청 중...' : 'Connect Wallet'}
            </Button>
          )}
          {connectMessage && <span className="text-sm text-white">{connectMessage}</span>}
        </div>

        {wallet && (
          <>
            <ul className="mt-6 space-y-2 text-sm font-mono leading-relaxed text-white">
              <li>
                Network : {wallet.network.label} ({wallet.network.id})
              </li>
              <li>RPC Endpoint : {wallet.network.rpcEndpoint}</li>
              <li>Classic Address : {wallet.address}</li>
              {wallet.publicKey && <li>Public Key : {wallet.publicKey}</li>}
            </ul>
            <p className="mt-4 text-sm text-white">
              트랜잭션 전송 전{' '}
              <a
                href="https://test.bithomp.com/en/faucet"
                target="_blank"
                rel="noreferrer"
                className="underline decoration-dotted underline-offset-4"
              >
                https://test.bithomp.com/en/faucet
              </a>
              에 접속해 테스트넷 XRP를 충전하세요.
            </p>
          </>
        )}
      </section>

      <section className="space-y-4">
        <h2
          className={cn(
            'text-2xl font-semibold',
            wallet && !paymentState && 'text-[#b497ff]'
          )}
        >
          2. Send Request
        </h2>
        <p className="text-sm text-white">
          결제 대상 주소와 금액을 입력한 뒤 Submit 버튼을 누르면 Transaction Sign 버튼이
          나타납니다. 버튼을 눌러 서명과 제출을 진행하세요.
        </p>

        <form className="mt-4 space-y-4" onSubmit={handleSubmitPayment}>
          <div className="space-y-1">
            <label className="text-sm font-medium text-white">
              Destination (클래식 주소)
            </label>
            <Input
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
              placeholder="r..."
              disabled={!wallet || preparingPayment || signingPayment}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-white">Amount (drops)</label>
            <Input
              type="number"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="1000000"
              disabled={!wallet || preparingPayment || signingPayment}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-white">
              Destination Tag (선택 사항)
            </label>
            <Input
              type="number"
              value={destinationTag}
              onChange={(event) => setDestinationTag(event.target.value)}
              placeholder="123456"
              disabled={!wallet || preparingPayment || signingPayment}
            />
            <p className="text-xs text-zinc-400">
              거래소(CEX)로 전송할 때 Destination Tag를 입력하세요. 다른 지갑으로 보낼 때는
              비워두셔도 됩니다.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="submit"
              disabled={!isReadyToSubmit || preparingPayment || signingPayment}
            >
              {preparingPayment ? '요청 준비 중...' : 'Submit'}
            </Button>
            {pendingPayment && (
              <Button
                type="button"
                onClick={handleSignPayment}
                disabled={signingPayment}
                className="bg-[#b497ff] text-black hover:bg-[#c7aaff]"
              >
                {signingPayment ? 'Signing...' : 'Transaction Sign'}
              </Button>
            )}
          </div>
        </form>

        {paymentState && (
          <div className="space-y-3 text-sm text-zinc-300">
            <p>{paymentState.message}</p>
            {paymentState.prepared && (
              <div className="space-y-1 font-mono text-xs">
                {paymentState.prepared.Amount && (
                  <p>{`Amount: ${paymentState.prepared.Amount}`}</p>
                )}
                {paymentState.prepared.Destination && (
                  <p>{`Destination: ${paymentState.prepared.Destination}`}</p>
                )}
                {paymentState.prepared.Fee && (
                  <p>{`Fee: ${paymentState.prepared.Fee}`}</p>
                )}
                {typeof paymentState.prepared.Sequence === 'number' && (
                  <p>{`Sequence: ${paymentState.prepared.Sequence}`}</p>
                )}
                {typeof paymentState.prepared.DestinationTag === 'number' && (
                  <p>{`Destination Tag: ${paymentState.prepared.DestinationTag}`}</p>
                )}
              </div>
            )}
            {paymentState.hash && (
              <p className="font-mono text-xs text-zinc-400">Hash: {paymentState.hash}</p>
            )}
            {paymentState.result?.engine_result && (
              <p className="font-mono text-xs text-zinc-400">
                Result: {paymentState.result.engine_result}
                {paymentState.result.engine_result_message
                  ? ` (${paymentState.result.engine_result_message})`
                  : ''}
              </p>
            )}
            {paymentState.signedTransaction && (
              <details className="rounded-md border border-white/20 p-3">
                <summary className="cursor-pointer text-sm font-medium">
                  Signed Transaction Blob
                </summary>
                <p className="mt-2 font-mono text-xs leading-relaxed text-zinc-300 break-all">
                  {paymentState.signedTransaction}
                </p>
              </details>
            )}
          </div>
        )}
      </section>
      {confirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-sm rounded-lg bg-[#1f1b35] p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-white">{confirmation.title}</h3>
            {confirmation.description && (
              <p className="mt-2 text-sm text-zinc-300">{confirmation.description}</p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => handleDialogDecision(false)}
                disabled={connecting || disconnecting}
              >
                No
              </Button>
              <Button
                onClick={() => handleDialogDecision(true)}
                disabled={connecting || disconnecting}
              >
                Yes
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
