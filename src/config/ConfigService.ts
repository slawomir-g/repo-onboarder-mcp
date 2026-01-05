import { z } from "zod";
import * as dotenv from "dotenv";

// Load environment variables immediately when this module is imported
dotenv.config();

const configSchema = z.object({
  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is required"),
  GEMINI_MODEL: z.string().default("gemini-3-flash-preview"),
  DEBUG_MODE: z.boolean().default(false),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export type Config = z.infer<typeof configSchema>;

class ConfigService {
  private static instance: ConfigService;

  public readonly GEMINI_API_KEY: string;
  public readonly GEMINI_MODEL: string;
  public readonly DEBUG_MODE: boolean;
  public readonly NODE_ENV: "development" | "production" | "test";

  private constructor() {
    const rawConfig = {
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
      GEMINI_MODEL: process.env.GEMINI_MODEL,
      DEBUG_MODE: process.env.DEBUG === "true" || process.env.DEBUG_MODE === "true",
      NODE_ENV: process.env.NODE_ENV,
    };

    const result = configSchema.safeParse(rawConfig);

    if (!result.success) {
      console.error("❌ Invalid configuration:", result.error.format());
      throw new Error("Invalid configuration");
    }

    this.GEMINI_API_KEY = result.data.GEMINI_API_KEY;
    this.GEMINI_MODEL = result.data.GEMINI_MODEL;
    this.DEBUG_MODE = result.data.DEBUG_MODE;
    this.NODE_ENV = result.data.NODE_ENV;
  }

  public static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }
}

export const configService = ConfigService.getInstance();
