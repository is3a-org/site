import { fragment as stripeFragment } from "~/fragno/stripe-server";

const handlers = stripeFragment.handlersFor("react-router");

export const loader = handlers.loader;
export const action = handlers.action;
