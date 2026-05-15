// Centralized query key factory — ensures consistent keys across hooks and
// invalidation calls. Using `as const` lets TypeScript infer literal tuple types.
export const queryKeys = {
  dashboard:   (userId: string) => ['dashboard',    userId] as const,
  briqs:       (userId: string) => ['briqs',        userId] as const,
  funds:       (userId: string) => ['funds',        userId] as const,
  lands:       (userId: string) => ['lands',        userId] as const,
  afores:      (userId: string) => ['afores',       userId] as const,
  featureFlags:               () => ['feature-flags']       as const,
} as const;
