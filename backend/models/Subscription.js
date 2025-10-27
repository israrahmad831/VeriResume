import mongoose from "mongoose";

const SubscriptionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    plan: { type: String, enum: ["Basic", "Premium"], default: "Basic" },
    amount: { type: Number },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed"],
      default: "Pending",
    },
    validFrom: { type: Date },
    validUntil: { type: Date },
    transactionId: { type: String },
  },
  { timestamps: true }
);

const Subscription = mongoose.model("Subscription", SubscriptionSchema);
export default Subscription;
