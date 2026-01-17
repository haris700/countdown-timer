export interface Resource {
  id: string;
  title?: string;
}

import {
  BlockStack,
  Button,
  Card,
  InlineStack,
  Select,
  Text,
  Box,
} from "@shopify/polaris";
import { useAppBridge } from "@shopify/app-bridge-react";
import { useCallback } from "react";

interface TargetingPickerProps {
  targetingType: "all" | "product" | "collection";
  setTargetingType: (value: "all" | "product" | "collection") => void;
  selectedResources: Resource[];
  setSelectedResources: (resources: Resource[]) => void;
}

const TARGETING_OPTIONS = [
  { label: "All Products", value: "all" },
  { label: "Specific Products", value: "product" },
  { label: "Specific Collections", value: "collection" },
];

export function TargetingPicker({
  targetingType,
  setTargetingType,
  selectedResources,
  setSelectedResources,
}: TargetingPickerProps) {
  const shopify = useAppBridge();

  const handleBrowse = useCallback(async () => {
    const type = targetingType === "product" ? "product" : "collection";

    try {
      const selected = await shopify.resourcePicker({
        type,
        multiple: true,
        selectionIds: selectedResources.map((r) => ({ id: r.id })),
        action: "select",
      });

      if (selected) {
        setSelectedResources(
          selected.map((r: Resource) => ({
            id: r.id,
            title: r.title,
          })),
        );
      }
    } catch (error) {
      console.log("Picker cancelled", error);
    }
  }, [targetingType, selectedResources, setSelectedResources, shopify]);

  const handleTargetTypeChange = useCallback(
    (val: string) => {
      setTargetingType(val as "all" | "product" | "collection");
    },
    [setTargetingType],
  );

  return (
    <Card>
      <BlockStack gap="500">
        <Text as="h2" variant="headingMd">
          Targeting
        </Text>

        <Select
          label="Show on"
          options={TARGETING_OPTIONS}
          value={targetingType}
          onChange={handleTargetTypeChange}
        />

        {targetingType !== "all" && (
          <Box paddingBlockStart="300">
            <BlockStack gap="300">
              <InlineStack align="space-between" blockAlign="center">
                <Text as="p" variant="bodyMd">
                  Selected: {selectedResources.length}{" "}
                  {targetingType === "product" ? "Products" : "Collections"}
                </Text>
                <Button onClick={handleBrowse} variant="primary">
                  Browse{" "}
                  {targetingType === "product" ? "Products" : "Collections"}
                </Button>
              </InlineStack>

              {selectedResources.length > 0 && (
                <Box
                  padding="200"
                  borderColor="border"
                  borderWidth="025"
                  borderRadius="200"
                >
                  <BlockStack gap="200">
                    {selectedResources.slice(0, 5).map((r, i) => (
                      <Text key={r.id || i} as="p" variant="bodySm" truncate>
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
  );
}
