"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateFormAction } from "@/app/actions/generate";

export default function Home() {
  const router = useRouter();
  const [requirements, setRequirements] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStartGenerating() {
    if (!requirements.trim() || isGenerating) return;

    setError(null);
    setIsGenerating(true);

    try {
      const result = await generateFormAction(requirements);

      if (result.success) {
        router.push(`/form/${result.formId}`);
        return;
      }

      setError(result.error);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    /*
     * flex          — enables Flexbox layout on this element
     * flex-col      — stacks children vertically (column direction)
     * flex-1        — grows to fill remaining space inside the parent flex container
     * items-center  — aligns children along the cross axis (horizontal centering in a column)
     * justify-center — distributes children along the main axis (vertical centering in a column)
     * bg-gray-50    — light gray background color
     * px-4 / py-12  — horizontal / vertical padding
     */
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 sm:py-20">
      {/*
       * w-full        — width 100% of the parent
       * max-w-2xl     — caps width at ~42rem for readable line length
       */}
      <main className="flex w-full max-w-2xl flex-col items-center justify-center">
        <header className="mb-10 flex flex-col items-center justify-center text-center">
          {/*
           * rounded-lg    — medium border-radius on all corners
           * ring-1        — 1px outline ring (alternative to border)
           */}
          <div className="mb-5 flex items-center justify-center rounded-lg bg-indigo-50 px-4 py-1.5 ring-1 ring-indigo-100">
            <span className="text-sm font-medium tracking-wide text-indigo-600">
              Powered by AI
            </span>
          </div>

          {/*
           * text-4xl      — large heading font size (2.25rem)
           * font-bold     — font-weight 700
           * tracking-tight — slightly tighter letter spacing
           */}
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            AI Mini Questionnaire Generator
          </h1>

          {/*
           * leading-relaxed — comfortable line-height (1.625)
           * text-gray-500   — muted body text color
           */}
          <p className="mt-4 max-w-lg text-lg leading-relaxed text-gray-500">
            Describe your survey in plain language — we&apos;ll turn it into a
            polished questionnaire in seconds.
          </p>
        </header>

        {/*
         * rounded-lg  — rounded corners on the form card
         * border      — 1px solid border
         * shadow-sm   — subtle drop shadow
         * p-6         — padding on all sides
         */}
        <section className="flex w-full flex-col items-center justify-center rounded-lg border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <label
            htmlFor="requirements"
            className="mb-3 self-start text-sm font-medium text-gray-700"
          >
            Questionnaire requirements
          </label>

          {/*
           * w-full        — textarea spans the full card width
           * resize-none   — prevents manual drag-resize
           * rounded-lg    — rounded input corners
           * focus:ring-2  — visible focus ring for accessibility
           */}
          <textarea
            id="requirements"
            rows={6}
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            placeholder={`e.g. Generate a "Light Meal Takeout User Satisfaction Survey"`}
            className="w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-4 py-4 text-base leading-relaxed text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />

          {/*
           * Button hover animations (core Tailwind classes):
           *
           * flex            — lays out icon + label in a row
           * items-center    — vertically centers icon and text
           * justify-center  — horizontally centers content inside the button
           * gap-2           — 0.5rem space between icon and label
           * rounded-lg      — rounded button corners
           * transition-all  — animates all changing properties smoothly
           * duration-300    — animation lasts 300ms
           * hover:-translate-y-0.5 — lifts the button slightly on hover
           * hover:bg-indigo-700    — darkens background on hover
           * hover:shadow-lg        — deepens shadow on hover
           * active:translate-y-0   — presses button back down on click
           * group           — lets child elements react to button hover state
           */}
          {error && (
            <p
              role="alert"
              className="mt-4 w-full rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleStartGenerating}
            disabled={!requirements.trim() || isGenerating}
            className="group mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3.5 text-base font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-lg active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:bg-indigo-600 disabled:hover:shadow-md"
          >
            {/*
             * group-hover:scale-110 — icon grows when the parent button is hovered
             * transition-transform  — animates only transform properties
             */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-5 w-5 transition-transform duration-300 group-hover:scale-110"
              aria-hidden="true"
            >
              <path d="M15.98 1.804a1 1 0 0 0-1.96 0l-.24 1.192a1 1 0 0 1-.784.785l-1.192.24a1 1 0 0 0 0 1.962l1.192.24a1 1 0 0 1 .785.784l.24 1.192a1 1 0 0 0 1.962 0l.24-1.192a1 1 0 0 1 .784-.785l1.192-.24a1 1 0 0 0 0-1.962l-1.192-.24a1 1 0 0 1-.785-.784l-.24-1.192ZM12 5a1 1 0 0 0-1 1v1.101a6.002 6.002 0 0 0-2.874 2.874H7a1 1 0 1 0 0 2h1.101a6.002 6.002 0 0 0 2.874 2.874V17a1 1 0 1 0 2 0v-1.101a6.002 6.002 0 0 0 2.874-2.874H17a1 1 0 1 0 0-2h-1.101a6.002 6.002 0 0 0-2.874-2.874V6a1 1 0 0 0-1-1Z" />
            </svg>
            {isGenerating ? "Generating..." : "Start Generating"}
          </button>
        </section>

        <p className="mt-8 text-center text-sm text-gray-400">
          No account needed · Results in under a minute
        </p>
      </main>
    </div>
  );
}
