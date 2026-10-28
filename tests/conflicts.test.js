import test from "node:test";
import assert from "node:assert/strict";
import {
  checkAllConflicts,
  checkDuplicateCourses,
  checkClassClashes,
  checkHallClashes,
  papersOverlap,
  timeToMinutes,
} from "../lib/conflicts.js";

test("Time overlap calculation", () => {
  assert.equal(timeToMinutes("08:00"), 480);
  assert.equal(timeToMinutes("10:30"), 630);

  // 8:00 - 10:00 overlaps 9:00 - 11:00
  const a = { date: "2026-10-30", start_time: "08:00", end_time: "10:00" };
  const b = { date: "2026-10-30", start_time: "09:00", end_time: "11:00" };
  assert.equal(papersOverlap(a, b), true);

  // 8:00 - 10:00 does NOT overlap 10:00 - 12:00
  const c = { date: "2026-10-30", start_time: "10:00", end_time: "12:00" };
  assert.equal(papersOverlap(a, c), false);

  // Different dates do not overlap
  const d = { date: "2026-10-31", start_time: "08:30", end_time: "10:30" };
  assert.equal(papersOverlap(a, d), false);
});

test("Case 1: No Conflict (clean schedule)", () => {
  const entries = [
    {
      id: "1",
      course: "SWD 422",
      class: "SWD HND 2",
      student_count: 40,
      hall: "Hall A",
      date: "2026-10-30",
      start_time: "08:00",
      end_time: "10:00",
    },
    {
      id: "2",
      course: "SWD 424",
      class: "SWD HND 2",
      student_count: 40,
      hall: "Hall A",
      date: "2026-10-30",
      start_time: "10:30",
      end_time: "12:30",
    },
    {
      id: "3",
      course: "COM 211",
      class: "COM ND 2",
      student_count: 50,
      hall: "Hall B",
      date: "2026-10-30",
      start_time: "08:00",
      end_time: "10:00",
    },
  ];

  const conflicts = checkAllConflicts(entries);
  assert.equal(conflicts.length, 0, "Expected 0 conflicts for clean schedule");
});

test("Case 2: Duplicate Course Check", () => {
  const entries = [
    {
      id: "1",
      course: "SWD 422",
      class: "SWD HND 2",
      student_count: 40,
      hall: "Hall A",
      date: "2026-10-30",
      start_time: "08:00",
      end_time: "10:00",
    },
    {
      id: "2",
      course: "SWD 422", // Duplicate!
      class: "SWD HND 2",
      student_count: 40,
      hall: "Hall B",
      date: "2026-11-02",
      start_time: "13:00",
      end_time: "15:00",
    },
  ];

  const duplicates = checkDuplicateCourses(entries);
  assert.equal(duplicates.length, 1);
  assert.equal(duplicates[0].type, "DUPLICATE_COURSE");
  assert.equal(duplicates[0].course, "SWD 422");
  assert.match(duplicates[0].message, /Duplicate Course: Course "SWD 422"/);
});

test("Case 3: Class Clash Check (same class, overlapping papers)", () => {
  const entries = [
    {
      id: "1",
      course: "SWD 422",
      class: "SWD HND 2",
      student_count: 40,
      hall: "Hall A",
      date: "2026-10-30",
      start_time: "08:00",
      end_time: "10:00",
    },
    {
      id: "2",
      course: "SWD 426",
      class: "SWD HND 2", // Same class, overlapping time
      student_count: 40,
      hall: "Hall B",
      date: "2026-10-30",
      start_time: "09:00",
      end_time: "11:00",
    },
  ];

  const classClashes = checkClassClashes(entries);
  assert.equal(classClashes.length, 1);
  assert.equal(classClashes[0].type, "CLASS_CLASH");
  assert.equal(classClashes[0].class, "SWD HND 2");
  assert.match(classClashes[0].message, /Class Clash: Class "SWD HND 2"/);
});

test("Case 4: Real-world Workshop 9 Hall Clash (4 classes, 203 students)", () => {
  // Recreating the real polytechnic timetable conflict specified in the guide:
  // "HND 1 SCM with 106 students, and HND 2 STA with 15, NCC with 42 and SWD with 40,
  // all in Workshop 9 at overlapping times on the same date."
  const entries = [
    {
      id: "scm-101",
      course: "SCM 311",
      class: "HND 1 SCM",
      student_count: 106,
      hall: "Workshop 9",
      date: "2026-09-30",
      start_time: "09:00",
      end_time: "12:00",
    },
    {
      id: "sta-201",
      course: "STA 411",
      class: "HND 2 STA",
      student_count: 15,
      hall: "Workshop 9",
      date: "2026-09-30",
      start_time: "09:00",
      end_time: "11:00",
    },
    {
      id: "ncc-101",
      course: "NCC 111",
      class: "NCC",
      student_count: 42,
      hall: "Workshop 9",
      date: "2026-09-30",
      start_time: "09:30",
      end_time: "11:30",
    },
    {
      id: "swd-301",
      course: "SWD 311",
      class: "SWD",
      student_count: 40,
      hall: "Workshop 9",
      date: "2026-09-30",
      start_time: "09:30",
      end_time: "12:00",
    },
  ];

  const hallClashes = checkHallClashes(entries, { maxClassesPerHall: 3 });

  // Verification as mandated by the guide:
  // "all tests pass, and the Workshop 9 test reports a hall clash with four classes and 203 students"
  assert.ok(hallClashes.length >= 1, "Expected a hall clash to be reported");
  const workshopClash = hallClashes.find((c) => c.hall === "Workshop 9");
  assert.ok(workshopClash, "Workshop 9 clash found");
  assert.equal(workshopClash.type, "HALL_CLASH");
  assert.equal(workshopClash.class_count, 4, "Expected 4 classes involved");
  assert.equal(workshopClash.total_students, 203, "Expected 203 total students (106 + 15 + 42 + 40)");
  assert.deepEqual(workshopClash.classes.sort(), ["HND 1 SCM", "HND 2 STA", "NCC", "SWD"].sort());
  assert.match(workshopClash.message, /4 classes/);
  assert.match(workshopClash.message, /203 students/);
});

test("Case 5: Hall Capacity Clash (when capacity is explicitly set)", () => {
  const entries = [
    {
      id: "1",
      course: "ACC 111",
      class: "ACC ND 1",
      student_count: 80,
      hall: "Mini Hall",
      hall_capacity: 100, // capacity is 100
      date: "2026-10-30",
      start_time: "08:00",
      end_time: "10:00",
    },
    {
      id: "2",
      course: "BFN 111",
      class: "BFN ND 1",
      student_count: 50,
      hall: "Mini Hall",
      hall_capacity: 100,
      date: "2026-10-30",
      start_time: "08:30",
      end_time: "10:30",
    },
  ];

  // 2 classes (under max 3 classes), but 80 + 50 = 130 students > 100 capacity
  const hallClashes = checkHallClashes(entries, { maxClassesPerHall: 3 });
  assert.equal(hallClashes.length, 1);
  assert.equal(hallClashes[0].type, "HALL_CLASH");
  assert.equal(hallClashes[0].total_students, 130);
  assert.match(hallClashes[0].message, /130 total students exceed the hall capacity of 100/);
});
