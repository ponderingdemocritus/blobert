import { client } from "../index.js";

export const getAlive = async () => {
  try {
    const getLordsPrice = async () => {
      const apiKey = process.env.NEXT_PUBLIC_ETHPLORER_APIKEY;
      const url = `https://api.ethplorer.io/getTokenInfo/0x686f2404e77ab0d9070a46cdfb0b7fecdd2318b0?apiKey=${apiKey}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      return data.price?.rate.toFixed(2);
    };

    const price = await getLordsPrice();
    if (price) {
      client.user?.setActivity(`${price} USD`, {
        state: `${price}`,
        type: 4,
      });
    } else {
      console.error("Price is undefined or not available.");
    }
  } catch (error) {
    console.error("Fetching error:", error);
    throw error;
  }
};
