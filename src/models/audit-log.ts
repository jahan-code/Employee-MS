import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const auditLogSchema = new Schema(
  {
    actor: { type: Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true },
    entityType: { type: String, required: true },
    entityId: { type: String, required: true },
    changes: { type: Schema.Types.Mixed, required: true },
    reason: { type: String, required: false },
  },
  { timestamps: true }
);

export type AuditLogDocument = InferSchemaType<typeof auditLogSchema>;

export const AuditLog: Model<AuditLogDocument> = (
  (models.AuditLog as unknown) || (model("AuditLog", auditLogSchema) as unknown)
) as Model<AuditLogDocument>;
