import mongoose, { Schema, Document } from "mongoose";

export interface TimerDocument extends Document {
  shop: string;

  name: string;
  type: "fixed" | "evergreen";

  startAt?: Date;
  endAt?: Date;

  durationMinutes?: number;

  targeting: {
    type: "all" | "product" | "collection";
    productIds?: string[];
    collectionIds?: string[];
  };

  impressions: number;
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const TimerSchema = new Schema<TimerDocument>(
  {
    shop: {
      type: String,
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      enum: ["fixed", "evergreen"],
      required: true,
    },

    startAt: {
      type: Date,
    },

    endAt: {
      type: Date,
    },

    durationMinutes: {
      type: Number,
    },

    targeting: {
      type: {
        type: String,
        enum: ["all", "product", "collection"],
        required: true,
      },
      productIds: {
        type: [String],
        default: [],
      },
      collectionIds: {
        type: [String],
        default: [],
      },
    },

    impressions: {
      type: Number,
      default: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.models.Timer ||
  mongoose.model<TimerDocument>("Timer", TimerSchema);
