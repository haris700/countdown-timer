import { Timer } from "../../models/Timer";

// --- STOREFRONT LOADER ( /api/storefront/timer ) ---
import { connectDB } from "../../db.server"; // Import connectDB

export async function storefrontTimerLoader({ request }: { request: Request }) {
    await connectDB(); // Ensure DB Connected
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
        return Response.json({ message: "Missing shop or productId" }, { status: 400, headers: corsHeaders });
    }

    try {
        // 1. Fetch Candidates
        const now = new Date();
        const timers = await Timer.find({
            shop,
            status: "active",
            $or: [
                { type: "evergreen" },
                { type: "fixed", endAt: { $gt: now } }
            ]
        }).sort({ createdAt: -1 });

        // 2. Resolve Priority
        let bestTimer = null;
        let maxPriority = 0;

        for (const timer of timers) {
            let priority = 0;
            const t = timer.targeting;

            // Check Product Match
            if (t.type === "product" && t.productIds?.includes(productId)) {
                priority = 3;
            }
            // Check Collection Match
            else if (t.type === "collection" && t.collectionIds?.some((c: string) => collectionIds.includes(c))) {
                priority = 2;
            }
            // Check All Match
            else if (t.type === "all") {
                priority = 1;
            }

            if (priority > maxPriority) {
                if (timer.type === "fixed" && timer.startAt && new Date(timer.startAt) > now) continue;
                maxPriority = priority;
                bestTimer = timer;
            }
        }

        if (!bestTimer) {
            return Response.json({ timer: null }, { headers: corsHeaders });
        }

        // 3. Analytics (Fire and forget, or await)
        await Timer.findByIdAndUpdate(bestTimer._id, { $inc: { impressions: 1 } });

        // 4. Transform response
        const responseData: any = {
            id: bestTimer._id,
            name: bestTimer.name, // Added
            description: bestTimer.description, // Added
            type: bestTimer.type,
            startAt: bestTimer.startAt,
            endAt: bestTimer.endAt,
            durationMinutes: bestTimer.durationMinutes,
            targeting: bestTimer.targeting,
            styleConfig: bestTimer.styleConfig // Added
        };

        return Response.json({ timer: responseData }, { headers: corsHeaders });

    } catch (error) {
        console.error("Storefront API Error:", error);
        return Response.json({ message: "Internal Error" }, { status: 500, headers: corsHeaders });
    }
}
