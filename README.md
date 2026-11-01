# Sprint 6.5

A 21-day IELTS Academic study planner for learners starting around China's CET-4 level. The static site is written in dependency-free HTML, CSS, and ES modules.

Features include four actionable daily tasks, a 21-day calendar, check-ins and progress, daily notes, a focus timer, mock-score records and trend chart, adaptive study focus, JSON backup import/export, and a speaking practice page that prepares a prompt for a one-question-at-a-time ChatGPT dialogue.

Study records stay in this browser's localStorage under `sprint65:v1`; there is no cloud synchronization or analytics. Speaking audio is handled by ChatGPT Voice and is not recorded by this site. All score records start empty. Writing and speaking marks are entered by the learner, not auto-assessed.

The default daily budget is 480 minutes (8 hours), initially two hours per skill. Mock checkpoints are days 7, 14, and 18. The final three days focus on review. Existing v1 browser records migrate to the eight-hour preset while preserving completions and scores; old day 22–30 backup entries remain valid but are outside the 21-day progress total.

Run `npm test` for scoring, daily allocations, date boundaries, checkpoints, snapshots, migration, and backup validation. Serve `dist/` through a static server for development.

The planner uses a transparent recommendation rule based on the latest three entered scores (60/30/10, normalized when fewer are available). Updates require the learner to apply the recommendation. A 21-day sprint cannot guarantee a score increase; CET-4 scores are not converted into IELTS scores. Official resource links are included in Settings.
