import { useLoaderData, useNavigation, useNavigate } from "react-router";
import { useEffect } from "react";
import { authenticate } from "../server/shopify.server";
import { TimerForm } from "../components/TimerForm";
import {
  getTimer,
  createTimer,
  updateTimer,
} from "../server/routes/admin/timers";

export const loader = async ({ request, params }: any) => {
  const { session } = await authenticate.admin(request);

  if (params.id === "new") {
    return { timer: null };
  }

  const timer = await getTimer(session.shop, params.id);

  return { timer: JSON.parse(JSON.stringify(timer)) };
};

export const action = async ({ request, params }: any) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const data = JSON.parse(formData.get("data"));

  if (params.id === "new") {
    await createTimer(session.shop, data);
  } else {
    await updateTimer(session.shop, params.id, data);
  }

  return { success: true };
};

export default function TimerRoute() {
  const { timer } = useLoaderData<any>();
  const navigation = useNavigation();
  const navigate = useNavigate();

  useEffect(() => {
    if (navigation.state === "idle" && navigation.formMethod === "POST") {
      navigate("/app/timers");
    }
  }, [navigation.state, navigation.formMethod, navigate]);

  return <TimerForm timer={timer} />;
}
