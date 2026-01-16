import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../server/shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  // Session scope updates are handled internally by Shopify session storage
  return new Response();
};
