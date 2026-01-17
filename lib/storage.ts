export function scopedKey(baseKey: string, scopeId?: string | null): string {
  if (!scopeId) return baseKey;
  return `${baseKey}:${scopeId}`;
}
