import test from "node:test";
import assert from "node:assert/strict";
import {
  getOrdinalSuffix,
  formatPolyDateParts,
  isMorningSession,
  groupExamsForOfficialTimetable,
} from "../lib/timetableFormatters.js";

test("Ordinal suffix generation", () => {
  assert.equal(getOrdinalSuffix(1), "1ST");
  assert.equal(getOrdinalSuffix(2), "2ND");
  assert.equal(getOrdinalSuffix(3), "3RD");
  assert.equal(getOrdinalSuffix(4), "4TH");
  assert.equal(getOrdinalSuffix(11), "11TH");
  assert.equal(getOrdinalSuffix(12), "12TH");
  assert.equal(getOrdinalSuffix(13), "13TH");
  assert.equal(getOrdinalSuffix(21), "21ST");
  assert.equal(getOrdinalSuffix(22), "22ND");
  assert.equal(getOrdinalSuffix(23), "23RD");
  assert.equal(getOrdinalSuffix(31), "31ST");
});

test("Date formatting to Akwa Ibom Poly format", () => {
  const parts = formatPolyDateParts("2026-09-21");
  assert.equal(parts.dayOfWeek, "MON.");
  assert.equal(parts.dateOrdinal, "21ST SEPT.,");
  assert.equal(parts.year, "2026");
  assert.equal(parts.full, "MON. 21ST SEPT., 2026");
});

test("Session classification", () => {
  assert.equal(isMorningSession("09:00"), true);
  assert.equal(isMorningSession("11:30"), true);
  assert.equal(isMorningSession("12:00"), false);
  assert.equal(isMorningSession("13:00"), false);
  assert.equal(isMorningSession("14:30"), false);
});

test("Official timetable grouping: multi-venue clustering and session alignment", () => {
  const mockExams = [
    // Morning in Auditorium (two classes sharing auditorium)
    {
      id: "e1",
      exam_date: "2026-10-30",
      start_time: "09:00",
      end_time: "12:00",
      course: "SWD 421",
      class: "SWD HND 2",
      student_count: 50,
      hall: "Auditorium",
    },
    {
      id: "e2",
      exam_date: "2026-10-30",
      start_time: "09:00",
      end_time: "12:00",
      course: "COM 112",
      class: "CSC ND 1",
      student_count: 70,
      hall: "Auditorium",
    },
    // Morning in Workshop 9
    {
      id: "e3",
      exam_date: "2026-10-30",
      start_time: "09:00",
      end_time: "12:00",
      course: "EEC 429",
      class: "EEC HND 2",
      student_count: 40,
      hall: "Workshop 9",
    },
    // Afternoon in Auditorium
    {
      id: "e4",
      exam_date: "2026-10-30",
      start_time: "13:00",
      end_time: "16:00",
      course: "STA 112",
      class: "CSC ND 1",
      student_count: 70,
      hall: "Auditorium",
    },
  ];

  const grouped = groupExamsForOfficialTimetable(mockExams);
  assert.equal(grouped.length, 1);

  const dayGroup = grouped[0];
  assert.equal(dayGroup.date, "2026-10-30");
  assert.equal(dayGroup.dateParts.dayOfWeek, "FRI.");

  // Morning has 2 venues (Auditorium, Workshop 9)
  // Afternoon has 1 venue (Auditorium)
  // totalRows should be max(2, 1) = 2
  assert.equal(dayGroup.totalRows, 2);
  assert.equal(dayGroup.rows.length, 2);

  // Row 0: Morning Auditorium (with 2 courses) + Afternoon Auditorium (with 1 course)
  const row0 = dayGroup.rows[0];
  assert.equal(row0.morningVenue.venueName, "Auditorium");
  assert.equal(row0.morningVenue.items.length, 2);
  assert.equal(row0.afternoonVenue.venueName, "Auditorium");
  assert.equal(row0.afternoonVenue.items.length, 1);

  // Row 1: Morning Workshop 9 + Afternoon is null
  const row1 = dayGroup.rows[1];
  assert.equal(row1.morningVenue.venueName, "Workshop 9");
  assert.equal(row1.afternoonVenue, null);
});
