export function unwrap<T>(payload: any): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    return payload.data as T;
  }
  return payload as T;
}

export function normalizeList<T>(payload: any): T[] {
  const value = unwrap<any>(payload);
  if (Array.isArray(value)) return value as T[];
  if (Array.isArray(value?.items)) return value.items as T[];
  if (Array.isArray(value?.projects)) return value.projects as T[];
  if (Array.isArray(value?.documents)) return value.documents as T[];
  if (Array.isArray(value?.researchPlans)) return value.researchPlans as T[];
  if (Array.isArray(value?.sessions)) return value.sessions as T[];
  return [];
}
