import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../server/shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  // No DB cleanup needed – Shopify session storage handles this
  return new Response();
};
