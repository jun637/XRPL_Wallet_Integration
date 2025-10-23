type SupportedNetwork = 'mainnet' | 'testnet' | 'devnet';

const NETWORK_MAP: Record<
  SupportedNetwork,
  {
    label: string;
    rpcEndpoint: string;
  }
> = {
  mainnet: {
    label: 'XRPL Mainnet',
    rpcEndpoint: 'wss://xrplcluster.com',
  },
  testnet: {
    label: 'XRPL Testnet',
    rpcEndpoint: 'wss://s.altnet.rippletest.net:51233',
  },
  devnet: {
    label: 'XRPL Devnet',
    rpcEndpoint: 'wss://s.devnet.rippletest.net:51233',
  },
};

export function getConfiguredNetwork(): {
  id: SupportedNetwork;
  label: string;
  rpcEndpoint: string;
} {
  const raw = process.env.XRPL_NETWORK?.toLowerCase().trim() as
    | SupportedNetwork
    | undefined;

  if (raw && raw in NETWORK_MAP) {
    return { id: raw, ...NETWORK_MAP[raw] };
  }

  return { id: 'testnet', ...NETWORK_MAP.testnet };
}
