import { z } from "zod";

const formBoolean = z
  .union([z.boolean(), z.enum(["true", "false"])])
  .transform((value) => (typeof value === "boolean" ? value : value === "true"));

export const studySchema = z
  .object({
    eventName: z.string().trim().min(3, "Informe o nome do evento."),
    city: z.string().trim().min(2, "Informe a cidade."),
    state: z.string().trim().min(2, "Informe o estado."),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    eventType: z.string().trim().min(2, "Informe o tipo de evento."),
    eventSize: z.enum(["SMALL", "MEDIUM", "LARGE"]),
    expectedAudience: z.coerce.number().int().positive("Informe uma estimativa positiva."),
    notes: z.string().trim().max(2000).optional().or(z.literal("")),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "A data final deve ser igual ou posterior a data inicial.",
    path: ["endDate"],
  });

export const smallEventResponseSchema = z.object({
  isLocalResident: formBoolean,
  originCity: z.string().trim().min(2, "Informe a cidade de origem."),
  cameSpecificallyForEvent: formBoolean,
  groupSize: z.coerce.number().int().min(1).max(100),
  foodSpend: z.coerce.number().min(0).max(100000),
  transportSpend: z.coerce.number().min(0).max(100000),
    shoppingSpend: z.coerce.number().min(0).max(100000),
    lodgingSpend: z.coerce.number().min(0).max(100000),
    otherSpend: z.coerce.number().min(0).max(100000),
    stayedOvernight: formBoolean,
    averageStayDays: z.coerce.number().min(0).max(365),
  spendingScope: z.enum(["INDIVIDUAL", "GROUP"]),
  rating: z.coerce.number().int().min(1).max(5),
});

export type StudyInput = z.infer<typeof studySchema>;
export type SmallEventResponseInput = z.infer<typeof smallEventResponseSchema>;
