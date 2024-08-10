import { getSdk } from "./generated/graphql.js";
import { GraphQLClient } from "graphql-request";

export const GRAPHQL_ENDPOINT =
  "https://ls-indexer-sepolia.provable.games/graphql";

export const POLL_INTERVAL = 20000;

export const sdk = getSdk(new GraphQLClient(GRAPHQL_ENDPOINT));
