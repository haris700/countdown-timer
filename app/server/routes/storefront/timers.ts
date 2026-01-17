import { Timer } from "../../models/Timer";
import { connectDB } from "../../db.server";

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
      { message: "Missing shop or productId" },
      { status: 400, headers: corsHeaders },
    );
  }

  try {
    const now = new Date();
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

    let bestTimer = null;
    let maxPriority = 0;

    for (const timer of timers) {
      let priority = 0;
      const t = timer.targeting;

      if (t.type === "product" && t.productIds?.includes(productId)) {
        priority = 3;
      } else if (
        t.type === "collection" &&
        t.collectionIds?.some((c: string) => collectionIds.includes(c))
      ) {
        priority = 2;
      } else if (t.type === "all") {
        priority = 1;
      }

      if (priority > maxPriority) {
        if (
          timer.type === "fixed" &&
          timer.startAt &&
          new Date(timer.startAt) > now
        )
          continue;
        maxPriority = priority;
        bestTimer = timer;
      }
    }

    if (!bestTimer) {
      return Response.json({ timer: null }, { headers: corsHeaders });
    }

    await Timer.findByIdAndUpdate(bestTimer._id, { $inc: { impressions: 1 } });

    const responseData: any = {
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
      { message: "Internal Error" },
      { status: 500, headers: corsHeaders },
    );
  }
}
