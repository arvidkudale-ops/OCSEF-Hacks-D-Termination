import { Schema, model, InferSchemaType } from "mongoose";

export const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

export type User = InferSchemaType<typeof userSchema>;

export const UserModel = model<User>("User", userSchema);