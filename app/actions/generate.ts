"use server";

import { generateText, NoObjectGeneratedError, Output } from "ai";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma/client";
import { getModel } from "@/lib/ai";

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

export type GenerateFormActionResult =
  | { success: true; formId: string }
  | { success: false; error: string };

export async function generateFormAction(
  prompt: string,
): Promise<GenerateFormActionResult> {
  const trimmedPrompt = prompt.trim();

  if (!trimmedPrompt) {
    return { success: false, error: "Prompt cannot be empty." };
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
