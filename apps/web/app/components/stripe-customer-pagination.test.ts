import { expect, test } from "vite-plus/test";

import {
  advanceStripeCustomerPage,
  rewindStripeCustomerPage,
  type StripeCustomerPagination,
} from "./stripe-customer-pagination.ts";

test("Stripe customers can return to the first page after advancing", () => {
  const firstPage: StripeCustomerPagination = { pageHistory: [] };
  const secondPage = advanceStripeCustomerPage(firstPage, "cus_page_1_last");

  expect(secondPage.currentCursor).toBe("cus_page_1_last");
  expect(secondPage.pageHistory.length + 1).toBe(2);
  expect(secondPage.pageHistory).toEqual([undefined]);

  const restoredFirstPage = rewindStripeCustomerPage(secondPage);
  expect(restoredFirstPage.currentCursor).toBeUndefined();
  expect(restoredFirstPage.pageHistory).toEqual([]);
  expect(firstPage).toEqual({ pageHistory: [] });
});

test("Stripe cursor history restores each page and cannot move before the first page", () => {
  const firstPage: StripeCustomerPagination = { pageHistory: [] };
  const secondPage = advanceStripeCustomerPage(firstPage, "cus_page_1_last");
  const thirdPage = advanceStripeCustomerPage(secondPage, "cus_page_2_last");

  expect(thirdPage.pageHistory).toEqual([undefined, "cus_page_1_last"]);
  expect(rewindStripeCustomerPage(thirdPage)).toEqual(secondPage);
  expect(rewindStripeCustomerPage(firstPage)).toBe(firstPage);
});
