/**
 * Examination Timetable Conflict Detection Engine
 * Akwa Ibom State Polytechnic, Ikot Osurua
 * 
 * Implements 3 core conflict checks:
 * 1. Class Clash: One class has two papers overlapping in time on the same date.
 * 2. Hall Clash: Overlapping papers in a hall exceed allowed classes (default 3) or hall capacity.
 * 3. Duplicate Course: The same course appears more than once in the timetable.
 * 
 * Rules:
 * - Pure functions with NO database calls (fully testable alone).
 * - Two papers overlap when one starts before the other ends:
 *     (startA < endB) and (startB < endA)
 * - Plain-English explanations describing what is wrong and how to fix it.
 */

/**
 * Converts "HH:mm" or "HH:mm:ss" string to minutes from midnight
 * @param {string} timeStr
 * @returns {number}
 */
export function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const parts = String(timeStr).split(":");
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  return hours * 60 + minutes;
}

/**
 * Checks whether two time windows on the same date overlap
 * A paper running 8:00 to 10:00 overlaps a paper that starts at 9:00.
 * A paper ending at 10:00 does NOT overlap a paper starting at 10:00.
 */
export function papersOverlap(entryA, entryB) {
  if (!entryA || !entryB) return false;
  if (entryA.date !== entryB.date) return false;

  const startA = timeToMinutes(entryA.start_time);
  const endA = timeToMinutes(entryA.end_time);
  const startB = timeToMinutes(entryB.start_time);
  const endB = timeToMinutes(entryB.end_time);

  return startA < endB && startB < endA;
}

/**
 * Extracts a normalized course identifier/code from an entry
 */
export function getCourseCode(entry) {
  if (!entry) return "";
  if (typeof entry.course === "string") return entry.course;
  if (entry.course?.code) return entry.course.code;
  if (entry.course_code) return entry.course_code;
  return entry.course_id || "";
}

/**
 * Extracts a normalized course title from an entry
 */
export function getCourseTitle(entry) {
  if (!entry) return "";
  if (entry.course?.title) return entry.course.title;
  if (entry.course_title) return entry.course_title;
  return getCourseCode(entry);
}

/**
 * Extracts a normalized class name/identifier from an entry
 */
export function getClassName(entry) {
  if (!entry) return "";
  if (typeof entry.class === "string") return entry.class;
  if (entry.class?.name) return entry.class.name;
  if (entry.class_name) return entry.class_name;
  return entry.class_id || "Unknown Class";
}

/**
 * Extracts a normalized hall name from an entry
 */
export function getHallName(entry) {
  if (!entry) return "";
  if (typeof entry.hall === "string") return entry.hall;
  if (entry.hall?.name) return entry.hall.name;
  if (entry.hall_name) return entry.hall_name;
  return entry.hall_id || "Unknown Hall";
}

/**
 * Extracts student count from an entry
 */
export function getStudentCount(entry) {
  if (!entry) return 0;
  const count = entry.student_count ?? entry.class?.student_count ?? entry.students ?? 0;
  const parsed = parseInt(count, 10);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Extracts hall capacity from an entry or hall object
 */
export function getHallCapacity(entry) {
  if (!entry) return null;
  const cap = entry.hall_capacity ?? entry.hall?.capacity ?? entry.capacity;
  if (cap === undefined || cap === null || cap === "") return null;
  const parsed = parseInt(cap, 10);
  return isNaN(parsed) ? null : parsed;
}

/**
 * 1. Checks for Duplicate Courses
 * A course cannot appear twice in the same timetable
 */
export function checkDuplicateCourses(entries) {
  const conflicts = [];
  const courseMap = new Map();

  for (const entry of entries) {
    const code = getCourseCode(entry);
    if (!code) continue;

    if (!courseMap.has(code)) {
      courseMap.set(code, []);
    }
    courseMap.get(code).push(entry);
  }

  for (const [code, items] of courseMap.entries()) {
    if (items.length > 1) {
      const scheduleDetails = items
        .map(
          (item) =>
            `${item.date} (${item.start_time} - ${item.end_time} in ${getHallName(item)})`
        )
        .join(" and ");

      conflicts.push({
        type: "DUPLICATE_COURSE",
        course: code,
        entries: items,
        message: `Duplicate Course: Course "${code}" appears ${items.length} times in this timetable (${scheduleDetails}). A course can only appear once per timetable.`,
      });
    }
  }

  return conflicts;
}

/**
 * 2. Checks for Class Clashes
 * One class has two papers overlapping in time on the same date.
 */
export function checkClassClashes(entries) {
  const conflicts = [];

  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const a = entries[i];
      const b = entries[j];

      const classA = getClassName(a);
      const classB = getClassName(b);

      if (classA && classB && classA === classB) {
        if (papersOverlap(a, b)) {
          const courseA = getCourseCode(a);
          const courseB = getCourseCode(b);

          conflicts.push({
            type: "CLASS_CLASH",
            class: classA,
            date: a.date,
            entries: [a, b],
            message: `Class Clash: Class "${classA}" has two exam papers overlapping on ${a.date}: "${courseA}" (${a.start_time} - ${a.end_time}) and "${courseB}" (${b.start_time} - ${b.end_time}). Please reschedule one paper to a different period or date.`,
          });
        }
      }
    }
  }

  return conflicts;
}

