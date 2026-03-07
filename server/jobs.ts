/**
 * Scheduled jobs (cron). Isolated module for all background job logic.
 */
import cron from "node-cron";
import * as db from "./db";

/** Run at 2:00 AM every day: mark as completed any appointment that is still
 * "scheduled" and whose appointmentDate has already passed (not cancelled).
 * Exported so it can be run manually from the terminal. */
export async function completePastAppointments() {
  try {
    const now = new Date();
    const past = await db.getScheduledAppointmentsBefore(now);
    for (const apt of past) {
      await db.markAppointmentCompleted(apt.id);
      if (apt.type === "trial") {
        await db.markUserTrialClassUsed(apt.userId);
      }
    }
    if (past.length > 0) {
      console.log(`[jobs] completePastAppointments: marked ${past.length} appointment(s) as completed`);
    } else {
      console.log("[jobs] completePastAppointments: no past scheduled appointments to complete");
    }
  } catch (err) {
    console.error("[jobs] completePastAppointments failed:", err);
    throw err;
  }
}

/** Schedules all recurring jobs. Call once when the server starts. */
export function startJobs() {
  // Every day at 2:00 AM
  cron.schedule("0 2 * * *", () => {
    completePastAppointments();
  });
  console.log("[jobs] Scheduled: completePastAppointments at 2:00 AM daily");
}
