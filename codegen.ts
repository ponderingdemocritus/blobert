import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "https://ls-indexer-sepolia.provable.games/graphql",
  documents: "src/**/*.graphql",
  generates: {
    "src/generated/graphql.ts": {
      plugins: [
        "typescript",
        "typescript-operations",
        "typescript-graphql-request",
      ],
      config: {
        rawRequest: true,
      },
    },
  },
};
export default config;
