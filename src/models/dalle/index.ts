import Anthropic from "@anthropic-ai/sdk";
// import OpenAI from "openai";
import * as fal from "@fal-ai/serverless-client";

import Replicate from "replicate";
export const replicate = new Replicate();

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

fal.config({
  credentials: process.env.FAL_KEY,
});

// export const openai = new OpenAI({ apiKey: process.env.OPEN_AI_API_KEY });

export async function generateImage(prompt: string, retries = 1) {
  return new Promise((resolve, reject) => {
    const attemptGeneration = async (retryCount: number) => {
      try {
        const image = await fal.subscribe("fal-ai/flux-pro", {
          input: {
            prompt:
              "turn this into a dark souls themed pixel scene, make the beasts scary, hd [adjusted for content policy]: " +
              prompt,
          },
          logs: true,
          onQueueUpdate: (update) => {
            if (update.status === "IN_PROGRESS") {
            }
          },
        });
        console.log(image);
        resolve((image as any)?.images?.[0]?.url); // Resolve the promise with the image data, using type assertion and optional chaining.
      } catch (error: any) {
        console.error(error);
        if (error.message.includes("Rate limit exceeded") && retryCount > 0) {
          console.log(`Rate limit hit. Retrying in 60 seconds...`);
          setTimeout(() => attemptGeneration(retryCount - 1), 60000); // Retry after 60 seconds
        } else {
          reject(error); // Reject the promise if it's not a rate limit error or retries are exhausted.
        }
      }
    };

    attemptGeneration(retries);
  });
}

export async function getText(system: string, prompt: string) {
  const response = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20240620",
    max_tokens: 1000,
    temperature: 0,
    system: system,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: prompt,
          },
        ],
      },
    ],
  });

  return response.content[0].type === "text"
    ? response.content[0].text
    : "Non-text content";
}
