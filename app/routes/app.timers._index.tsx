import {
    Page,
    Layout,
    Card,
    Button,
    InlineGrid,
    EmptyState,
} from "@shopify/polaris";
import { useLoaderData, useNavigate } from "react-router";
import { PlusIcon } from "@shopify/polaris-icons";
import { authenticate } from "../server/shopify.server";
import { TimerCard } from "../components/Dashboard/TimerCard";
import type { LoaderFunctionArgs } from "react-router";

import { getTimers } from "../server/routes/admin/timers";

export const loader = async ({ request }: LoaderFunctionArgs) => {
    const { session } = await authenticate.admin(request);
    const timers = await getTimers(session.shop);
    return { timers: JSON.parse(JSON.stringify(timers)) };
};

export default function TimersDashboard() {
    const { timers } = useLoaderData<any>();
    const navigate = useNavigate();

    const hasTimers = timers && timers.length > 0;

    return (
        <Page
            title="Countdown Timers"
            primaryAction={
                <Button
                    variant="primary"
                    icon={PlusIcon}
                    onClick={() => navigate("/app/timers/new")}
                >
                    Create timer
                </Button>
            }
            fullWidth
        >
            <Layout>
                <Layout.Section>
                    {hasTimers ? (
                        <InlineGrid gap="400" columns={{ xs: 1, sm: 2, md: 3, lg: 4 }}>
                            {timers.map((timer: any) => (
                                <TimerCard key={timer._id} timer={timer} />
                            ))}
                        </InlineGrid>
                    ) : (
                        <Card>
                            <EmptyState
                                heading="Create your first countdown timer"
                                action={{
                                    content: "Create timer",
                                    onAction: () => navigate("/app/timers/new"),
                                }}
                                image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                            >
                                <p>
                                    Drive urgency and increase conversions by adding a countdown
                                    timer to your store.
                                </p>
                            </EmptyState>
                        </Card>
                    )}
                </Layout.Section>
            </Layout>
        </Page>
    );
}
