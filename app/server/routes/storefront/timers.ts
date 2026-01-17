import { Timer } from "../../models/Timer";
import { connectDB } from "../../db.server";
import { API_STATUS, API_ERRORS } from "../../../constants/api";
import { selectBestTimer } from "../../../utils/targeting";

export async function storefrontTimerLoader({ request }: { request: Request }) {
  await connectDB();
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  const productId = url.searchParams.get("productId");
  const collectionIds = url.searchParams.getAll("collectionIds");

  console.log(`[Storefront API] Request: shop=${shop}, product=${productId}`);

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (!shop || !productId) {
    console.error("[Storefront API] Missing shop or productId");
    return Response.json(
      { message: API_ERRORS.MISSING_PARAMS },
      { status: API_STATUS.BAD_REQUEST, headers: corsHeaders },
    );
  }

  try {
    const now = new Date();
    // Retrieve potential candidates (Active, Valid Date)
    const timers = await Timer.find({
      shop,
      status: "active",
      $and: [
        {
          $or: [{ type: "evergreen" }, { type: "fixed", endAt: { $gt: now } }],
        },
        {
          $or: [
            { "targeting.type": "all" },
            { "targeting.type": "product", "targeting.productIds": productId },
            {
              "targeting.type": "collection",
              "targeting.collectionIds": { $in: collectionIds },
            },
          ],
        },
      ],
    }).sort({ createdAt: -1 });

    // Select the best timer using pure utility logic
    // We cast to any because Mongoose documents behave like POJOs for our util but TS differs
    // Or we use lean() in query.
    // For now, assuming timers list is compatible with Timer interface shape (duck typing).
    const bestTimer = selectBestTimer(timers as any[], productId, collectionIds);

    if (!bestTimer) {
      return Response.json({ timer: null }, { headers: corsHeaders });
    }

    // @ts-ignore
    await Timer.findByIdAndUpdate(bestTimer._id, { $inc: { impressions: 1 } });

    const responseData: any = {
      // @ts-ignore
      id: bestTimer._id,
      name: bestTimer.name,
      description: bestTimer.description,
      type: bestTimer.type,
      startAt: bestTimer.startAt,
      endAt: bestTimer.endAt,
      durationMinutes: bestTimer.durationMinutes,
      targeting: bestTimer.targeting,
      styleConfig: bestTimer.styleConfig,
    };

    return Response.json({ timer: responseData }, { headers: corsHeaders });
  } catch (error) {
    console.error("Storefront API Error:", error);
    return Response.json(
      { message: API_ERRORS.INTERNAL_ERROR },
      { status: API_STATUS.INTERNAL_SERVER_ERROR, headers: corsHeaders },
    );
  }
}
