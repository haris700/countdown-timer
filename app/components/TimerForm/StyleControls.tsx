import {
    BlockStack,
    Box,
    Button,
    Card,
    ColorPicker,
    FormLayout,
    InlineStack,
    Popover,
    Select,
    Text,
} from "@shopify/polaris";
import { useState } from "react";

interface StyleControlsProps {
    color: { hue: number; saturation: number; brightness: number };
    setColor: (color: any) => void;
    size: string;
    setSize: (size: string) => void;
    position: string;
    setPosition: (pos: string) => void;
    urgency: string;
    setUrgency: (urgency: string) => void;
}

export function StyleControls({
    color,
    setColor,
    size,
    setSize,
    position,
    setPosition,
    urgency,
    setUrgency,
}: StyleControlsProps) {
    const [colorPopoverActive, setColorPopoverActive] = useState(false);

    const toggleColorPopover = () => setColorPopoverActive((active) => !active);

    const hslaString = `hsla(${color.hue}, ${color.saturation * 100}%, ${color.brightness * 100}%, 1)`;

    return (
        <Card>
            <BlockStack gap="500">
                <Text as="h2" variant="headingMd">
                    Appearance
                </Text>

                <BlockStack gap="200">
                    <Text as="p" variant="bodyMd">
                        Background Color
                    </Text>
                    <Popover
                        active={colorPopoverActive}
                        activator={
                            <div onClick={toggleColorPopover} style={{ cursor: "pointer" }}>
                                <InlineStack gap="300" align="center">
                                    <div
                                        style={{
                                            background: hslaString,
                                            width: "30px",
                                            height: "30px",
                                            borderRadius: "4px",
                                            border: "1px solid #c9cccf",
                                            boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.1)",
                                        }}
                                    />
                                    <Button onClick={() => { }} disclosure="down">
                                        Change Color
                                    </Button>
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
                            { label: "Large", value: "large" },
                        ]}
                        value={size}
                        onChange={setSize}
                    />

                    <Select
                        label="Timer position"
                        options={[
                            { label: "Top of page", value: "top" },
                            { label: "Bottom of page", value: "bottom" },
                            { label: "Static (App Block)", value: "static" },
                        ]}
                        value={position}
                        onChange={setPosition}
                    />
                </FormLayout.Group>

                <Select
                    label="Urgency notification"
                    options={[
                        { label: "None", value: "none" },
                        { label: "Color pulse", value: "pulse" },
                    ]}
                    value={urgency}
                    onChange={setUrgency}
                />
            </BlockStack>
        </Card>
    );
}
