import { Queue } from "bullmq";
import { redis } from "@/lib/redis";

export const SCHEDULE_QUEUE_NAME = "msgmate-schedules";

export type ScheduleDueJob = {
  scheduledMessageId: string;
};

let scheduleQueue: Queue<ScheduleDueJob> | undefined;

function getScheduleQueue() {
  scheduleQueue ??= new Queue<ScheduleDueJob>(SCHEDULE_QUEUE_NAME, {
    connection: redis
  });

  return scheduleQueue;
}

export async function enqueueSchedule(scheduledMessageId: string, sendAt: Date) {
  const delay = Math.max(sendAt.getTime() - Date.now(), 0);

  await getScheduleQueue().add(
    "message-due",
    { scheduledMessageId },
    {
      jobId: scheduledMessageId,
      delay,
      removeOnComplete: true,
      removeOnFail: 1000,
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 5000
      }
    }
  );
}

export async function cancelQueuedSchedule(scheduledMessageId: string) {
  const job = await getScheduleQueue().getJob(scheduledMessageId);
  await job?.remove();
}
