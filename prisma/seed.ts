import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.surveyResponse.deleteMany();
  await prisma.study.deleteMany();

  await prisma.study.create({
    data: {
      eventName: "Feira Universitaria Ficticia",
      city: "Fortaleza",
      state: "CE",
      startDate: new Date("2026-06-10T00:00:00.000Z"),
      endDate: new Date("2026-06-11T00:00:00.000Z"),
      eventType: "evento universitario",
      eventSize: "SMALL",
      expectedAudience: 500,
      notes: "Seed com dados ficticios para demonstracao local.",
      responses: {
        create: [
          {
            isLocalResident: true,
            originCity: "Fortaleza",
            cameSpecificallyForEvent: true,
            groupSize: 1,
            spendingScope: "INDIVIDUAL",
            foodSpend: 45,
            transportSpend: 15,
            shoppingSpend: 30,
            lodgingSpend: 0,
            otherSpend: 10,
            stayedOvernight: false,
            averageStayDays: 1,
            rating: 5,
          },
          {
            isLocalResident: false,
            originCity: "Recife",
            cameSpecificallyForEvent: true,
            groupSize: 2,
            spendingScope: "GROUP",
            foodSpend: 180,
            transportSpend: 120,
            shoppingSpend: 90,
            lodgingSpend: 240,
            otherSpend: 40,
            stayedOvernight: true,
            averageStayDays: 2,
            rating: 4,
          },
          {
            isLocalResident: false,
            originCity: "Sobral",
            cameSpecificallyForEvent: false,
            groupSize: 1,
            spendingScope: "INDIVIDUAL",
            foodSpend: 60,
            transportSpend: 40,
            shoppingSpend: 25,
            lodgingSpend: 0,
            otherSpend: 0,
            stayedOvernight: false,
            averageStayDays: 1,
            rating: 4,
          },
        ],
      },
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
