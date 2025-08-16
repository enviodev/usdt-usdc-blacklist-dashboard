import { S, experimental_createEffect } from "envio";

export const getERC20Balance = experimental_createEffect(
    {
        name: "getERC20Balance",
        input: {
            tokenAddress: S.string,
            userAddress: S.string,
        },
        output: S.string,
        cache: true,
    },
    async ({ input }) => {
        const { createPublicClient, http } = await import("viem");
        const { mainnet } = await import("viem/chains");

        const client = createPublicClient({
            chain: mainnet,
            transport: http((process.env.RPC_URL || undefined), { batch: true }),
        });

        const erc20Abi = [
            {
                name: "balanceOf",
                type: "function",
                stateMutability: "view",
                inputs: [{ name: "account", type: "address" }],
                outputs: [{ name: "balance", type: "uint256" }],
            },
        ] as const;

        const balance = await client.readContract({
            address: input.tokenAddress as any,
            abi: erc20Abi,
            functionName: "balanceOf",
            args: [input.userAddress as any],
        });

        return balance.toString();
    }
);


