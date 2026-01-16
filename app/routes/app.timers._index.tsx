import {
    Page,
    Layout,
    Card,
    ResourceList,
    Button,
    Text,
    Badge,
    BlockStack,
    InlineStack,
    Box,
} from "@shopify/polaris";
import { useLoaderData, useNavigate } from "react-router";
import { PlusIcon } from "@shopify/polaris-icons";
import { authenticate } from "../server/shopify.server";

import type { LoaderFunctionArgs } from "react-router";

export const loader = async ({ request }: LoaderFunctionArgs) => {

    const { session } = await authenticate.admin(request);
    const { Timer } = await import("../server/models/Timer");
    const timers = await Timer.find({ shop: session.shop }).sort({ createdAt: -1 });
    // Serialize
    return { timers: JSON.parse(JSON.stringify(timers)) };
};

export default function TimersDashboard() {
    const { timers } = useLoaderData<any>();
    const navigate = useNavigate();

    return (
        <Page
            title="Countdown Timers"
            primaryAction={
                <Button variant="primary" icon={PlusIcon} onClick={() => navigate("/app/timers/new")}>
                    Create timer
                </Button>
            }
        >
            <Layout>
                <Layout.Section>
                    <Card padding="0">
                        <ResourceList
                            resourceName={{ singular: "timer", plural: "timers" }}
                            items={timers}
                            renderItem={(item: any) => {
                                const { _id, name, status, type, impressions } = item;
                                const media = <Box padding="200" background="bg-surface-secondary" borderRadius="200"><Text as="span" variant="bodyMd">{type === 'fixed' ? '📅' : '🌲'}</Text></Box>;

                                return (
                                    <ResourceList.Item
                                        id={_id}
                                        url={`/app/timers/${_id}`}
                                        media={media}
                                        accessibilityLabel={`View details for ${name}`}
                                        onClick={() => navigate(`/app/timers/${_id}`)}
                                    >
                                        <BlockStack gap="200">
                                            <InlineStack align="space-between">
                                                <Text variant="bodyMd" fontWeight="bold" as="h3">
                                                    {name}
                                                </Text>
                                                <Badge tone={status === "active" ? "success" : status === "expired" ? "critical" : "attention"}>
                                                    {status}
                                                </Badge>
                                            </InlineStack>
                                            <Text as="p" variant="bodySm" tone="subdued">
                                                Type: {type} • Impressions: {impressions || 0}
                                            </Text>
                                        </BlockStack>
                                    </ResourceList.Item>
                                );
                            }}
                        />
                    </Card>
                </Layout.Section>
            </Layout>
        </Page>
    );
}
