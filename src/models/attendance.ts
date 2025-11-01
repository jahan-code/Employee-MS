import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const attendanceSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    checkIn: {
      type: Date,
      required: true,
    },
    checkOut: {
      type: Date,
      default: null,
    },
    activeSince: {
      type: Date,
      default: null,
    },
    durationMinutes: {
      type: Number,
      default: null,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

attendanceSchema.index({ user: 1, createdAt: -1 });

export type AttendanceDocument = InferSchemaType<typeof attendanceSchema>;

export const Attendance: Model<AttendanceDocument> = (
  (models.Attendance as unknown) || (model("Attendance", attendanceSchema) as unknown)
) as Model<AttendanceDocument>;
