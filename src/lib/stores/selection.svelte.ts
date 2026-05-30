/** Shared selection state: the currently focused country code, or null. */
export const selection = $state<{ country: string | null }>({ country: null });
