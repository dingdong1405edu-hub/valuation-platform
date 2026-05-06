import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  base: { service: "vp" },
  redact: {
    paths: [
      "anthropicApiKey",
      "ANTHROPIC_API_KEY",
      "TAVILY_API_KEY",
      "MISTRAL_API_KEY",
      "*.apiKey",
    ],
    censor: "[REDACTED]",
  },
});
