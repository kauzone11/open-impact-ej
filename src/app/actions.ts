"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { smallEventResponseSchema, studySchema } from "@/methodology/small-events/schema";

function readFormData(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

export async function createStudy(formData: FormData) {
  const parsed = studySchema.safeParse(readFormData(formData));

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Dados invalidos.");
  }

  const study = await prisma.study.create({
    data: {
      ...parsed.data,
      notes: parsed.data.notes || null,
    },
  });

  revalidatePath("/");
  redirect(`/studies/${study.id}/questionnaire`);
}

export async function createSurveyResponse(studyId: string, formData: FormData) {
  const parsed = smallEventResponseSchema.safeParse(readFormData(formData));

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Resposta invalida.");
  }

  await prisma.surveyResponse.create({
    data: {
      studyId,
      ...parsed.data,
    },
  });

  revalidatePath(`/studies/${studyId}/results`);
  redirect(`/studies/${studyId}/results`);
}
