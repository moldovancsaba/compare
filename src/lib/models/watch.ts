import { Schema, model, models } from "mongoose";

const watchSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    brand: { type: String, required: true },
    model: { type: String, required: true },
    reference: { type: String, required: true },
    slug: { type: String, required: true },
    productUrl: { type: String, required: true },
    msrpUsd: { type: Number, required: true }
  },
  {
    collection: "watches"
  }
);

export const WatchModel = models.Watch || model("Watch", watchSchema);
