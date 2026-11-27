/** Response of `GET /features/me`: every catalog key mapped to on/off. */
export interface MyFeatures {
  features: Record<string, boolean>;
}
