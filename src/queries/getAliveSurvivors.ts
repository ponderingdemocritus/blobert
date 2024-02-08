import { client } from "../index.js";

const activityStrings = [
  "{price} USD - Lords",
  "Don't ask me about the price",
  "Fine, I'll tell you the price: {price} USD",
];

// Initialize a counter outside the getAlive function to keep track of the current activity index
let currentActivityIndex = 0;

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
      // Format the current activity string with the price
      const activityString = activityStrings[currentActivityIndex].replace(
        "{price}",
        price
      );

      client.user?.setActivity(activityString, {
        state: activityString,
        type: 4, // Assuming type 4 is correct for your use case; adjust as necessary
      });

      // Update the currentActivityIndex to cycle through the strings
      currentActivityIndex =
        (currentActivityIndex + 1) % activityStrings.length;
    } else {
      console.error("Price is undefined or not available.");
    }
  } catch (error) {
    console.error("Fetching error:", error);
    throw error;
  }
};
