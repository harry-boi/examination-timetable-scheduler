"use client";

import { useMemo } from "react";
import { PolyLogo } from "@/components/Icons";
import { groupExamsForOfficialTimetable } from "@/lib/timetableFormatters";

/**
 * OfficialTimetableGrid
 * Renders the exact official Akwa Ibom State Polytechnic, Ikot Osurua landscape
 * examination timetable grid, matching the institution's official manual timetable.
 *
 * Columns:
 * DATE | MORNING (PROGRAMME, COURSE, VENUE, INVIGILATORS) | AFTERNOON (PROGRAMME, COURSE, VENUE, INVIGILATORS)
 */
export default function OfficialTimetableGrid({
  exams = [],
  timetable = null,
  filterLabel = "",
  showSignOff = true,
  className = "",
}) {
  const groupedDates = useMemo(() => {
    return groupExamsForOfficialTimetable(exams);
  }, [exams]);

  const academicSession = timetable?.session || "2025/2026";
  const semesterName = (timetable?.semester || "Second Semester").toUpperCase();
  const timetableTitle = timetable?.title || "EXAMINATION TIME TABLE";

  if (groupedDates.length === 0) {
    return (
      <div className="bg-white p-8 sm:p-12 text-center rounded-2xl border border-slate-200 text-slate-500 text-sm">
        <p className="font-semibold text-slate-700">No scheduled examination papers to display in official grid.</p>
        <p className="text-xs text-slate-400 mt-1">Schedule papers or generate suggestions to populate the timetable.</p>
      </div>
    );
  }

  return (
    <div className={`official-timetable-container bg-white text-black ${className}`}>
      {/* Official Polytechnic Document Header */}
      <div className="text-center pb-4 mb-4 border-b-2 border-black space-y-1">
        <div className="inline-flex justify-center mb-1">
          <PolyLogo className="w-12 h-12 text-blue-950 print:text-black" />
        </div>
        <h1 className="text-lg sm:text-xl md:text-2xl font-black uppercase tracking-wider text-black">
          Akwa Ibom State Polytechnic, Ikot Osurua
        </h1>
        <h2 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-slate-800 print:text-black">
          Time Table and Class Allocation Committee
        </h2>
        <h3 className="text-sm sm:text-base font-black uppercase tracking-wide text-blue-950 print:text-black pt-1">
          {timetableTitle}
        </h3>
        <p className="text-xs sm:text-sm font-bold uppercase text-slate-900 print:text-black">
          {academicSession} {semesterName} EXAMINATION
          {filterLabel ? ` • [${filterLabel}]` : ""}
        </p>
      </div>

      {/* Responsive Horizontal Scroll Wrapper on Screen / Full Width on Print */}
      <div className="overflow-x-auto print:overflow-visible">
        <table className="w-full border-collapse border-2 border-black text-[11px] print:text-[10px] leading-tight">
          <thead>
            {/* Top Super-Header Row */}
            <tr className="bg-slate-100 print:bg-slate-200 text-black border-b-2 border-black font-black uppercase text-center">
              <th
                rowSpan={2}
                className="border-r-2 border-black px-2 py-2.5 w-[11%] min-w-[90px] align-middle text-center tracking-wider"
              >
                DATE
              </th>
              <th
                colSpan={4}
                className="border-r-2 border-black px-3 py-1.5 w-[44.5%] bg-amber-50/60 print:bg-slate-100 tracking-wider text-amber-950 print:text-black"
              >
                ☀️ MORNING: 9.00AM &ndash; 12.00NOON
              </th>
              <th
                colSpan={4}
                className="px-3 py-1.5 w-[44.5%] bg-indigo-50/60 print:bg-slate-100 tracking-wider text-indigo-950 print:text-black"
              >
                🌤️ AFTERNOON: 1.00PM &ndash; 4.00PM
              </th>
            </tr>

            {/* Sub-Header Row */}
            <tr className="bg-slate-50 print:bg-slate-100 text-black border-b-2 border-black font-bold uppercase text-center text-[10px] print:text-[9.5px]">
              {/* Morning Columns */}
              <th className="border-r border-black px-2 py-1.5 w-[14%] text-left">PROGRAMME</th>
              <th className="border-r border-black px-2 py-1.5 w-[10%] text-left">COURSE</th>
              <th className="border-r border-black px-2 py-1.5 w-[11%] text-center">VENUE</th>
              <th className="border-r-2 border-black px-2 py-1.5 w-[9.5%] text-left">INVIGILATORS</th>

              {/* Afternoon Columns */}
              <th className="border-r border-black px-2 py-1.5 w-[14%] text-left">PROGRAMME</th>
              <th className="border-r border-black px-2 py-1.5 w-[10%] text-left">COURSE</th>
              <th className="border-r border-black px-2 py-1.5 w-[11%] text-center">VENUE</th>
              <th className="px-2 py-1.5 w-[9.5%] text-left">INVIGILATORS</th>
            </tr>
          </thead>

          <tbody>
            {groupedDates.map((dateGroup, dIdx) => {
              const { dateParts, totalRows, rows } = dateGroup;

              return rows.map((row, rIdx) => {
                const isFirstRowOfDate = rIdx === 0;
                const isLastRowOfDate = rIdx === totalRows - 1;

                return (
                  <tr
                    key={`${dateGroup.date}-row-${rIdx}`}
                    className={`border-b border-black hover:bg-slate-50/50 print:hover:bg-transparent ${
                      isLastRowOfDate ? "border-b-2 border-b-black" : ""
                    }`}
                  >
                    {/* Left Date Column (Spans all venue rows of that date) */}
                    {isFirstRowOfDate && (
                      <td
                        rowSpan={totalRows}
                        className="border-r-2 border-black px-2 py-2 text-center align-middle font-bold bg-slate-50/40 print:bg-transparent"
                      >
                        <div className="font-black text-xs uppercase tracking-wide text-black">
                          {dateParts.dayOfWeek}
                        </div>
                        <div className="text-[11px] font-bold text-slate-800 print:text-black uppercase mt-0.5">
                          {dateParts.dateOrdinal}
                        </div>
                        <div className="text-[11px] font-mono font-bold text-slate-600 print:text-black">
                          {dateParts.year}
                        </div>
                      </td>
                    )}

                    {/* Morning Session Columns */}
                    {row.morningVenue ? (
                      <>
                        {/* Programme Cell (Lists offering classes with student headcounts) */}
                        <td className="border-r border-black px-2 py-1.5 align-top">
                          <div className="space-y-1">
                            {row.morningVenue.items.map((item, idx) => (
                              <div key={idx} className="font-semibold text-slate-900 print:text-black">
                                {item.programme}
                              </div>
                            ))}
                          </div>
                        </td>

                        {/* Course Code Cell */}
                        <td className="border-r border-black px-2 py-1.5 align-top font-mono font-black text-blue-950 print:text-black">
                          <div className="space-y-1">
                            {row.morningVenue.items.map((item, idx) => (
                              <div key={idx} title={item.courseTitle}>
                                {item.courseCode}
                              </div>
                            ))}
                          </div>
                        </td>

                        {/* Venue / Hall Cell */}
                        <td className="border-r border-black px-2 py-1.5 align-middle text-center font-black uppercase text-slate-900 print:text-black bg-slate-50/20 print:bg-transparent">
                          {row.morningVenue.venueName}
                        </td>

                        {/* Invigilators Column (Blank for manual duty signatures) */}
                        <td className="border-r-2 border-black px-2 py-1.5 align-bottom">
                          <div className="min-h-[22px] border-b border-dotted border-slate-400 print:border-black/50"></div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="border-r border-black px-2 py-1.5 text-center text-slate-400 print:text-slate-300 align-middle">
                          —
                        </td>
                        <td className="border-r border-black px-2 py-1.5 text-center text-slate-400 print:text-slate-300 align-middle">
                          —
                        </td>
                        <td className="border-r border-black px-2 py-1.5 text-center text-slate-400 print:text-slate-300 align-middle">
                          —
                        </td>
                        <td className="border-r-2 border-black px-2 py-1.5 align-bottom">
                          <div className="min-h-[22px]"></div>
                        </td>
                      </>
                    )}

                    {/* Afternoon Session Columns */}
                    {row.afternoonVenue ? (
                      <>
                        {/* Programme Cell */}
                        <td className="border-r border-black px-2 py-1.5 align-top">
                          <div className="space-y-1">
                            {row.afternoonVenue.items.map((item, idx) => (
                              <div key={idx} className="font-semibold text-slate-900 print:text-black">
                                {item.programme}
                              </div>
                            ))}
                          </div>
                        </td>

                        {/* Course Code Cell */}
                        <td className="border-r border-black px-2 py-1.5 align-top font-mono font-black text-blue-950 print:text-black">
                          <div className="space-y-1">
                            {row.afternoonVenue.items.map((item, idx) => (
                              <div key={idx} title={item.courseTitle}>
                                {item.courseCode}
                              </div>
                            ))}
                          </div>
                        </td>

                        {/* Venue / Hall Cell */}
                        <td className="border-r border-black px-2 py-1.5 align-middle text-center font-black uppercase text-slate-900 print:text-black bg-slate-50/20 print:bg-transparent">
                          {row.afternoonVenue.venueName}
                        </td>

                        {/* Invigilators Column */}
                        <td className="px-2 py-1.5 align-bottom">
                          <div className="min-h-[22px] border-b border-dotted border-slate-400 print:border-black/50"></div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="border-r border-black px-2 py-1.5 text-center text-slate-400 print:text-slate-300 align-middle">
                          —
                        </td>
                        <td className="border-r border-black px-2 py-1.5 text-center text-slate-400 print:text-slate-300 align-middle">
                          —
                        </td>
                        <td className="border-r border-black px-2 py-1.5 text-center text-slate-400 print:text-slate-300 align-middle">
                          —
                        </td>
                        <td className="px-2 py-1.5 align-bottom">
                          <div className="min-h-[22px]"></div>
                        </td>
                      </>
                    )}
                  </tr>
                );
              });
            })}
          </tbody>
        </table>
      </div>

      {/* Official Committee Sign-Off & CC Distribution Block (Matching Page 25) */}
      {showSignOff && (
        <div className="mt-8 pt-4 border-t-2 border-black text-xs print:text-[10px] text-black">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-6">
            <div className="space-y-1">
              <p className="font-black uppercase tracking-wider">
                Directives to Hall Invigilators &amp; Students:
              </p>
              <ol className="list-decimal list-inside space-y-0.5 text-slate-800 print:text-black text-[11px] print:text-[9.5px]">
                <li>Morning examinations commence at 9:00 AM prompt; Afternoon examinations commence at 1:00 PM prompt.</li>
                <li>Students must present valid student identity cards and course registration slips to be admitted into halls.</li>
                <li>No mobile phones, programmable watches, or unauthorized materials are permitted inside examination venues.</li>
                <li>Invigilators must cross-sign their assigned venue roster upon collecting and submitting script bundles.</li>
              </ol>
            </div>

            <div className="text-right shrink-0 min-w-[280px]">
              <div className="border-b border-black w-60 ml-auto mb-1"></div>
              <p className="font-black uppercase text-xs tracking-wider">
                CHAIRMAN, TIME-TABLE AND CLASS ALLOCATION COMMITTEE
              </p>
              <p className="text-[10px] text-slate-600 print:text-black uppercase">
                Akwa Ibom State Polytechnic, Ikot Osurua
              </p>
            </div>
          </div>

          {/* Official Distribution List (Page 25 verbatim) */}
          <div className="pt-2 border-t border-slate-300 print:border-black/60 text-[10px] print:text-[9px] leading-relaxed">
            <span className="font-black uppercase mr-1">Cc:</span>
            <span className="font-semibold text-slate-700 print:text-black">
              RECTOR, DEPUTY RECTOR, REGISTRAR, POLYTECHNIC LIBRARIAN, BURSAR,
              ALL DEANS/ HODS, DIRECTOR DERR, DEPUTY REGISTRAR ACADEMICS,
              O/C WORKS, O/C SECURITY, ALL NOTICE BOARDS
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
