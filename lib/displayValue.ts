/** Hide source placeholders while retaining meaningful values such as "0원". */
export function isUsefulDisplayValue(value: unknown): boolean {
  const text = String(value ?? "").trim();
  return Boolean(text) && !/^(?:0(?:\.0+)?|null|undefined|정보\s*없음|미상|확인\s*필요|미기재|미제공|해당\s*정보\s*없음)[.!]?$/i.test(text);
}
