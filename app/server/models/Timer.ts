import mongoose from "mongoose";

const TimerSchema = new mongoose.Schema({
    shop: { type: String, required: true, index: true },
    name: { type: String, required: true },
    type: {
        type: String,
        enum: ["fixed", "evergreen"],
        required: true
    },
    startAt: { type: Date },
    endAt: { type: Date },
    durationMinutes: { type: Number },
    description: { type: String },
    styleConfig: {
        color: { type: String, default: "#000000" },
        size: { type: String, enum: ["small", "medium", "large"], default: "medium" },
        position: { type: String, enum: ["top", "bottom", "static"], default: "static" },
        urgency: { type: String, default: "none" }
    },
    targeting: {
        type: {
            type: String,
            enum: ["all", "product", "collection"],
            required: true
        },
        productIds: { type: [String], default: [] },
        collectionIds: { type: [String], default: [] }
    },
    impressions: { type: Number, default: 0 },
    status: {
        type: String,
        enum: ["active", "scheduled", "expired"],
        default: "active"
    },
}, { timestamps: true });

TimerSchema.index({ shop: 1, "targeting.type": 1 });
TimerSchema.index({ shop: 1, status: 1 });

export const Timer = mongoose.models.Timer || mongoose.model("Timer", TimerSchema);
