type ReadonlyRouteData<TValue> = TValue extends Date
  ? TValue
  : TValue extends object
    ? { readonly [TKey in keyof TValue]: ReadonlyRouteData<TValue[TKey]> }
    : TValue;

/** Keeps route data and matched parent data readonly while preserving React callback contracts. */
export type ReadonlyRouteProps<TProps> = {
  readonly [TKey in keyof TProps]: TKey extends "loaderData" | "actionData" | "matches" | "params"
    ? ReadonlyRouteData<TProps[TKey]>
    : TProps[TKey];
};
