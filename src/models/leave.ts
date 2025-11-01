import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const leaveSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["annual", "sick", "unpaid", "other"], required: true, default: "annual" },
    from: { type: Date, required: true },
    to: { type: Date, required: true },
    days: { type: Number, required: true, min: 0 },
    reason: { type: String, required: false },
    status: { type: String, enum: ["pending", "approved", "denied"], required: true, default: "pending" },
    decidedBy: { type: Schema.Types.ObjectId, ref: "User", required: false },
    decidedAt: { type: Date, required: false },
    decisionNote: { type: String, required: false },
  },
  { timestamps: true }
);

export type LeaveDocument = InferSchemaType<typeof leaveSchema>;

export const Leave: Model<LeaveDocument> = (
  (models.Leave as unknown) || (model("Leave", leaveSchema) as unknown)
) as Model<LeaveDocument>;
