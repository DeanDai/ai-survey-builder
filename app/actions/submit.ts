"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export type SubmitFormActionResult =
  | { success: true; submissionId: string }
  | { success: false; error: string };

export async function submitFormAnswersAction(
  formId: string,
  values: Record<string, string>,
): Promise<SubmitFormActionResult> {
  if (!formId.trim()) {
    return { success: false, error: "Form ID is required." };
  }

  try {
    const form = await prisma.form.findUnique({
      where: { id: formId },
      include: { fields: true },
    });

    if (!form) {
      return { success: false, error: "Form not found." };
    }

    const validFieldIds = new Set(form.fields.map((field) => field.id));

    for (const fieldId of Object.keys(values)) {
      if (!validFieldIds.has(fieldId)) {
        return {
          success: false,
          error: "Submission contains answers for unknown fields.",
        };
      }
    }

    const submission = await prisma.submission.create({
      data: {
        formId,
        answers: {
          create: form.fields.map((field) => ({
            fieldId: field.id,
            value: values[field.id]?.trim() ?? "",
          })),
        },
      },
    });

    revalidatePath(`/form/${formId}/results`);

    return { success: true, submissionId: submission.id };
  } catch (error) {
    if (error instanceof Error) {
      return {
        success: false,
        error: `Failed to save submission: ${error.message}`,
      };
    }

    return {
      success: false,
      error: "An unexpected error occurred while saving the submission.",
    };
  }
}
