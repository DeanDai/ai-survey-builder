import Link from "next/link";
import { notFound } from "next/navigation";
import FormClient from "@/app/form/[id]/FormClient";
import { prisma } from "@/lib/prisma";

interface FormPreviewPageProps {
  params: Promise<{ id: string }>;
}

export default async function FormPreviewPage({ params }: FormPreviewPageProps) {
  const { id } = await params;

  const form = await prisma.form.findUnique({
    where: { id },
    include: { fields: true },
  });

  if (!form) {
    notFound();
  }

  const fields = form.fields.map((field) => ({
    ...field,
    options: Array.isArray(field.options)
      ? field.options.map(String)
      : [],
  }));

  return (
    <div className="flex min-h-full flex-1 flex-col items-center bg-gray-50 px-4 py-12 sm:px-6 sm:py-16">
      <main className="flex w-full max-w-2xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-700"
          >
            ← Back to generator
          </Link>
          <Link
            href={`/form/${id}/results`}
            className="text-sm font-medium text-gray-500 transition-colors hover:text-gray-700"
          >
            View results
          </Link>
        </div>

        <FormClient
          formId={form.id}
          title={form.title}
          description={form.description}
          fields={fields}
        />
      </main>
    </div>
  );
}
