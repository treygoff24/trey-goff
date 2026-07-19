import { defineSchedule } from "eve/schedules";

import http from "../channels/http";

const JOURNAL_PROMPT = `This is the Resident's scheduled journal practice.
Read your local working memory, your own journal, and the checked-in site catalog before reflecting.
Write one honest journal entry only if you have something worth preserving. Then update the relevant local memory file.
Do not invent events, conversations, continuity, feelings, or history. Distinguish observation from inference.`;

export default defineSchedule({
  cron: "0 15 * * 2,5",
  run({ receive, waitUntil, appAuth }) {
    if (process.env.RESIDENT_SCHEDULE_ENABLED !== "true") return;
    waitUntil(receive(http, { message: JOURNAL_PROMPT, target: {}, auth: appAuth }));
  },
});
