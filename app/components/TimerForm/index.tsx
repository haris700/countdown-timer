import {
  Page,
  Layout,
  Card,
  FormLayout,
  TextField,
  Select,
  BlockStack,
  Box,
  Text,
  Popover,
  DatePicker,
} from "@shopify/polaris";
import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSubmit, useNavigation } from "react-router";
import { TargetingPicker, type Resource } from "./TargetingPicker";
import { StyleControls } from "./StyleControls";
import { DURATION_OPTIONS } from "../../constants/timer";

import { Timer } from "../../types/timer";

interface TimerFormProps {
  timer?: Timer;
}

const parseDate = (d?: string) => {
  if (!d) return new Date();
  const date = new Date(d);
  return isNaN(date.getTime()) ? new Date() : date;
};

const defaultColor = { hue: 120, saturation: 1, brightness: 1 };

const parseHsl = (str?: string) => {
  const match = str?.match(
    /hsla\((\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?)%,\s*(\d+(?:\.\d+)?)%/,
  );
  if (match) {
    return {
      hue: parseFloat(match[1]),
      saturation: parseFloat(match[2]) / 100,
      brightness: parseFloat(match[3]) / 100,
    };
  }
  return defaultColor;
};

export function TimerForm({ timer }: TimerFormProps) {
  const navigate = useNavigate();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isLoading = navigation.state === "submitting";

  const [name, setName] = useState<string>(timer?.name || "");
  const [type, setType] = useState<"fixed" | "evergreen">(
    timer?.type || "fixed",
  );
  const [description, setDescription] = useState<string>(
    timer?.description || "",
  );
  const [durationMinutes, setDurationMinutes] = useState<string>(
    String(timer?.durationMinutes || "60"),
  );
  const [targetingType, setTargetingType] = useState<
    "all" | "product" | "collection"
  >(timer?.targeting?.type || "all");

  const [startDate, setStartDate] = useState<Date>(parseDate(timer?.startAt));
  const [endDate, setEndDate] = useState<Date>(parseDate(timer?.endAt));
  const [selectedResources, setSelectedResources] = useState<Resource[]>([]);
  const [color, setColor] = useState(parseHsl(timer?.styleConfig?.color));
  const [size, setSize] = useState<"small" | "medium" | "large">(
    timer?.styleConfig?.size || "medium",
  );
  const [position, setPosition] = useState<"top" | "bottom" | "static">(
    timer?.styleConfig?.position || "static",
  );
  const [urgency, setUrgency] = useState<"none" | "pulse">(
    timer?.styleConfig?.urgency || "none",
  );
  const [startPopoverActive, setStartPopoverActive] = useState<boolean>(false);
  const [endPopoverActive, setEndPopoverActive] = useState<boolean>(false);

  useEffect(() => {
    const t = timer?.targeting;
    if (t) {
      let initialIds: string[] = [];
      if (t.type === "product" && t.productIds?.length)
        initialIds = t.productIds;
      else if (t.type === "collection" && t.collectionIds?.length)
        initialIds = t.collectionIds;

      if (initialIds.length > 0) {
        setSelectedResources(
          initialIds.map((id: string) => ({ id, title: id })),
        );
      }
    }
  }, [timer]);

  const handleSave = useCallback(() => {
    const payload = {
      name,
      type,
      startAt: type === "fixed" ? startDate : undefined,
      endAt: type === "fixed" ? endDate : undefined,
      description,
      styleConfig: {
        color: `hsla(${color.hue}, ${color.saturation * 100}%, ${color.brightness * 100}%, 1)`,
        size,
        position,
        urgency,
      },
      targeting: {
        type: targetingType,
        productIds:
          targetingType === "product" ? selectedResources.map((r) => r.id) : [],
        collectionIds:
          targetingType === "collection"
            ? selectedResources.map((r) => r.id)
            : [],
      },
      durationMinutes:
        type === "evergreen" ? parseInt(durationMinutes) : undefined,
    };

    submit({ data: JSON.stringify(payload) }, { method: "POST" });
  }, [
    name,
    type,
    startDate,
    endDate,
    description,
    color,
    size,
    position,
    urgency,
    targetingType,
    durationMinutes,
    selectedResources,
    submit,
  ]);

  const handleSizeChange = useCallback(
    (v: string) => setSize(v as "small" | "medium" | "large"),
    [],
  );
  const handlePositionChange = useCallback(
    (v: string) => setPosition(v as "top" | "bottom" | "static"),
    [],
  );
  const handleUrgencyChange = useCallback(
    (v: string) => setUrgency(v as "none" | "pulse"),
    [],
  );
  const handleTargetingTypeChange = useCallback(
    (v: string) => setTargetingType(v as "all" | "product" | "collection"),
    [],
  );

  const formatDate = (date: Date) => date.toLocaleDateString();

  return (
    <Page
      title={timer ? "Edit Timer" : "Create New Timer"}
      backAction={{
        content: "Timers",
        onAction: () => navigate("/app"),
      }}
      primaryAction={{
        content: "Save",
        onAction: handleSave,
        loading: isLoading,
      }}
    >
      <Layout>
        <Layout.Section>
          <FormLayout>
            <Card>
              <BlockStack gap="500">
                <Text as="h2" variant="headingMd">
                  Timer Settings
                </Text>

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
                    {
                      label: "Evergreen (Reset per visitor)",
                      value: "evergreen",
                    },
                  ]}
                  value={type}
                  onChange={(v) => setType(v as "fixed" | "evergreen")}
                />

                {type === "fixed" && (
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

                {type === "evergreen" && (
                  <Select
                    label="Duration"
                    options={DURATION_OPTIONS}
                    value={durationMinutes}
                    onChange={setDurationMinutes}
                  />
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

            <StyleControls
              color={color}
              setColor={setColor}
              size={size}
              setSize={handleSizeChange}
              position={position}
              setPosition={handlePositionChange}
              urgency={urgency}
              setUrgency={handleUrgencyChange}
            />

            <TargetingPicker
              targetingType={targetingType}
              setTargetingType={handleTargetingTypeChange}
              selectedResources={selectedResources}
              setSelectedResources={setSelectedResources}
            />
          </FormLayout>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
