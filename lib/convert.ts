export function extractNumbers(str: string | null): number[] {
  if (!str) return []
  return str.match(/\d+/g)?.map(Number) || []
}

export function extractStrings(str: string | null): string[] {
  if (!str) return []
  return str
    .replace(/[\[\]]/g, '')
    .split(',')
    .filter(Boolean)
}
