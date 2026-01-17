import React from "react";
import { Card, Text, Badge, BlockStack, InlineStack, Box, Button } from "@shopify/polaris";
import { useNavigate } from "react-router";

import { Timer } from "../../types/timer";

interface TimerCardProps {
    timer: Timer;
}

export const TimerCard = React.memo(function TimerCard({ timer }: TimerCardProps) {
    const navigate = useNavigate();
    const { _id, name, status, type, startAt, endAt, impressions } = timer;

    const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString() : 'N/A';

    return (
        <Card>
            <BlockStack gap="400">
                <InlineStack align="space-between" blockAlign="center">
                    <Text as="h3" variant="headingSm" truncate>
                        {name}
                    </Text>
                    <Badge tone={status === "active" ? "success" : status === "expired" ? "critical" : "attention"}>
                        {status}
                    </Badge>
                </InlineStack>

                <BlockStack gap="200">
                    <InlineStack gap="200" align="start" blockAlign="center">
                        <Box><Text as="span" variant="bodySm" tone="subdued">Type:</Text></Box>
                        <Text as="span" variant="bodySm" fontWeight="semibold">
                            {type === 'fixed' ? '📅 Fixed Date' : '🌲 Evergreen'}
                        </Text>
                    </InlineStack>

                    {type === 'fixed' && (
                        <BlockStack gap="100">
                            <Text as="p" variant="bodySm" tone="subdued">
                                Start: {formatDate(startAt)}
                            </Text>
                            <Text as="p" variant="bodySm" tone="subdued">
                                End: {formatDate(endAt)}
                            </Text>
                        </BlockStack>
                    )}

                    <Text as="p" variant="bodySm" tone="subdued">
                        👁️ {impressions} Impressions
                    </Text>
                </BlockStack>

                <Button fullWidth onClick={() => navigate(`/app/timers/${_id}`)}>
                    Edit Timer
                </Button>
            </BlockStack>
        </Card>
    );
});
