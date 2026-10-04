import type { Memory } from "@/types";

/**
 * Realistic mock memories for UI development.
 * Replace with API calls in Phase 6.
 */
export const mockMemories: Memory[] = [
  {
    _id: "1",
    title: "Q4 team sync — roadmap and priorities",
    transcript:
      "Hey, so we had our team sync today and there's a lot to unpack. Sarah mentioned we need to finalize the Q4 roadmap by October 15th. Marcus is going to take the lead on the new design review process and Priya will handle the stakeholder presentation on the 20th. Action items: I need to send the revised roadmap doc to the whole team, Marcus should schedule the first design review, and we all need to update our sprint boards before end of week.",
    summary:
      "Team sync covered Q4 roadmap finalization, design review process, and the upcoming stakeholder presentation. Three action items assigned.",
    tasks: [
      "Send revised Q4 roadmap to the team",
      "Schedule the first design review (Marcus)",
      "Update sprint boards before end of week",
    ],
    dates: ["Oct 15 — Q4 roadmap deadline", "Oct 20 — Stakeholder presentation"],
    people: ["Sarah", "Marcus", "Priya"],
    topics: ["Q4 roadmap", "Design review", "Sprint planning"],
    audioFileName: "team-sync-oct3.webm",
    createdAt: new Date("2026-10-03T14:32:00"),
    updatedAt: new Date("2026-10-03T14:32:00"),
  },
  {
    _id: "2",
    title: "Grocery run and weekend errands",
    transcript:
      "Need to pick up a few things this weekend. Milk, eggs, coffee beans — the good ones from that shop on Elm Street. Also need to drop off the dry cleaning before Saturday because I need that jacket for the dinner on Sunday. Oh and call mom, she mentioned her birthday dinner is being moved to November 5th.",
    summary:
      "Weekend grocery list and errands reminder, including dry cleaning pickup and mom's rescheduled birthday dinner.",
    tasks: [
      "Buy milk, eggs, and coffee beans",
      "Drop off dry cleaning before Saturday",
      "Call mom about birthday dinner",
    ],
    dates: ["Sunday — dinner", "Nov 5 — Mom's birthday dinner"],
    people: ["Mom"],
    topics: ["Groceries", "Errands", "Family"],
    audioFileName: "weekend-errands.m4a",
    createdAt: new Date("2026-10-02T09:10:00"),
    updatedAt: new Date("2026-10-02T09:10:00"),
  },
  {
    _id: "3",
    title: "Book ideas and reading list",
    transcript:
      "Thinking about the next few books I want to read. Someone recommended Atomic Habits — haven't read it yet. Also Deep Work by Cal Newport, and that new one about systems thinking that Tom mentioned at the meetup. Want to set a goal of one book per month. Maybe start a reading journal to track takeaways.",
    summary:
      "Personal reading list with three book recommendations and a goal to read one book per month with a reflection journal.",
    tasks: [
      "Get Atomic Habits",
      "Get Deep Work by Cal Newport",
      "Find the systems thinking book Tom mentioned",
      "Start a reading journal",
    ],
    dates: [],
    people: ["Tom"],
    topics: ["Books", "Learning", "Personal goals"],
    audioFileName: "reading-list.webm",
    createdAt: new Date("2026-10-01T20:45:00"),
    updatedAt: new Date("2026-10-01T20:45:00"),
  },
  {
    _id: "4",
    title: "App idea — local recipe organizer",
    transcript:
      "Had an idea for a small app. Something to scan physical recipe cards and store them digitally. My grandma has hundreds of handwritten recipes and it would be great to preserve them. Use OCR to read the handwriting, tag by ingredient and cuisine type, and allow simple search. Could be a weekend project in React Native maybe. Show it to her when I visit in December.",
    summary:
      "App idea for digitizing handwritten recipe cards using OCR, tagged by ingredient and cuisine, built as a React Native weekend project.",
    tasks: [
      "Research OCR libraries for React Native",
      "Sketch out the app wireframe",
      "Show grandma the prototype in December",
    ],
    dates: ["December — grandma visit"],
    people: ["Grandma"],
    topics: ["App idea", "React Native", "OCR", "Family"],
    audioFileName: "recipe-app-idea.webm",
    createdAt: new Date("2026-09-29T16:20:00"),
    updatedAt: new Date("2026-09-29T16:20:00"),
  },
];

/** Format a Date or ISO date string to a readable short string */
export function formatMemoryDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}
