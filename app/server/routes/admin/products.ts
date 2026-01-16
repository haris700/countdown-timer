import { authenticate } from "../../shopify.server";

export async function productsLoader({ request }: { request: Request }) {
    const { admin } = await authenticate.admin(request);
    const url = new URL(request.url);
    const query = url.searchParams.get("q") || "";

    const response = await admin.graphql(
        `#graphql
      query getProducts($query: String!) {
        products(first: 20, query: $query) {
          edges {
            node {
              id
              title
              handle
              featuredImage {
                url
              }
            }
          }
        }
      }`,
        {
            variables: {
                query: query,
            },
        }
    );

    const responseJson = await response.json();

    const products = responseJson.data.products.edges.map((edge: any) => ({
        id: edge.node.id,
        title: edge.node.title,
        handle: edge.node.handle,
        image: edge.node.featuredImage?.url || "",
    }));

    return Response.json({ products });
}
