import { http, createConfig } from "wagmi";
import { defineChain } from "viem";

// Polygon Amoy Testnet chain definition
export const polygonAmoy = defineChain({
  id: 80002,
  name: "Polygon Amoy",
  nativeCurrency: {
    name: "MATIC",
    symbol: "MATIC",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [
        process.env.NEXT_PUBLIC_POLYGON_RPC_URL ||
          "https://rpc-amoy.polygon.technology",
      ],
    },
  },
  blockExplorers: {
    default: {
      name: "PolygonScan Amoy",
      url: "https://amoy.polygonscan.com",
    },
  },
  testnet: true,
});

export const config = createConfig({
  chains: [polygonAmoy],
  transports: {
    [polygonAmoy.id]: http(),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
