import { authenticate } from "../../shopify.server";
import { Timer } from "../../models/Timer";

// --- VALIDATION HELPERS ---

function validateTimerData(data: any) {
    const errors: any = {};
    if (!data.name) errors.name = "Timer name is required";
    if (!data.type) errors.type = "Type is required";
    // if (!data.targeting) errors.targeting = "Targeting is required";
    if (data.type === "fixed" && !data.endAt) errors.endAt = "End date is required for fixed timers";
    return errors;
}

// --- LIST & CREATE ( /api/admin/timers ) ---

export async function timersLoader({ request }: { request: Request }) {
    const { session } = await authenticate.admin(request);
    const shop = session.shop;

    const timers = await Timer.find({ shop }).sort({ createdAt: -1 });
    return Response.json({ timers });
}

export async function timersAction({ request }: { request: Request }) {
    const { session } = await authenticate.admin(request);
    const shop = session.shop;

    if (request.method !== "POST") {
        return Response.json({ message: "Method not allowed" }, { status: 405 });
    }

    try {
        const data = await request.json();

        // Basic validation
        const errors = validateTimerData(data);
        if (Object.keys(errors).length > 0) {
            return Response.json({ errors }, { status: 400 });
        }

        const timer = await Timer.create({ ...data, shop });
        return Response.json({ timer }, { status: 201 });
    } catch (error) {
        console.error("Error creating timer:", error);
        return Response.json({ message: "Error creating timer" }, { status: 500 });
    }
}

// --- SINGLE ITEM ( /api/admin/timers/:id ) ---

export async function timerIdLoader({ request, params }: { request: Request; params: any }) {
    const { session } = await authenticate.admin(request);
    const shop = session.shop;
    const { id } = params;

    if (!id) return Response.json({ message: "Missing ID" }, { status: 400 });

    const timer = await Timer.findOne({ _id: id, shop });
    if (!timer) return Response.json({ message: "Not found" }, { status: 404 });

    return Response.json({ timer });
}

export async function timerIdAction({ request, params }: { request: Request; params: any }) {
    const { session } = await authenticate.admin(request);
    const shop = session.shop;
    const { id } = params;

    if (!id) return Response.json({ message: "Missing ID" }, { status: 400 });

    try {
        if (request.method === "PUT") {
            const data = await request.json();
            const updated = await Timer.findOneAndUpdate(
                { _id: id, shop },
                { $set: data },
                { new: true }
            );
            return Response.json({ timer: updated });
        }

        if (request.method === "DELETE") {
            await Timer.deleteOne({ _id: id, shop });
            return Response.json({ success: true });
        }

        return Response.json({ message: "Method not allowed" }, { status: 405 });
    } catch (error) {
        console.error(`Error processing request ${request.method}:`, error);
        return Response.json({ message: "Server error" }, { status: 500 });
    }
}
