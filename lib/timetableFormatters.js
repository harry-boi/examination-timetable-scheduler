/**
 * Timetable formatters adapting the official Akwa Ibom State Polytechnic, Ikot Osurua
 * Examination Timetable layout.
 *
 * Layout Structure:
 * - Landscape dual-session table
 * - Super-headers:
 *     - DATE (row-spanning)
 *     - MORNING: 9.00AM - 12.00NOON (PROGRAMME, COURSE, VENUE, INVIGILATORS)
 *     - AFTERNOON: 1.00PM – 4.00PM (PROGRAMME, COURSE, VENUE, INVIGILATORS)
 * - Row grouping: Papers sharing the same hall in a session are clustered into that venue block.
 */

const MONTH_ABBR = [
  "JAN.", "FEB.", "MAR.", "APR.", "MAY", "JUNE",
  "JULY", "AUG.", "SEPT.", "OCT.", "NOV.", "DEC.",
];

const DAY_ABBR = ["SUN.", "MON.", "TUE.", "WED.", "THUR.", "FRI.", "SAT."];

/**
 * Returns ordinal suffix for day of month (e.g. 1st, 2nd, 3rd, 21st, 22nd)
 */
export function getOrdinalSuffix(day) {
  const d = parseInt(day, 10);
  if (d >= 11 && d <= 13) return `${d}TH`;
  switch (d % 10) {
    case 1:
      return `${d}ST`;
    case 2:
      return `${d}ND`;
    case 3:
      return `${d}RD`;
    default:
      return `${d}TH`;
  }
}

/**
 * Formats a YYYY-MM-DD date into standard Polytechnic parts:
 * {
 *   dayOfWeek: "MON.",
 *   dateOrdinal: "21ST SEPT.,",
 *   year: "2026",
 *   full: "MON. 21ST SEPT., 2026"
 * }
 */
export function formatPolyDateParts(dateStr) {
  if (!dateStr) {
    return { dayOfWeek: "", dateOrdinal: "", year: "", full: "" };
  }

  const [yStr, mStr, dStr] = String(dateStr).split("-");
  const year = parseInt(yStr, 10);
  const monthIdx = parseInt(mStr, 10) - 1;
  const day = parseInt(dStr, 10);

  const dateObj = new Date(year, monthIdx, day);
  const dayOfWeek = DAY_ABBR[dateObj.getDay()] || "";
  const monthName = MONTH_ABBR[monthIdx] || "";
  const dateOrdinal = `${getOrdinalSuffix(day)} ${monthName}`;

  return {
    dayOfWeek,
    dateOrdinal: `${dateOrdinal},`,
    year: String(year),
    full: `${dayOfWeek} ${dateOrdinal}, ${year}`,
  };
}

/**
 * Extracts class and programme string e.g. "HND 2 SWD (50)"
 */
export function formatProgramme(exam) {
  // Support both normalized exam object and Supabase nested relation object
  const courses = exam.courses || {};
  const classes = courses.classes || exam.classes || {};
  const departments = classes.departments || {};

  const deptCode = departments.code || exam.dept_code || "";
  const level = classes.level || exam.level || "";
  const count = classes.student_count ?? exam.student_count ?? 0;

  if (deptCode && level) {
    return `${level} ${deptCode} (${count})`;
  } else if (exam.class) {
    return count ? `${exam.class} (${count})` : exam.class;
  }
  return "GENERAL";
}

/**
 * Extracts course code e.g. "SWD 421"
 */
export function formatCourseCode(exam) {
  return exam.courses?.code || exam.course || "COURSE";
}

/**
 * Extracts course title e.g. "Web Development II"
 */
export function formatCourseTitle(exam) {
  return exam.courses?.title || exam.course_title || "";
}

/**
 * Extracts hall/venue name e.g. "Auditorium" or "Workshop 9"
 */
export function formatVenueName(exam) {
  return exam.halls?.name || exam.hall || "UNALLOCATED";
}

/**
 * Determines whether an exam is Morning (< 12:00) or Afternoon (>= 12:00)
 */
export function isMorningSession(startTime) {
  if (!startTime) return true;
  const hour = parseInt(String(startTime).split(":")[0], 10);
  return hour < 12;
}

/**
 * Groups a flat array of examination papers into the official Polytechnic dual-session grid.
 *
 * Returns array of date groups:
 * [
 *   {
 *     date: "2026-09-21",
 *     dateParts: { dayOfWeek: "MON.", dateOrdinal: "21ST SEPT.,", year: "2026", full: "..." },
 *     totalRows: 3,
 *     rows: [
 *       {
 *         morningVenue: {
 *           venueName: "AUDITORIUM",
 *           items: [{ programme: "HND 2 SWD (50)", courseCode: "SWD 421", courseTitle: "..." }]
 *         },
 *         afternoonVenue: {
 *           venueName: "AUDITORIUM",
 *           items: [{ programme: "HND 1 SWD (50)", courseCode: "GNS 302", courseTitle: "..." }]
 *         }
 *       },
 *       ...
 *     ]
 *   }
 * ]
 */
export function groupExamsForOfficialTimetable(examsList = []) {
  if (!Array.isArray(examsList) || examsList.length === 0) {
    return [];
  }

  // 1. Group exams by date
  const byDate = {};
  for (const exam of examsList) {
    const d = exam.exam_date || exam.date;
    if (!d) continue;
    if (!byDate[d]) byDate[d] = [];
    byDate[d].push(exam);
  }

  // 2. Sort dates chronologically
  const sortedDates = Object.keys(byDate).sort();

  return sortedDates.map((dateStr) => {
    const dayExams = byDate[dateStr];
    const dateParts = formatPolyDateParts(dateStr);

    // Separate morning and afternoon
    const morningList = dayExams.filter((e) => isMorningSession(e.start_time));
    const afternoonList = dayExams.filter((e) => !isMorningSession(e.start_time));

    // Group by venue within each session
    const groupVenues = (list) => {
      const venuesMap = new Map();

      for (const item of list) {
        const vName = formatVenueName(item);
        if (!venuesMap.has(vName)) {
          venuesMap.set(vName, {
            venueName: vName,
            items: [],
          });
        }

        venuesMap.get(vName).items.push({
          id: item.id,
          programme: formatProgramme(item),
          courseCode: formatCourseCode(item),
          courseTitle: formatCourseTitle(item),
          studentCount: item.courses?.classes?.student_count ?? item.student_count ?? 0,
          startTime: item.start_time,
          endTime: item.end_time,
        });
      }

      // Sort venues alphabetically
      return Array.from(venuesMap.values()).sort((a, b) =>
        a.venueName.localeCompare(b.venueName)
      );
    };

    const morningVenues = groupVenues(morningList);
    const afternoonVenues = groupVenues(afternoonList);

    const totalRows = Math.max(morningVenues.length, afternoonVenues.length, 1);
    const rows = [];

    for (let i = 0; i < totalRows; i++) {
      rows.push({
        rowIndex: i,
        morningVenue: morningVenues[i] || null,
        afternoonVenue: afternoonVenues[i] || null,
      });
    }

    return {
      date: dateStr,
      dateParts,
      totalRows,
      rows,
      hasMorning: morningVenues.length > 0,
      hasAfternoon: afternoonVenues.length > 0,
    };
  });
}
