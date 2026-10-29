export type Subject = {
  _id: string;
  name: string;
  color: string;
  order: number;
};

export type Chapter = {
  _id: string;
  subjectId: string;
  title: string;
  order: number;
};

export type LinkItem = {
  _id: string;
  chapterId: string;
  subjectId: string;
  title: string;
  url: string;
  kind: string;
  note?: string;
  order: number;
};

export type StorageData = {
  subjects: Subject[];
  chapters: Chapter[];
  links: LinkItem[];
};

export const INITIAL_DATA: StorageData = {
  subjects: [
    { _id: "sub-1", name: "Physics", color: "#2563eb", order: 100 },
    { _id: "sub-2", name: "Chemistry", color: "#059669", order: 200 },
    { _id: "sub-3", name: "Mathematics", color: "#7c3aed", order: 300 },
    { _id: "sub-4", name: "Biology", color: "#e11d48", order: 400 },
  ],
  chapters: [
    { _id: "ch-1", subjectId: "sub-1", title: "Chapter 1: Kinematics & Laws of Motion", order: 100 },
    { _id: "ch-2", subjectId: "sub-1", title: "Chapter 2: Work, Energy & Rotational Dynamics", order: 200 },
    { _id: "ch-3", subjectId: "sub-2", title: "Chapter 1: Chemical Bonding & Molecular Structure", order: 100 },
    { _id: "ch-4", subjectId: "sub-3", title: "Chapter 1: Differential Calculus & Limits", order: 100 },
    { _id: "ch-5", subjectId: "sub-4", title: "Chapter 1: Cellular Organization & Genetics", order: 100 },
  ],
  links: [
    {
      _id: "lnk-1",
      chapterId: "ch-1",
      subjectId: "sub-1",
      title: "Live Lecture: Projectile Motion & Vector Analysis",
      url: "https://zoom.us/j/9876543210",
      kind: "Zoom",
      note: "Every Mon/Wed 10:00 AM • Passcode: 2024PHYS",
      order: 100,
    },
    {
      _id: "lnk-2",
      chapterId: "ch-1",
      subjectId: "sub-1",
      title: "Class 01 Complete Recording (HD)",
      url: "https://youtube.com/watch?v=dQw4w9WgXcQ",
      kind: "YouTube",
      note: "Timestamps in description • Duration: 1h 24m",
      order: 200,
    },
    {
      _id: "lnk-3",
      chapterId: "ch-1",
      subjectId: "sub-1",
      title: "Handwritten Lecture Notes & Formula Sheet",
      url: "https://drive.google.com/file/d/example-notes-pdf/view",
      kind: "PDF",
      note: "Print before solving homework problems",
      order: 300,
    },
    {
      _id: "lnk-4",
      chapterId: "ch-2",
      subjectId: "sub-1",
      title: "Problem Solving Workshop & Doubt Clearing",
      url: "https://meet.google.com/abc-defg-hij",
      kind: "Meet",
      note: "Friday 4:00 PM • Bring HC Verma book",
      order: 100,
    },
    {
      _id: "lnk-5",
      chapterId: "ch-3",
      subjectId: "sub-2",
      title: "VSEPR Theory & Molecular Orbitals Overview",
      url: "https://drive.google.com/drive/folders/chem-bond",
      kind: "Drive",
      note: "Shared lecture slides and 3D atomic structures",
      order: 100,
    },
    {
      _id: "lnk-6",
      chapterId: "ch-4",
      subjectId: "sub-3",
      title: "Limits, Continuity & L'Hôpital's Rule Masterclass",
      url: "https://teams.microsoft.com/l/meetup-join/math-calculus",
      kind: "Teams",
      note: "Tuesday 3:00 PM",
      order: 100,
    },
    {
      _id: "lnk-7",
      chapterId: "ch-5",
      subjectId: "sub-4",
      title: "Mendelian Genetics Lab & Pedigree Analysis Guide",
      url: "https://drive.google.com/file/d/genetics-lab.pdf",
      kind: "PDF",
      note: "Includes self-assessment quiz link",
      order: 100,
    },
  ],
};
