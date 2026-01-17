import { useLoaderData, useNavigate, useActionData } from "react-router";
import { useEffect } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../server/shopify.server";
import {
  getTimer,
  createTimer,
  updateTimer,
} from "../server/routes/admin/timers";
import { TimerForm } from "../components/TimerForm";

export const loader = async ({ request, params }: any) => {
  const { session } = await authenticate.admin(request);
  const { shop } = session;

  if (params.id === "new") {
    return { timer: null };
  }

  try {
    const timer = await getTimer(shop, params.id);
    if (!timer) {
      return { timer: null };
    }
    return { timer };
  } catch (error) {
    console.error("Loader Error:", error);
    throw new Error("Failed to fetch timer");
  }
};

export const action = async ({ request, params }: any) => {
  const { session } = await authenticate.admin(request);
  const { shop } = session;
  const formData = await request.formData();
  const data = JSON.parse(formData.get("data") as string);

  try {
    if (params.id === "new") {
      await createTimer(shop, data);
    } else {
      await updateTimer(shop, params.id, data);
    }

    return { success: true };
  } catch (error: any) {
    console.error("Timer Save Error:", error);
    let message = "An error occurred while saving.";

    if (error.errors) {
      const errs = error.errors;
      message =
        typeof errs === "object"
          ? Object.values(errs).join(", ")
          : String(errs);
    } else if (error.message) {
      message = error.message;
    }

    return { error: message, success: false };
  }
};

export default function TimerRoute() {
  const { timer } = useLoaderData<any>();
  const actionData = useActionData<typeof action>();
  const shopify = useAppBridge();
  const navigate = useNavigate();

  useEffect(() => {
    if (actionData?.error) {
      shopify.toast.show(actionData.error, { isError: true });
    }
    if (actionData?.success) {
      shopify.toast.show("Timer saved successfully");
      navigate("/app");
    }
  }, [actionData, shopify, navigate]);

  return <TimerForm timer={timer} key={timer?._id || "new"} />;
}
