import {
    Page,
    Layout,
    Card,
    FormLayout,
    TextField,
    Select,
    Button,
    DatePicker,
    BlockStack,
    InlineStack,
    Box,
    Text,
    ColorPicker,
    Banner,
    Popover
} from "@shopify/polaris";


import { useState, useCallback, useEffect } from "react";
import { useLoaderData, useSubmit, useNavigate, useNavigation } from "react-router";

import { authenticate } from "../server/shopify.server";

// --- LOADER ---
export const loader = async ({ request, params }: any) => {
    const { session } = await authenticate.admin(request);
    const { Timer } = await import("../server/models/Timer");

    if (params.id === "new") {
        return { timer: null };
    }

    const timer = await Timer.findOne({ _id: params.id, shop: session.shop });
    return { timer: JSON.parse(JSON.stringify(timer)) };
};


export const action = async ({ request, params }: any) => {
    const { session } = await authenticate.admin(request);
    const { Timer } = await import("../server/models/Timer");
    const formData = await request.formData();
    const data = JSON.parse(formData.get("data"));

    if (params.id === "new") {
        await Timer.create({ ...data, shop: session.shop });
    } else {
        await Timer.findOneAndUpdate({ _id: params.id, shop: session.shop }, { $set: data });
    }

    return { success: true };
};

