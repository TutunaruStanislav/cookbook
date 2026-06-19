import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';

/**
 * Map a DRF validation error response onto react-hook-form fields so the
 * corresponding inputs get highlighted (and show the message), and return a
 * general message for the top alert.
 *
 * DRF shape: { field: ["msg", ...], non_field_errors: [...], detail: "..." }.
 * Known scalar fields are mapped via setError; everything else (nested
 * arrays, detail, non_field_errors, unknown keys) goes to the returned alert.
 */
export function applyServerErrors<T extends FieldValues>(
  err: unknown,
  setError: UseFormSetError<T>,
  knownFields: readonly string[],
): string | null {
  const data = (err as { response?: { data?: unknown } })?.response?.data;
  if (!data || typeof data !== 'object') {
    return 'Произошла ошибка. Попробуйте ещё раз.';
  }

  const general: string[] = [];
  let fieldErrorSet = false;

  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    const message = Array.isArray(value)
      ? value.filter((v) => typeof v === 'string').join(' ')
      : typeof value === 'string'
        ? value
        : '';
    if (!message) continue;

    if (key !== 'detail' && key !== 'non_field_errors' && knownFields.includes(key)) {
      setError(key as Path<T>, { type: 'server', message });
      fieldErrorSet = true;
    } else {
      general.push(message);
    }
  }

  if (general.length) return general.join(' ');
  if (fieldErrorSet) return 'Исправьте ошибки в выделенных полях.';
  return 'Произошла ошибка. Попробуйте ещё раз.';
}
