import { sdk, twitterClientV1 } from "../config.js";
import { client } from "../index.js";
import { generateImage, getText } from "../models/dalle/index.js";

import { getRandomStatement, summary } from "../models/statements/index.js";
import fs from "fs";
import fetch from "node-fetch";
import { MongoClient, Collection } from "mongodb";
import { Adventurer } from "../generated/graphql.js";

interface DiscordChannel {
  isTextBased: () => boolean;
  send: (message: any) => Promise<void>;
}

const MONGO_URI = process.env.MONGO_URI!;
const DB_NAME = "adventurers_db";
const COLLECTION_NAME = "processed_adventurers";

let mongoClient: MongoClient | null = null;
let adventurersCollection: Collection | null = null;

async function connectToMongo() {
  if (!mongoClient) {
    try {
      mongoClient = new MongoClient(MONGO_URI, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      await mongoClient.connect();
      console.log("Connected to MongoDB");
      adventurersCollection = mongoClient
        .db(DB_NAME)
        .collection(COLLECTION_NAME);
    } catch (error) {
      console.error("Failed to connect to MongoDB:", error);
      throw error;
    }
  }
  return adventurersCollection;
}

async function isAdventurerProcessed(id: number): Promise<boolean> {
  const collection = await connectToMongo();
  const result = await collection?.findOne({ id });
  console.log(
    `Checking adventurer ${id}: ${result ? "processed" : "not processed"}`
  );
  return !!result;
}

async function markAdventurerAsProcessed(id: number): Promise<void> {
  const collection = await connectToMongo();
  await collection?.updateOne(
    { id },
    { $set: { processedAt: new Date() } },
    { upsert: true }
  );
}

async function getDiscordChannel(): Promise<DiscordChannel | null> {
  const channel = await client.channels.fetch(
    process.env.DISCORD_SURVIVOR_CHANNEL || ""
  );
  if (!channel?.isTextBased()) {
    console.error("Invalid channel or not text-based");
    return null;
  }
  return channel as any;
}

let isProcessing = false;

export async function getDeadSurvivors(): Promise<void> {
  if (isProcessing) {
    console.log("Already processing adventurers. Skipping this poll.");
    return;
  }

  isProcessing = true;

  try {
    const { data } = await sdk.getDeadSurvivors();
    console.log(`Fetched ${data.adventurers.length} adventurers`);

    const newAdventurers = await filterNewAdventurers(data.adventurers);
    console.log(`Found ${newAdventurers.length} new adventurers`);

    if (newAdventurers.length === 0) {
      console.log("No new adventurers found at this time.");
      return;
    }

    const channel = await getDiscordChannel();
    if (!channel) return;

    for (const adventurer of newAdventurers) {
      await processAdventurer(adventurer, channel);
      await markAdventurerAsProcessed(adventurer.id);
    }
  } catch (error) {
    console.error("Error in getDeadSurvivors:", error);
  } finally {
    isProcessing = false;
  }
}

async function filterNewAdventurers(
  adventurers: Adventurer[]
): Promise<Adventurer[]> {
  const newAdventurers = [];
  for (const adventurer of adventurers) {
    try {
      if (!(await isAdventurerProcessed(adventurer.id))) {
        newAdventurers.push(adventurer);
      }
    } catch (error) {
      console.error(`Error checking adventurer ${adventurer.id}:`, error);
    }
  }
  return newAdventurers;
}

async function processAdventurer(adventurer: any, channel: any) {
  console.log("New adventurer:", adventurer);

  const death = await getLastActionBeforeDeath(adventurer.id);
  const prediction = await getText(getRandomStatement(), JSON.stringify(death));
  const image = await generateImage(prediction);

  await downloadImage(image as string, `${adventurer.id}.png`);

  await sendDiscordMessage(channel, adventurer, prediction, image as string);

  await tweet(await getText(summary, prediction), `${adventurer.id}.png`);
}

async function sendDiscordMessage(
  channel: any,
  adventurer: any,
  prediction: string,
  imageUrl: string
) {
  await channel.send({
    embeds: [
      {
        color: 0x00ff3c,
        title: `${adventurer.name} ${
          adventurer.health === 0 ? "has died" : "has entered the arena"
        }`,
        url: "https://survivor.realms.world/",
        description: prediction,
        timestamp: new Date().toISOString(),
        image: { url: imageUrl },
        footer: { text: "dedicated to the fallen" },
      },
    ],
  });
}

export const getLastActionBeforeDeath = async (id: number) => {
  try {
    const { data } = await sdk.getLastActionsBeforeDeath({ id });

    return data;
  } catch (error) {
    console.error("Fetching error:", error);
    throw error;
  }
};

const tweet = async (text: any, imagePath: string) => {
  await twitterClientV1.v1.uploadMedia(imagePath).then((mediaId) => {
    twitterClientV1.v2.tweet(text + "https://lootsurvivor.io", {
      media: {
        media_ids: [mediaId],
      },
    });
  });
};

const downloadImage = async (url: string, path: string) => {
  const response = await fetch(url);
  const buffer = await response.buffer();
  fs.writeFileSync(path, buffer);
};

process.on("SIGINT", async () => {
  if (mongoClient) {
    await mongoClient.close();
    console.log("Closed MongoDB connection due to app shutdown");
  }
  process.exit(0);
});
