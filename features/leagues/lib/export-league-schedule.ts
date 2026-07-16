import { jsPDF } from "jspdf";
import {
  formatLeagueDate,
  formatLeagueTime,
} from "@/features/leagues/lib/league-formats";
import {
  groupMatchesByWeek,
  type LeagueScheduleModel,
} from "@/features/leagues/lib/league-schedule";

function slugifyFilename(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "league";
}

export function buildScheduleExportFilename(leagueName: string): string {
  return `${slugifyFilename(leagueName)}-schedule.pdf`;
}

export function buildScheduleExportFile(input: {
  leagueName: string;
  schedule: LeagueScheduleModel;
}): File {
  const { leagueName, schedule } = input;
  const weeks = groupMatchesByWeek(schedule.matches);
  const doc = new jsPDF({
    unit: "pt",
    format: "letter",
  });

  const marginX = 48;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - marginX * 2;
  let y = 56;

  const ensureSpace = (needed: number) => {
    if (y + needed <= pageHeight - 48) {
      return;
    }

    doc.addPage();
    y = 56;
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(leagueName, marginX, y);
  y += 22;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(90);
  doc.text("League Schedule", marginX, y);
  y += 18;

  doc.setDrawColor(210);
  doc.line(marginX, y, marginX + contentWidth, y);
  y += 20;
  doc.setTextColor(20);

  if (weeks.length === 0) {
    doc.setFontSize(11);
    doc.text("No matches scheduled.", marginX, y);
  }

  for (const week of weeks) {
    ensureSpace(56);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(`Week ${week.weekNumber}`, marginX, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(90);
    const when = [week.dateLabel, week.timeLabel].filter(Boolean).join(" · ");
    doc.text(when, marginX + 72, y);
    doc.setTextColor(20);
    y += 16;

    for (const match of week.matches) {
      ensureSpace(18);
      const home = match.homeLabel || "TBD";
      const away = match.awayLabel || "TBD";
      const date =
        formatLeagueDate(match.scheduledAt) ?? week.dateLabel ?? "";
      const time =
        formatLeagueTime(match.scheduledAt) ?? week.timeLabel ?? "";
      const line = `${home}  vs  ${away}`;
      const meta = [date, time].filter(Boolean).join(" · ");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text(line, marginX, y, {
        maxWidth: contentWidth - 120,
      });

      if (meta) {
        doc.setFontSize(9);
        doc.setTextColor(110);
        doc.text(meta, pageWidth - marginX, y, { align: "right" });
        doc.setTextColor(20);
      }

      y += 16;
    }

    y += 10;
  }

  const blob = doc.output("blob");
  const filename = buildScheduleExportFilename(leagueName);

  return new File([blob], filename, {
    type: "application/pdf",
    lastModified: Date.now(),
  });
}