export default function TimerForm() {
    const { timer } = useLoaderData<any>();
    const navigate = useNavigate();
    const submit = useSubmit();
    const navigation = useNavigation();
    const isLoading = navigation.state === "submitting";


    const [name, setName] = useState(timer?.name || "");
    const [type, setType] = useState(timer?.type || "fixed");
    const [description, setDescription] = useState(timer?.description || "");
    const [targetingType, setTargetingType] = useState(timer?.targeting?.type || "all");


    const parseDate = (d: any) => {
        if (!d) return new Date();
        const date = new Date(d);
        return isNaN(date.getTime()) ? new Date() : date;
    };

    const [startDate, setStartDate] = useState(parseDate(timer?.startAt));
    const [endDate, setEndDate] = useState(parseDate(timer?.endAt));

    // Resource Picker State
    const [selectedResources, setSelectedResources] = useState<any[]>([]); // Array of {id, title}

    // Initialize selected resources if editing
    useEffect(() => {
        const t = timer?.targeting;
        if (t) {
            let initialIds = [];
            if (t.type === 'product' && t.productIds?.length) initialIds = t.productIds;
            else if (t.type === 'collection' && t.collectionIds?.length) initialIds = t.collectionIds;

            if (initialIds.length > 0) {
                setSelectedResources(initialIds.map((id: string) => ({ id, title: id })));
            }
        }
    }, [timer]);

    // Resource Picker Logic
    const handleBrowse = async () => {
        const type = targetingType === 'product' ? 'product' : 'collection';

        const shopify = (window as any).shopify;
        if (!shopify || !shopify.resourcePicker) {
            console.error("Shopify App Bridge not found or resourcePicker not available.");
            return;
        }

        try {
            const selected = await shopify.resourcePicker({
                type: type,
                multiple: true,
                selectionIds: selectedResources.map(r => ({ id: r.id })),
                action: 'select'
            });

            if (selected) {
                setSelectedResources(selected);
            }
        } catch (error) {
            console.log("Resource Picker cancelled", error);
        }
    };

    // Popover States
    const [startPopoverActive, setStartPopoverActive] = useState(false);
    const [endPopoverActive, setEndPopoverActive] = useState(false);
    const [colorPopoverActive, setColorPopoverActive] = useState(false);
    const [color, setColor] = useState({ hue: 120, saturation: 1, brightness: 1 }); // Default Green-ish
    const [size, setSize] = useState(timer?.styleConfig?.size || "medium");
    const [position, setPosition] = useState(timer?.styleConfig?.position || "top");
    const [urgency, setUrgency] = useState(timer?.styleConfig?.urgency || "none");

    // --- SUBMIT ---
    const handleSave = () => {
        const payload = {
            name,
            type,
            startAt: type === 'fixed' ? startDate : undefined,
            endAt: type === 'fixed' ? endDate : undefined,
            description,
            styleConfig: {
                color: `hsla(${color.hue}, ${color.saturation * 100}%, ${color.brightness * 100}%, 1)`,
                size,
                position,
                urgency
            },
            targeting: {
                type: targetingType,
                productIds: targetingType === 'product' ? selectedResources.map(r => r.id) : [],
                collectionIds: targetingType === 'collection' ? selectedResources.map(r => r.id) : []
            },
            durationMinutes: type === 'evergreen' ? 60 : undefined
        };

        submit({ data: JSON.stringify(payload) }, { method: "POST" });
    };

    useEffect(() => {
        if (navigation.state === "idle" && navigation.formMethod === "POST") {
            navigate("/app/timers");
        }
    }, [navigation.state, navigation.formMethod]);

    // Helpers
    const formatDate = (date: Date) => date.toLocaleDateString();

    return (
        <Page
            title={timer ? "Edit Timer" : "Create New Timer"}
            backAction={{ content: "Timers", onAction: () => navigate("/app/timers") }}
            primaryAction={{
                content: "Save",
                onAction: handleSave,
                loading: isLoading
            }}
        >
            <Layout>
                <Layout.Section>
                    <FormLayout>
                        <Card>
                            <BlockStack gap="500">
                                <Text as="h2" variant="headingMd">Timer Settings</Text>

                                <TextField
                                    label="Timer name"
                                    value={name}
                                    onChange={setName}
                                    autoComplete="off"
                                    requiredIndicator
                                />

                                <Select
                                    label="Type"
                                    options={[
                                        { label: "Fixed Date (Scheduled)", value: "fixed" },
                                        { label: "Evergreen (Reset per visitor)", value: "evergreen" }
                                    ]}
                                    value={type}
                                    onChange={setType}
                                />

                                {type === 'fixed' && (
                                    <FormLayout.Group>
                                        <Popover
                                            active={startPopoverActive}
                                            activator={
                                                <TextField
                                                    label="Start Date"
                                                    value={formatDate(startDate)}
                                                    onFocus={() => setStartPopoverActive(true)}
                                                    autoComplete="off"
                                                />
                                            }
                                            onClose={() => setStartPopoverActive(false)}
                                        >
                                            <Box padding="400">
                                                <DatePicker
                                                    month={startDate.getMonth()}
                                                    year={startDate.getFullYear()}
                                                    onChange={(range) => {
                                                        setStartDate(range.start);
                                                        setStartPopoverActive(false);
                                                    }}
                                                    allowRange={false}
                                                    selected={startDate}
                                                />
                                            </Box>
                                        </Popover>

                                        <Popover
                                            active={endPopoverActive}
                                            activator={
                                                <TextField
                                                    label="End Date"
                                                    value={formatDate(endDate)}
                                                    onFocus={() => setEndPopoverActive(true)}
                                                    autoComplete="off"
                                                />
                                            }
                                            onClose={() => setEndPopoverActive(false)}
                                        >
                                            <Box padding="400">
                                                <DatePicker
                                                    month={endDate.getMonth()}
                                                    year={endDate.getFullYear()}
                                                    onChange={(range) => {
                                                        setEndDate(range.start);
                                                        setEndPopoverActive(false);
                                                    }}
                                                    allowRange={false}
                                                    selected={endDate}
                                                />
                                            </Box>
                                        </Popover>
                                    </FormLayout.Group>
                                )}

                                <TextField
                                    label="Promotion description"
                                    value={description}
                                    onChange={setDescription}
                                    multiline={4}
                                    autoComplete="off"
                                    helpText="Text to display on the countdown banner."
                                />
                            </BlockStack>
                        </Card>

                        <Card>
                            <BlockStack gap="500">
                                <Text as="h2" variant="headingMd">Appearance</Text>

                                <BlockStack gap="200">
                                    <Text as="p" variant="bodyMd">Background Color</Text>
                                    <Popover
                                        active={colorPopoverActive}
                                        activator={
                                            <div onClick={() => setColorPopoverActive((active) => !active)} style={{ cursor: "pointer" }}>
                                                <InlineStack gap="300" align="center">
                                                    <div
                                                        style={{
                                                            background: `hsla(${color.hue}, ${color.saturation * 100}%, ${color.brightness * 100}%, 1)`,
                                                            width: "30px",
                                                            height: "30px",
                                                            borderRadius: "4px",
                                                            border: "1px solid #c9cccf",
                                                            boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.1)"
                                                        }}
                                                    />
                                                    <Button onClick={() => { }} disclosure="down">Change Color</Button>
                                                </InlineStack>
                                            </div>
                                        }
                                        onClose={() => setColorPopoverActive(false)}
                                    >
                                        <Box padding="400">
                                            <ColorPicker onChange={setColor} color={color} allowAlpha />
                                        </Box>
                                    </Popover>
                                </BlockStack>

                                <FormLayout.Group>
                                    <Select
                                        label="Timer size"
                                        options={[
                                            { label: "Small", value: "small" },
                                            { label: "Medium", value: "medium" },
                                            { label: "Large", value: "large" }
                                        ]}
                                        value={size}
                                        onChange={setSize}
                                    />

                                    <Select
                                        label="Timer position"
                                        options={[
                                            { label: "Top of page", value: "top" },
                                            { label: "Bottom of page", value: "bottom" },
                                            { label: "Static (Custom placement)", value: "static" }
                                        ]}
                                        value={position}
                                        onChange={setPosition}
                                    />
                                </FormLayout.Group>

                                <Select
                                    label="Urgency notification"
                                    options={[
                                        { label: "None", value: "none" },
                                        { label: "Color pulse", value: "pulse" }
                                    ]}
                                    value={urgency}
                                    onChange={setUrgency}
                                />
                            </BlockStack>
                        </Card>

                        <Card>
                            <BlockStack gap="500">
                                <Text as="h2" variant="headingMd">Targeting</Text>
                                <Select
                                    label="Show on"
                                    options={[
                                        { label: "All Products", value: "all" },
                                        { label: "Specific Products", value: "product" },
                                        { label: "Specific Collections", value: "collection" }
                                    ]}
                                    value={targetingType}
                                    onChange={setTargetingType}
                                />

                                {targetingType !== 'all' && (
                                    <Box paddingBlockStart="300">
                                        <BlockStack gap="300">
                                            <InlineStack align="space-between" blockAlign="center">
                                                <Text as="p" variant="bodyMd">
                                                    Selected: {selectedResources.length} {targetingType === 'product' ? 'Products' : 'Collections'}
                                                </Text>
                                                <Button onClick={handleBrowse} variant="primary">
                                                    Browse {targetingType === 'product' ? 'Products' : 'Collections'}
                                                </Button>
                                            </InlineStack>

                                            {selectedResources.length > 0 && (
                                                <Box padding="200" borderColor="border" borderWidth="025" borderRadius="200">
                                                    <BlockStack gap="200">
                                                        {selectedResources.slice(0, 5).map((r, i) => (
                                                            <Text key={i} as="p" variant="bodySm" truncate>
                                                                • {r.title || r.id}
                                                            </Text>
                                                        ))}
                                                        {selectedResources.length > 5 && (
                                                            <Text as="p" variant="bodySm" tone="subdued">
                                                                + {selectedResources.length - 5} more...
                                                            </Text>
                                                        )}
                                                    </BlockStack>
                                                </Box>
                                            )}
                                        </BlockStack>
                                    </Box>
                                )}
                            </BlockStack>
                        </Card>

                    </FormLayout>
                </Layout.Section>
            </Layout>
        </Page>
    );
}
