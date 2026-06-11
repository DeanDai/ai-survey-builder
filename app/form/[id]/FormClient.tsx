"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitFormAnswersAction } from "@/app/actions/submit";
import FormRenderer, { type FormField } from "@/components/FormRenderer";

interface FormClientProps {
  formId: string;
  title: string;
  description?: string | null;
  fields: FormField[];
}

export default function FormClient({
  formId,
  title,
  description,
  fields,
}: FormClientProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(values: Record<string, string>) {
    if (isSubmitting) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const result = await submitFormAnswersAction(formId, values);

      if (result.success) {
        router.push(`/form/${formId}/results`);
        return;
      }

      setError(result.error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      <FormRenderer
        title={title}
        description={description}
        fields={fields}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
