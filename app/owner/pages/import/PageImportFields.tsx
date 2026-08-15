import type { FormEventHandler } from "react";
import styles from "./page-preview.module.css";

type PageImportFieldProps = {
  name: string;
  label: string;
  optional?: boolean;
  error?: string;
  errorId?: string;
  disabled: boolean;
  onInput: FormEventHandler<HTMLInputElement | HTMLTextAreaElement>;
};

type PageImportTextFieldProps = PageImportFieldProps & {
  maxLength: number;
  required: boolean;
};

type PageImportTextareaFieldProps = PageImportFieldProps & {
  maxLength?: number;
  required: boolean;
  rows: number;
  spellCheck?: boolean;
  help?: string;
  helpId?: string;
  variant?: "plain" | "source";
};

export function PageImportTextField({
  name,
  label,
  optional = false,
  error,
  errorId: suppliedErrorId,
  disabled,
  maxLength,
  onInput,
  required,
}: PageImportTextFieldProps) {
  const errorId = suppliedErrorId ?? `page-preview-${name}-error`;

  return (
    <label className={styles['page-import-field']}>
      <span>{label}{optional ? <span className={styles['page-import-optional']}> (optional)</span> : null}</span>
      <input
        aria-describedby={error ? errorId : undefined}
        aria-invalid={error ? true : undefined}
        disabled={disabled}
        maxLength={maxLength}
        name={name}
        onInput={onInput}
        required={required}
      />
      {error ? <span className={styles['page-import-error']} id={errorId}>{error}</span> : null}
    </label>
  );
}

export function PageImportTextareaField({
  name,
  label,
  optional = false,
  error,
  errorId: suppliedErrorId,
  disabled,
  maxLength,
  onInput,
  required,
  rows,
  spellCheck,
  help,
  helpId: suppliedHelpId,
  variant = "plain",
}: PageImportTextareaFieldProps) {
  const helpId = help ? suppliedHelpId ?? `page-preview-${name}-help` : undefined;
  const errorId = suppliedErrorId ?? `page-preview-${name}-error`;
  const describedBy = [helpId, error ? errorId : undefined].filter(Boolean).join(" ") || undefined;

  return (
    <label className={styles['page-import-field']}>
      <span>{label}{optional ? <span className={styles['page-import-optional']}> (optional)</span> : null}</span>
      <textarea
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
        className={variant === "source" ? styles['page-import-source'] : undefined}
        disabled={disabled}
        maxLength={maxLength}
        name={name}
        onInput={onInput}
        required={required}
        rows={rows}
        spellCheck={spellCheck}
      />
      {help && helpId ? <span className={styles['page-import-help']} id={helpId}>{help}</span> : null}
      {error ? <span className={styles['page-import-error']} id={errorId}>{error}</span> : null}
    </label>
  );
}
