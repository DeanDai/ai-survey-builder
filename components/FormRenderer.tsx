"use client";

import { useState } from "react";

export type FieldType = "TEXT" | "TEXTAREA" | "RADIO" | "SELECT";

export interface FormField {
  id: string;
  type: FieldType | string;
  label: string;
  placeholder?: string | null;
  options?: string[];
}

export interface FormRendererProps {
  title?: string;
  description?: string | null;
  fields: FormField[];
  onSubmit?: (values: Record<string, string>) => void | Promise<void>;
  isSubmitting?: boolean;
}

const inputClasses =
  "w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-base text-gray-900 placeholder:text-gray-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20";

const labelClasses = "text-sm font-medium text-gray-700";

interface FieldRendererProps {
  field: FormField;
  value: string;
  onChange: (value: string) => void;
}

function FieldRenderer({ field, value, onChange }: FieldRendererProps) {
  const options = field.options ?? [];

  switch (field.type) {
    case "TEXT":
      return (
        <div className="flex flex-col gap-2">
          <label htmlFor={field.id} className={labelClasses}>
            {field.label}
          </label>
          <input
            id={field.id}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder ?? undefined}
            className={inputClasses}
          />
        </div>
      );

    case "TEXTAREA":
      return (
        <div className="flex flex-col gap-2">
          <label htmlFor={field.id} className={labelClasses}>
            {field.label}
          </label>
          <textarea
            id={field.id}
            rows={4}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder ?? undefined}
            className={`${inputClasses} resize-none leading-relaxed`}
          />
        </div>
      );

    case "RADIO":
      return (
        <fieldset className="flex flex-col gap-3">
          <legend className={`${labelClasses} mb-1`}>{field.label}</legend>
          <div className="flex flex-col gap-2">
            {options.map((option) => {
              const optionId = `${field.id}-${option.replace(/\s+/g, "-").toLowerCase()}`;
              return (
                <label
                  key={option}
                  htmlFor={optionId}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-transparent px-2 py-1.5 transition-colors hover:bg-gray-50"
                >
                  <input
                    id={optionId}
                    type="radio"
                    name={field.id}
                    value={option}
                    checked={value === option}
                    onChange={(e) => onChange(e.target.value)}
                    className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500/20"
                  />
                  <span className="text-sm text-gray-700">{option}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
      );

    case "SELECT":
      return (
        <div className="flex flex-col gap-2">
          <label htmlFor={field.id} className={labelClasses}>
            {field.label}
          </label>
          <select
            id={field.id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={inputClasses}
          >
            <option value="" disabled>
              {field.placeholder ?? "Select an option"}
            </option>
            {options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      );

    default:
      return null;
  }
}

export default function FormRenderer({
  title,
  description,
  fields,
  onSubmit,
  isSubmitting = false,
}: FormRendererProps) {
  const [values, setValues] = useState<Record<string, string>>({});

  function handleChange(fieldId: string, value: string) {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onSubmit?.(values);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full flex-col gap-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm sm:p-8"
    >
      {title && (
        <header className="flex flex-col gap-1 border-b border-gray-100 pb-4">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          {description && (
            <p className="text-sm leading-relaxed text-gray-500">{description}</p>
          )}
        </header>
      )}

      {fields.map((field) => (
        <FieldRenderer
          key={field.id}
          field={field}
          value={values[field.id] ?? ""}
          onChange={(value) => handleChange(field.id, value)}
        />
      ))}

      {onSubmit && (
        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 w-full rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition-all duration-300 hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Submitting..." : "Submit"}
        </button>
      )}
    </form>
  );
}
