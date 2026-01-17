import { authenticate } from "../../shopify.server";
import { Timer } from "../../models/Timer";
import { validateTimerData } from "../../../utils/validation";
import { connectDB } from "../../db.server";

export async function getTimers(shop: string) {
  await connectDB();
  const timers = await Timer.find({ shop }).sort({ createdAt: -1 }).lean();
  console.log(`[DB] getTimers for shop: '${shop}' found ${timers.length} records.`);
  return timers;
}

export async function createTimer(shop: string, data: any) {
  await connectDB();
  const errors = validateTimerData(data);
  if (Object.keys(errors).length > 0) {
    throw { errors, status: 400 };
  }
  return await Timer.create({ ...data, shop });
}

export async function getTimer(shop: string, id: string) {
  await connectDB();
  return await Timer.findOne({ _id: id, shop }).lean();
}

export async function updateTimer(shop: string, id: string, data: any) {
  await connectDB();
  return await Timer.findOneAndUpdate(
    { _id: id, shop },
    { $set: data },
    { new: true },
  );
}

export async function deleteTimer(shop: string, id: string) {
  await connectDB();
  return await Timer.deleteOne({ _id: id, shop });
}

export async function timersLoader({ request }: { request: Request }) {
  const { session } = await authenticate.admin(request);

  const timers = await getTimers(session.shop);
  return Response.json({ timers });
}

export async function timersAction({ request }: { request: Request }) {
  const { session } = await authenticate.admin(request);

  if (request.method !== "POST") {
    return Response.json({ message: "Method not allowed" }, { status: 405 });
  }

  try {
    const data = await request.json();
    const timer = await createTimer(session.shop, data);
    return Response.json({ timer }, { status: 201 });
  } catch (error: any) {
    if (error.errors)
      return Response.json({ errors: error.errors }, { status: error.status });
    console.error("Error creating timer:", error);
    return Response.json({ message: "Error creating timer" }, { status: 500 });
  }
}

export async function timerIdLoader({
  request,
  params,
}: {
  request: Request;
  params: any;
}) {
  const { session } = await authenticate.admin(request);
  const { id } = params;

  if (!id) return Response.json({ message: "Missing ID" }, { status: 400 });

  const timer = await getTimer(session.shop, id);
  if (!timer) return Response.json({ message: "Not found" }, { status: 404 });

  return Response.json({ timer });
}

export async function timerIdAction({
  request,
  params,
}: {
  request: Request;
  params: any;
}) {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const { id } = params;

  if (!id) return Response.json({ message: "Missing ID" }, { status: 400 });

  try {
    if (request.method === "PUT") {
      const data = await request.json();
      const updated = await updateTimer(shop, id, data);
      return Response.json({ timer: updated });
    }

    if (request.method === "DELETE") {
      await deleteTimer(shop, id);
      return Response.json({ success: true });
    }

    return Response.json({ message: "Method not allowed" }, { status: 405 });
  } catch (error) {
    console.error(`Error processing request ${request.method}:`, error);
    return Response.json({ message: "Server error" }, { status: 500 });
  }
}


