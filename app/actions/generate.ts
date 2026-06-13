"use server";

import { generateText, NoObjectGeneratedError, Output } from "ai";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { getModel } from "@/lib/ai";
import crypto from "crypto";
import { headers } from "next/headers";

/* =========================
   SCHEMA
========================= */
const textFieldSchema = z.object({
    type: z.literal("TEXT"),
    label: z.string().min(1),
    placeholder: z.string(),
    options: z.array(z.string()).length(0),
});

const textareaFieldSchema = z.object({
    type: z.literal("TEXTAREA"),
    label: z.string().min(1),
    placeholder: z.string(),
    options: z.array(z.string()).length(0),
});

const radioFieldSchema = z.object({
    type: z.literal("RADIO"),
    label: z.string().min(1),
    placeholder: z.string(),
    options: z.array(z.string()).min(1),
});

const selectFieldSchema = z.object({
    type: z.literal("SELECT"),
    label: z.string().min(1),
    placeholder: z.string(),
    options: z.array(z.string()).min(1),
});

const formFieldSchema = z.discriminatedUnion("type", [
    textFieldSchema,
    textareaFieldSchema,
    radioFieldSchema,
    selectFieldSchema,
]);

const generatedFormSchema = z.object({
  title: z.string().min(1, "Form title is required."),
  description: z.string(),
  fields: z.array(formFieldSchema).min(1, "At least one field is required."),
});

/* =========================
   RATE LIMIT
========================= */
const rateMap = new Map<string, number>();

/* =========================
   CACHE HASH
========================= */
function hashPrompt(prompt: string) {
  return crypto.createHash("sha256").update(prompt).digest("hex");
}

export type GenerateFormActionResult =
  | { success: true; formId: string }
  | { success: false; error: string };

/* =========================
  MAIN ACTION
========================= */
export async function generateFormAction(
  prompt: string,
): Promise<GenerateFormActionResult> {

  // Trim user's prompt
  const trimmedPrompt = prompt.trim();
  // Show error if prompt is empty
  if (!trimmedPrompt) {
    return { success: false, error: "Prompt cannot be empty." };
  }

  /* =========================
     RATE LIMIT
  ========================= */
  // A simple rate limit
  const h = await headers();
  // Get info from x-forwarded-for and get the ip. If not found, user global instead
  const userKey = h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "global";
  const last = rateMap.get(userKey);
  // Not allow request a form within 15s
  if (last && Date.now() - last < 15000) {
    return {
      success: false,
      error: 'Too many requests. Please wait a few seconds.'
    };
  }
  // Update time for this user
  rateMap.set(userKey, Date.now());

  /* =========================
     CACHE CHECK
  ========================= */
  const cacheKey = hashPrompt(trimmedPrompt);

  const cached = await prisma.aICache.findUnique({
    where: { id: cacheKey },
  });

  if (cached) {
    await prisma.usageLog.create({
      data: {
        type: "CACHE_HIT",
        model: process.env.AI_PROVIDER ?? "google",
      },
    });

    return {
      success: true,
      formId: cached.result.formId,
    };
  }

  const provider = process.env.AI_PROVIDER ?? "google";
  if (provider === "openai" && !process.env.OPENAI_API_KEY) {
    return {
      success: false,
      error: "OPENAI_API_KEY is not configured.",
    };
  }

  if (provider === "google" && !process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return {
      success: false,
      error: "GOOGLE_GENERATIVE_AI_API_KEY is not configured.",
    };
  }

  /* =========================
    AI CALL
  ========================= */
  try {
    const { output } = await generateText({
      model: getModel(),
      output: Output.object({ schema: generatedFormSchema }),
      system: `
        You are an expert questionnaire designer.

        Return a form matching the provided schema exactly.

        Rules:

        TEXT:
        - options must be []

        TEXTAREA:
        - options must be []

        RADIO:
        - options must contain at least one item

        SELECT:
        - options must contain at least one item

        Examples:

        TEXT:
        {
          "type": "TEXT",
          "label": "Your Name",
          "placeholder": "Enter your name",
          "options": []
        }

        RADIO:
        {
          "type": "RADIO",
          "label": "Gender",
          "placeholder": "",
          "options": ["Male", "Female", "Other"]
        }
        `,
        prompt: trimmedPrompt,
    });

    /* =========================
       SAVE FORM
    ========================= */
    const form = await prisma.form.create({
      data: {
        title: output.title,
        description: output.description || null,
        fields: {
          create: output.fields.map((field) => ({
            type: field.type,
            label: field.label,
            placeholder: field.placeholder || null,
            options: field.options as Prisma.InputJsonValue
          })),
        },
      },
    });

    /* =========================
       SAVE CACHE
    ========================= */
    await prisma.aICache.create({
      data: {
        id: cacheKey,
        prompt: trimmedPrompt,
        result: {
          formId: form.id,
        } as any,
      },
    });

    /* =========================
       USAGE LOG
    ========================= */
    await prisma.usageLog.create({
      data: {
        type: "GENERATE_FORM",
        model: process.env.AI_PROVIDER ?? "google",
      },
    });

    return { success: true, formId: form.id };
  } catch (error) {
    console.error("Generate Form Error:");
    console.error(error);

    if (NoObjectGeneratedError.isInstance(error)) {
      return {
        success: false,
        error: `AI failed to generate a valid form structure: ${error.message}`,
      };
    }

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Generated form failed validation: ${error.issues.map((issue) => issue.message).join("; ")}`,
      };
    }

    if (error instanceof Error) {
      return {
        success: false,
        error: `Failed to generate form: ${error.message}`,
      };
    }

    return {
        success: false,
        error: "An unexpected error occurred while generating the form.",
    };
  }
}
