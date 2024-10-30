import { client } from "../index.js";
import { Contract, FullNodeClient } from "starknet";
import { DateTime } from "luxon"; // To manage timestamps for 24hr change
import { BigNumber } from "bignumber.js"; // To handle large numbers

const NODE_URL = process.env.STARKNET_NODE_URL || ""; // HTTPS ENDPOINT
const ORACLE_ADDRESS = "0x005e470ff654d834983a46b8f29dfa99963d5044b993cb7b9c92243a69dab38f";
const BASE_ADDRESS = "0x124aeb495b947201f5fac96fd1138e326ad86195b98df6dec9009158a533b49"; // LORDS
const QUOTE_ADDRESS = "0x53c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8"; // USDC
const BASE_DECIMALS = 18;
const QUOTE_DECIMALS = 6;
const PERIOD = 1;

const clientStarknet = new FullNodeClient(NODE_URL);

let balanceHistory: { timestamp: DateTime; price: number }[] = [];

// Function to fetch LORDS price from the Starknet Oracle
const getLordsPrice = async (): Promise<number | null> => {
  try {
    const oracleContract = await Contract.fromAddress(ORACLE_ADDRESS, clientStarknet);
    const result = await oracleContract.functions["get_price_x128_over_last"].call(
      BigNumber(BASE_ADDRESS, 16).toNumber(),
      BigNumber(QUOTE_ADDRESS, 16).toNumber(),
      PERIOD
    );

    const rawPriceX128 = result[0];
    const adjustedRawPrice = new BigNumber(rawPriceX128)
      .multipliedBy(10 ** (BASE_DECIMALS - QUOTE_DECIMALS));
    const scaledPrice = adjustedRawPrice.dividedBy(new BigNumber(2).pow(128)).toNumber();

    return scaledPrice;
  } catch (error) {
    console.error("Error querying price:", error);
    return null;
  }
};

// Calculate 24-hour percentage change
const calculate24hrChange = (): { absoluteChange: number; percentChange: string } => {
  const now = DateTime.now();
  balanceHistory = balanceHistory.filter(entry => entry.timestamp > now.minus({ hours: 24 }));

  if (balanceHistory.length < 2) return { absoluteChange: 0, percentChange: "0.00%" };

  const price24hrsAgo = balanceHistory[0].price;
  const currentPrice = balanceHistory[balanceHistory.length - 1].price;
  const absoluteChange = currentPrice - price24hrsAgo;
  const percentChange = ((absoluteChange / price24hrsAgo) * 100).toFixed(2);

  return { absoluteChange, percentChange: `${absoluteChange >= 0 ? "+" : ""}${percentChange}%` };
};

// Main getAlive function
export const getAlive = async () => {
  try {
    const price = await getLordsPrice();
    if (price !== null) {
      balanceHistory.push({ timestamp: DateTime.now(), price });

      const { percentChange } = calculate24hrChange();
      const activityMessage = `LORDS: $${price.toFixed(3)} | ${percentChange}`;

      client.user?.setActivity(activityMessage, {
        state: activityMessage,
        type: 4, // Adjust the type if necessary
      });
    } else {
      console.error("Price is undefined or not available.");
    }
  } catch (error) {
    console.error("Fetching error:", error);
  }
};
