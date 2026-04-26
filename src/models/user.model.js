import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

const ALLOWED_ROLES = ["user", "admin"];

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    roles: {
      type: [String],
      default: ["user"],
      validate: {
        validator(roles) {
          return (
            Array.isArray(roles) &&
            roles.length > 0 &&
            roles.every((r) => ALLOWED_ROLES.includes(r))
          );
        },
        message: `roles must be non-empty and only include: ${ALLOWED_ROLES.join(", ")}`,
      },
    },
    refreshTokenHash: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function hashPasswordIfModified() {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
});

userSchema.methods.comparePassword = async function comparePassword(
  candidate
) {
  return bcrypt.compare(candidate, this.password);
};

export const User = mongoose.model("User", userSchema);
export { ALLOWED_ROLES };
