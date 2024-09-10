import { getSdk } from "./generated/graphql.js";
import { GraphQLClient } from "graphql-request";
import { TwitterApi, TwitterApiTokens } from "twitter-api-v2";

export const GRAPHQL_ENDPOINT =
  "https://ls-indexer-sepolia.provable.games/graphql";

export const POLL_INTERVAL = 20000;

export const sdk = getSdk(new GraphQLClient(GRAPHQL_ENDPOINT));

export const twitterClientV1 = new TwitterApi({
  appKey: process.env.TWITTER_APP_KEY,
  appSecret: process.env.TWITTER_APP_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
} as TwitterApiTokens);
