import type { HeadersFunction, LoaderFunctionArgs, LinksFunction } from "react-router";
import { Outlet, useLoaderData, useRouteError, Link as ReactRouterLink } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { NavMenu } from "@shopify/app-bridge-react";

import { AppProvider as PolarisAppProvider } from "@shopify/polaris";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import translations from "@shopify/polaris/locales/en.json";

import { authenticate } from "../server/shopify.server";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: polarisStyles },
];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  return { apiKey: process.env.SHOPIFY_API_KEY || "" };
};



function LinkAdapter({ children, url, ...rest }: any) {
  return (
    <ReactRouterLink to={url} {...rest}>
      {children}
    </ReactRouterLink>
  );
}

export default function App() {
  const { apiKey } = useLoaderData<typeof loader>();

  return (
    <AppProvider embedded apiKey={apiKey}>
      <PolarisAppProvider
        i18n={translations}
        linkComponent={LinkAdapter as any}
      >
        <NavMenu>
          <a href="/app" rel="home">Home</a>
        </NavMenu>
        <Outlet />
      </PolarisAppProvider>
    </AppProvider>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
