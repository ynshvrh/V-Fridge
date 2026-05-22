import { z } from "zod";


export const signUpSchema = z.object({
  email: z.string().email("Invalid email format"),
  // Display name: optional; the server falls back to the email prefix when empty.
  username: z.string().max(50, "Display name is too long").optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});


export const productSchema = z.object({
 name: z.string().min(2, "Name is too short"),
  quantity: z.number().positive("Quantity must be greater than 0"),
  unit: z.string(),
  expiryDate: z.string().refine((val) => {
    if (!val) return true;
    const date = new Date(val);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  }, {
    message: "Product is already expired or the date is invalid"
  }),
  ownerId: z.string()
});


export const updateProductSchema = productSchema.partial().extend({
  id: z.coerce.number(),
});


export const chatSchema = z.object({
  content: z.string().min(1, "Message cannot be empty"),
});
export const updateSettingsSchema = z.object({
  username: z.string().min(3).max(50).optional(),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type ProductInput = z.infer<typeof productSchema>;
