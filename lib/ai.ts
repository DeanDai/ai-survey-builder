import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";

export function getModel() {
  const provider = process.env.AI_PROVIDER ?? "google";

  switch (provider) {
    case "openai":
      return openai("gpt-4o-mini");

    case "google":
      return google("gemini-2.5-flash");

    default:
      return google("gemini-2.5-flash");
  }
}