/**
 * 3. Checks for Hall Clashes
 * Papers overlapping in time in one hall:
 * - involve more than the allowed number of classes (default 3), OR
 * - exceed the hall capacity when a capacity is set.
 */
export function checkHallClashes(entries, options = {}) {
  const maxClassesPerHall = options.maxClassesPerHall || 3;
  const conflicts = [];

  // Group entries by hall and date
  const hallDateGroups = new Map();
  for (const entry of entries) {
    const hallName = getHallName(entry);
    if (!hallName || !entry.date) continue;
    const key = `${hallName}:::${entry.date}`;
    if (!hallDateGroups.has(key)) {
      hallDateGroups.set(key, []);
    }
    hallDateGroups.get(key).push(entry);
  }

  for (const [key, groupEntries] of hallDateGroups.entries()) {
    const [hallName, date] = key.split(":::");

    // Find all overlapping subsets of papers in this hall
    // A clean approach: for each paper, gather all papers in this hall on this date that overlap with it,
    // or evaluate critical overlapping points.
    // To identify the full overlapping cluster:
    // Gather all time points (start times) and test concurrent active papers.
    const timePoints = new Set();
    groupEntries.forEach((e) => {
      timePoints.add(timeToMinutes(e.start_time));
    });

    const recordedClusters = new Set();

    for (const t of timePoints) {
      // Find all papers active at minute t
      const activePapers = groupEntries.filter((e) => {
        const start = timeToMinutes(e.start_time);
        const end = timeToMinutes(e.end_time);
        return start <= t && t < end;
      });

      if (activePapers.length <= 1) continue;

      // Deduplicate cluster signature so we don't report the same clash multiple times
      const clusterKey = activePapers
        .map((p) => p.id || `${getCourseCode(p)}-${p.start_time}`)
        .sort()
        .join("|");

      if (recordedClusters.has(clusterKey)) continue;
      recordedClusters.add(clusterKey);

      // Collect distinct classes
      const distinctClassesMap = new Map();
      let totalStudents = 0;

      activePapers.forEach((paper) => {
        const cName = getClassName(paper);
        const count = getStudentCount(paper);
        if (!distinctClassesMap.has(cName)) {
          distinctClassesMap.set(cName, count);
          totalStudents += count;
        }
      });

      const classCount = distinctClassesMap.size;
      const classNames = Array.from(distinctClassesMap.keys());
      const hallCapacity = getHallCapacity(activePapers[0]);

      const classLimitExceeded = classCount > maxClassesPerHall;
      const capacityExceeded = hallCapacity !== null && totalStudents > hallCapacity;

      if (classLimitExceeded || capacityExceeded) {
        let reasons = [];
        if (classLimitExceeded) {
          reasons.push(
            `${classCount} classes (${classNames.join(", ")}) exceed the maximum limit of ${maxClassesPerHall} classes per hall`
          );
        }
        if (capacityExceeded) {
          reasons.push(
            `${totalStudents} total students exceed the hall capacity of ${hallCapacity}`
          );
        }

        conflicts.push({
          type: "HALL_CLASH",
          hall: hallName,
          date,
          class_count: classCount,
          total_students: totalStudents,
          classes: classNames,
          entries: activePapers,
          message: `Hall Clash in ${hallName} on ${date}: ${reasons.join(" and ")} (involves ${classCount} classes and ${totalStudents} students).`,
        });
      }
    }
  }

  return conflicts;
}

/**
 * Main Conflict Detection Function
 * Takes a list of exam entries and options, runs all 3 checks,
 * and returns a consolidated list of conflict objects.
 * 
 * @param {Array} entries
 * @param {Object} [options]
 * @returns {Array} List of conflicts
 */
export function checkAllConflicts(entries = [], options = {}) {
  if (!Array.isArray(entries) || entries.length === 0) {
    return [];
  }

  const duplicates = checkDuplicateCourses(entries);
  const classClashes = checkClassClashes(entries);
  const hallClashes = checkHallClashes(entries, options);

  return [...duplicates, ...classClashes, ...hallClashes];
}

export default checkAllConflicts;
