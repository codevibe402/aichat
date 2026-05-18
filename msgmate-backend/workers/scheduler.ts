import { Worker } from "bullmq";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { SCHEDULE_QUEUE_NAME, type ScheduleDueJob } from "@/lib/queues/schedules";

const worker = new Worker<ScheduleDueJob>(
  SCHEDULE_QUEUE_NAME,
  async (job) => {
    const { scheduledMessageId } = job.data;

    const message = await prisma.scheduledMessage.findUnique({
      where: { id: scheduledMessageId }
    });

    if (!message || message.status !== "PENDING") {
      return;
    }

    await prisma.scheduledMessage.update({
      where: { id: scheduledMessageId },
      data: {
        status: "DUE",
        attempts: {
          increment: 1
        }
      }
    });
  },
  {
    connection: redis,
    concurrency: 10
  }
);

worker.on("completed", (job) => {
  console.log(`[scheduler] completed ${job.id}`);
});

worker.on("failed", (job, error) => {
  console.error(`[scheduler] failed ${job?.id}:`, error);
});

process.on("SIGINT", async () => {
  await worker.close();
  await redis.quit();
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await worker.close();
  await redis.quit();
  await prisma.$disconnect();
  process.exit(0);
});
