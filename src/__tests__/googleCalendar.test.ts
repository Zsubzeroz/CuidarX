import { describe, it, expect } from "vitest";
import { buildEventTimeRange } from "../services/googleCalendar";

describe("buildEventTimeRange", () => {
  it("adds 60 minutes as exactly 1 hour", () => {
    const { start, end } = buildEventTimeRange("2026-08-01", "10:00", 60);
    expect(start).toBe("2026-08-01T10:00:00-03:00");
    expect(end).toBe("2026-08-01T11:00:00-03:00");
  });

  it("adds 45 minutes", () => {
    const { start, end } = buildEventTimeRange("2026-08-01", "09:30", 45);
    expect(start).toBe("2026-08-01T09:30:00-03:00");
    expect(end).toBe("2026-08-01T10:15:00-03:00");
  });

  it("produces exactly 60 minutes of real duration for a 60-minute service", () => {
    const { start, end } = buildEventTimeRange("2026-08-01", "10:00", 60);
    const durationMs =
      Date.parse(end.replace("-03:00", "Z")) - Date.parse(start.replace("-03:00", "Z"));
    expect(durationMs).toBe(60 * 60 * 1000);
  });

  it("is independent of the browser timezone (fixed -03:00 offset)", () => {
    const { start, end } = buildEventTimeRange("2026-08-01", "10:00", 60);
    expect(start).toBe("2026-08-01T10:00:00-03:00");
    expect(end).toBe("2026-08-01T11:00:00-03:00");
  });

  it("handles rolling over into the next hour", () => {
    const { start, end } = buildEventTimeRange("2026-08-01", "19:30", 60);
    expect(start).toBe("2026-08-01T19:30:00-03:00");
    expect(end).toBe("2026-08-01T20:30:00-03:00");
  });
});
