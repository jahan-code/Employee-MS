import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

export type UserRole = "employee" | "hr";

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["employee", "hr"],
      required: true,
      default: "employee",
    },
    emailVerified: {
      type: Boolean,
      required: true,
      default: false,
    },
    leaveQuotaAnnual: {
      type: Number,
      required: true,
      default: 20,
      min: 0,
    },
    leaveQuotaSick: {
      type: Number,
      required: true,
      default: 10,
      min: 0,
    },
    passkeyVerified: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export type UserDocument = InferSchemaType<typeof userSchema>;

export const User: Model<UserDocument> = (
  (models.User as unknown) || (model("User", userSchema) as unknown)
) as Model<UserDocument>;
