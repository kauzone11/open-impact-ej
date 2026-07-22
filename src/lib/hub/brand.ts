import { PRODUCT } from "@/lib/product";

export const HUB_BRAND = {
  productName: PRODUCT.name,
  shortProductName: PRODUCT.shortName,
  initials: "OI",
  webRoot: "/inicio",
  apiRoot: "/api",
  loginPath: "/login",
  administrationPath: "/ajustes",
} as const;

export type HubBrand = typeof HUB_BRAND;
