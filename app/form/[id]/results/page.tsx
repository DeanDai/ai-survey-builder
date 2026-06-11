import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

interface FormResultsPageProps {
  params: Promise<{ id: string }>;
}

function formatSubmittedAt(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function FormResultsPage({ params }: FormResultsPageProps) {
  const { id } = await params;

  const form = await prisma.form.findUnique({
    where: { id },
    include: { fields: true },
  });

  if (!form) {
    notFound();
  }

  const submissions = await prisma.submission.findMany({
    where: { formId: id },
    include: { answers: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex min-h-full flex-1 flex-col items-center bg-gray-50 px-4 py-12 sm:px-6 sm:py-16">
      <main className="flex w-full max-w-5xl flex-col gap-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{form.title}</h1>
            <p className="mt-1 text-sm text-gray-500">All submitted responses</p>
          </div>

          <div className="flex gap-4">
            <Link
              href={`/form/${id}`}
              className="text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-700"
            >
              Fill form
            </Link>
            <Link
              href="/"
              className="text-sm font-medium text-gray-500 transition-colors hover:text-gray-700"
            >
              Home
            </Link>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          {submissions.length === 0 ? (
            <p className="px-6 py-12 text-center text-sm text-gray-500">
              No responses yet. Share the form to start collecting answers.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th
                      scope="col"
                      className="whitespace-nowrap px-4 py-3 font-semibold text-gray-700"
                    >
                      Submitted At
                    </th>
                    {form.fields.map((field) => (
                      <th
                        key={field.id}
                        scope="col"
                        className="whitespace-nowrap px-4 py-3 font-semibold text-gray-700"
                      >
                        {field.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {submissions.map((submission) => {
                    const answersByFieldId = Object.fromEntries(
                      submission.answers.map((answer) => [
                        answer.fieldId,
                        answer.value,
                      ]),
                    );

                    return (
                      <tr
                        key={submission.id}
                        className="transition-colors hover:bg-gray-50"
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                          {formatSubmittedAt(submission.createdAt)}
                        </td>
                        {form.fields.map((field) => (
                          <td
                            key={field.id}
                            className="max-w-xs px-4 py-3 text-gray-900"
                          >
                            {answersByFieldId[field.id]?.trim() || "—"}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {submissions.length > 0 && (
          <p className="text-sm text-gray-500">
            {submissions.length} response{submissions.length === 1 ? "" : "s"}{" "}
            total
          </p>
        )}
      </main>
    </div>
  );
}
