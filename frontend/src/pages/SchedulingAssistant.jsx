import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import "../styles/schedulingAssistant.css";

const API_BASE_URL = "http://127.0.0.1:8000";

const schedulingAssistantMockData = {
  studentPlanningContext: {
    studentName: "Maya Patel",
    major: "Computer Science",
    track: "Artificial Intelligence",
    completedCredits: 84,
    completedCsRequirementsCount: 7,
    completedCourses: ["CS 180", "CS 182", "CS 240", "CS 250", "CS 251", "CS 252"],
  },
  termStatuses: {
    "Spring 2026": {
      termName: "Spring 2026",
      termStatus: "Past",
      submissionWindowStatus: "Closed",
      editable: false,
      offeringsKey: null,
      message: "This term is closed and cannot be edited.",
      pastSchedule: {
        term: "Spring 2026",
        sectionCount: 2,
        credits: 6,
        sections: [
          {
            courseCode: "CS 251",
            title: "Data Structures and Algorithms",
            credits: 3,
            sectionNumber: "001",
            days: "MWF",
            time: "10:30 AM - 11:20 AM",
            seatStatus: "Submitted",
          },
          {
            courseCode: "STAT 350",
            title: "Introduction to Statistics",
            credits: 3,
            sectionNumber: "002",
            days: "TR",
            time: "1:30 PM - 2:45 PM",
            seatStatus: "Submitted",
          },
        ],
      },
    },
    "Fall 2026": {
      termName: "Fall 2026",
      termStatus: "Open",
      submissionWindowStatus: "Open",
      editable: true,
      offeringsKey: "fall2026",
      message: "Planning and final submission are open for this term.",
    },
    "Spring 2027": {
      termName: "Spring 2027",
      termStatus: "Future",
      submissionWindowStatus: "Not Open Yet",
      editable: false,
      offeringsKey: null,
      message: "Planning for this term is not open yet.",
    },
    default: {
      termName: "Selected term",
      termStatus: "Not configured",
      submissionWindowStatus: "Closed",
      editable: false,
      offeringsKey: null,
      message: "No offerings are configured for this term yet.",
    },
  },
  offeredCourses: [
    {
      code: "CS 348",
      title: "Information Systems",
      credits: 3,
      category: "Core CS",
      description: "Introduces database concepts, data modeling, and information system design.",
      numberOfSections: 3,
      sectionSummary: "2 open, 1 full",
      sections: [
        {
          sectionNumber: "001",
          instructor: "Dr. Chen",
          days: "MWF",
          time: "9:30 AM - 10:20 AM",
          location: "LWSN B151",
          capacity: 36,
          enrolledCount: 31,
          seatsRemaining: 5,
          seatStatus: "Open",
        },
        {
          sectionNumber: "002",
          instructor: "Dr. Alvarez",
          days: "TR",
          time: "1:30 PM - 2:45 PM",
          location: "WALC 2087",
          capacity: 32,
          enrolledCount: 30,
          seatsRemaining: 2,
          seatStatus: "Low Seats",
        },
        {
          sectionNumber: "003",
          instructor: "Dr. Chen",
          days: "TR",
          time: "3:00 PM - 4:15 PM",
          location: "LWSN B134",
          capacity: 32,
          enrolledCount: 32,
          seatsRemaining: 0,
          seatStatus: "Full",
        },
      ],
    },
    {
      code: "CS 307",
      title: "Software Engineering I",
      credits: 3,
      category: "Core CS",
      description: "Introduces software process, teamwork, requirements, design, testing, and project delivery.",
      numberOfSections: 2,
      sectionSummary: "2 open",
      sections: [
        {
          sectionNumber: "001",
          instructor: "Dr. Martin",
          days: "MWF",
          time: "8:30 AM - 9:20 AM",
          location: "LWSN 1106",
          capacity: 32,
          enrolledCount: 24,
          seatsRemaining: 8,
          seatStatus: "Open",
        },
        {
          sectionNumber: "002",
          instructor: "Dr. Martin",
          days: "MWF",
          time: "11:30 AM - 12:20 PM",
          location: "LWSN B155",
          capacity: 32,
          enrolledCount: 29,
          seatsRemaining: 3,
          seatStatus: "Low Seats",
        },
      ],
    },
    {
      code: "CS 471",
      title: "Introduction to Artificial Intelligence",
      credits: 3,
      category: "AI Track",
      description: "Covers search, knowledge representation, reasoning, and introductory AI methods.",
      numberOfSections: 2,
      sectionSummary: "1 open, 1 low seats",
      sections: [
        {
          sectionNumber: "001",
          instructor: "Dr. Nguyen",
          days: "MWF",
          time: "11:30 AM - 12:20 PM",
          location: "LWSN 1142",
          capacity: 40,
          enrolledCount: 34,
          seatsRemaining: 6,
          seatStatus: "Open",
        },
        {
          sectionNumber: "002",
          instructor: "Dr. Nguyen",
          days: "TR",
          time: "10:30 AM - 11:45 AM",
          location: "WALC 3121",
          capacity: 36,
          enrolledCount: 34,
          seatsRemaining: 2,
          seatStatus: "Low Seats",
        },
      ],
    },
    {
      code: "CS 373",
      title: "Data Mining",
      credits: 3,
      category: "AI Track",
      description: "Explores techniques for discovering patterns, models, and useful knowledge from data.",
      numberOfSections: 2,
      sectionSummary: "2 open",
      sections: [
        {
          sectionNumber: "001",
          instructor: "Dr. Singh",
          days: "TR",
          time: "9:00 AM - 10:15 AM",
          location: "WALC 2127",
          capacity: 35,
          enrolledCount: 27,
          seatsRemaining: 8,
          seatStatus: "Open",
        },
        {
          sectionNumber: "002",
          instructor: "Dr. Singh",
          days: "MWF",
          time: "12:30 PM - 1:20 PM",
          location: "LWSN 1142",
          capacity: 35,
          enrolledCount: 31,
          seatsRemaining: 4,
          seatStatus: "Open",
        },
      ],
    },
    {
      code: "CS 473",
      title: "Machine Learning",
      credits: 3,
      category: "AI Track",
      description: "Covers supervised and unsupervised machine learning methods and model evaluation.",
      prerequisites: ["CS 373"],
      numberOfSections: 1,
      sectionSummary: "1 open",
      sections: [
        {
          sectionNumber: "001",
          instructor: "Dr. Rogers",
          days: "TR",
          time: "12:00 PM - 1:15 PM",
          location: "LWSN B134",
          capacity: 30,
          enrolledCount: 22,
          seatsRemaining: 8,
          seatStatus: "Open",
        },
      ],
    },
    {
      code: "CS 390",
      title: "Web Application Development",
      credits: 3,
      category: "Supporting Elective",
      description: "Builds practical client and server web application development skills.",
      numberOfSections: 2,
      sectionSummary: "1 open, 1 full",
      sections: [
        {
          sectionNumber: "001",
          instructor: "Prof. Williams",
          days: "MW",
          time: "2:30 PM - 3:45 PM",
          location: "HAAS G066",
          capacity: 28,
          enrolledCount: 25,
          seatsRemaining: 3,
          seatStatus: "Open",
        },
        {
          sectionNumber: "002",
          instructor: "Prof. Williams",
          days: "TR",
          time: "4:30 PM - 5:45 PM",
          location: "HAAS G040",
          capacity: 28,
          enrolledCount: 28,
          seatsRemaining: 0,
          seatStatus: "Full",
        },
      ],
    },
    {
      code: "STAT 350",
      title: "Introduction to Statistics",
      credits: 3,
      category: "Supporting Elective",
      description: "Provides applied probability, inference, and statistical reasoning for technical majors.",
      numberOfSections: 1,
      sectionSummary: "1 open",
      sections: [
        {
          sectionNumber: "001",
          instructor: "Dr. Brooks",
          days: "TR",
          time: "3:00 PM - 4:15 PM",
          location: "REC 302",
          capacity: 45,
          enrolledCount: 33,
          seatsRemaining: 12,
          seatStatus: "Open",
        },
      ],
    },
  ],
  selectedSchedule: [],
  validationPlaceholder: {
    title: "Validation Results",
    message:
      "Future validation will check schedule conflicts, credit load, prerequisite readiness, and submission rules.",
  },
  suggestionsPlaceholder: {
    title: "Suggestions and Path Guidance",
    message:
      "Future suggestions will recommend sections, alternatives, and next academic steps based on the draft schedule.",
  },
  finalSubmissionPlaceholder: {
    title: "Final Submission",
    message:
      "Final submission will only be enabled after validation passes and the selected term submission window is open.",
  },
};

function formatTermLabel(value) {
  if (!value) {
    return "";
  }

  return value
    .toString()
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function normalizeTermStatus(term) {
  const status = term.status || "not_configured";
  const planningMode = term.planning_mode || "read_only";
  const submissionWindow = term.submission_window || "closed";

  return {
    termId: term.term_id,
    termName: term.term_name,
    semester: term.semester,
    year: term.year,
    termStatus: formatTermLabel(status),
    submissionWindowStatus: formatTermLabel(submissionWindow),
    editable: planningMode === "editable",
    planningMode: formatTermLabel(planningMode),
    offeringsKey: term.term_name === "Fall 2026" ? "fall2026" : null,
    message:
      status === "open"
        ? "Planning and final submission are open for this term."
        : status === "past" || status === "closed"
          ? "This term is closed and cannot be edited."
          : status === "future" || status === "not_open_yet"
            ? "Planning for this term is not open yet."
            : "No offerings are configured for this term yet.",
  };
}

function getSeatStatusClass(status) {
  return status.toLowerCase().replace(" ", "-");
}

function parseTimeValue(timeValue) {
  const [time, period] = timeValue.trim().split(" ");
  const [hourText, minuteText] = time.split(":");
  let hour = Number(hourText);
  const minute = Number(minuteText);

  if (period === "PM" && hour !== 12) {
    hour += 12;
  }

  if (period === "AM" && hour === 12) {
    hour = 0;
  }

  return hour * 60 + minute;
}

function getTimeRange(timeRange) {
  const [start, end] = timeRange.split(" - ");

  return {
    start: parseTimeValue(start),
    end: parseTimeValue(end),
  };
}

function getMeetingDays(days) {
  return days.includes("T") || days.includes("R") ? days.match(/T|R/g) : days.split("");
}

function sectionsOverlap(firstSection, secondSection) {
  const firstDays = getMeetingDays(firstSection.days);
  const secondDays = getMeetingDays(secondSection.days);
  const hasSharedDay = firstDays.some((day) => secondDays.includes(day));

  if (!hasSharedDay) {
    return false;
  }

  const firstTime = getTimeRange(firstSection.time);
  const secondTime = getTimeRange(secondSection.time);

  return firstTime.start < secondTime.end && secondTime.start < firstTime.end;
}

function getIssueSeverity(type) {
  return type === "Credit Warning" ? "warning" : "error";
}

function getScheduleStorageKey(term) {
  return `pathwiseSchedule-${term.replace(" ", "-")}`;
}

function readStoredSchedule(term) {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const storedValue = window.localStorage.getItem(getScheduleStorageKey(term));
    return storedValue ? JSON.parse(storedValue) : null;
  } catch {
    return null;
  }
}

function writeStoredSchedule(term, value) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(getScheduleStorageKey(term), JSON.stringify(value));
  } catch {
    // localStorage is best-effort mock persistence for this phase.
  }
}

function SchedulingAssistant() {
  const {
    studentPlanningContext,
    termStatuses,
    offeredCourses,
  } = schedulingAssistantMockData;
  const fallbackTerms = useMemo(
    () =>
      Object.values(termStatuses)
        .filter((term) => term.termName && term.termName !== "Selected term")
        .map((term) =>
          normalizeTermStatus({
            term_id: 0,
            term_name: term.termName,
            semester: term.termName.split(" ")[0],
            year: Number(term.termName.split(" ")[1]),
            status: term.termStatus.toLowerCase(),
            planning_mode: term.editable ? "editable" : "read_only",
            submission_window: term.submissionWindowStatus.toLowerCase().replaceAll(" ", "_"),
          }),
        ),
    [termStatuses],
  );
  const [terms, setTerms] = useState(fallbackTerms);
  const [isLoadingTerms, setIsLoadingTerms] = useState(true);
  const [termLoadError, setTermLoadError] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("Fall");
  const [selectedYear, setSelectedYear] = useState(2026);
  const selectedTerm = `${selectedSemester} ${selectedYear}`;
  const selectedBackendTerm = terms.find((term) => term.termName === selectedTerm);
  const selectedTermStatus =
    selectedBackendTerm || {
      ...normalizeTermStatus({
        term_id: 0,
        term_name: selectedTerm,
        semester: selectedSemester,
        year: selectedYear,
        status: "not_configured",
        planning_mode: "read_only",
        submission_window: "closed",
      }),
    };
  const availableSemesters = [...new Set(terms.map((term) => term.semester))];
  const availableYears = [...new Set(terms.map((term) => term.year))].sort();
  const termOfferedCourses =
    selectedTermStatus.offeringsKey === "fall2026" ? offeredCourses : [];
  const courseCategories = useMemo(
    () => [...new Set(termOfferedCourses.map((course) => course.category))],
    [termOfferedCourses],
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCategories, setExpandedCategories] = useState(() =>
    courseCategories.reduce((categories, category) => {
      categories[category] = false;
      return categories;
    }, {}),
  );
  const [expandedCourses, setExpandedCourses] = useState({});
  const [draftsByTerm, setDraftsByTerm] = useState(() => {
    const storedSchedule = readStoredSchedule("Fall 2026");
    return {
      "Fall 2026": storedSchedule?.draftSections || [],
    };
  });
  const [validationByTerm, setValidationByTerm] = useState(() => {
    const storedSchedule = readStoredSchedule("Fall 2026");
    return storedSchedule?.validationState
      ? {
          "Fall 2026": storedSchedule.validationState,
        }
      : {};
  });
  const [submittedByTerm, setSubmittedByTerm] = useState(() => {
    const storedSchedule = readStoredSchedule("Fall 2026");
    return storedSchedule?.submittedSchedule
      ? {
          "Fall 2026": storedSchedule.submittedSchedule,
        }
      : {};
  });
  const selectedDraftSchedule = draftsByTerm[selectedTerm] || [];
  const submittedSchedule = submittedByTerm[selectedTerm] || selectedTermStatus.pastSchedule || null;
  const selectedSchedule = submittedSchedule?.sections || selectedDraftSchedule;
  const validationState = validationByTerm[selectedTerm] || {
    hasValidated: false,
    issues: [],
  };
  const hasValidated = validationState.hasValidated;
  const validationIssues = validationState.issues;
  const blockingIssues = validationIssues.filter((issue) => issue.severity === "error");
  const warningIssues = validationIssues.filter((issue) => issue.severity === "warning");
  const isSubmitted = Boolean(submittedSchedule);
  const canEditSelectedTerm = selectedTermStatus.editable && !isSubmitted;
  const selectedCourseCodes = useMemo(
    () => new Set(selectedSchedule.map((item) => item.courseCode)),
    [selectedSchedule],
  );
  const selectedSectionKeys = useMemo(
    () => new Set(selectedSchedule.map((item) => `${item.courseCode}-${item.sectionNumber}`)),
    [selectedSchedule],
  );
  const totalDraftCredits = selectedSchedule.reduce((total, item) => total + item.credits, 0);
  const completedCourseCodes = useMemo(
    () => new Set(studentPlanningContext.completedCourses),
    [studentPlanningContext.completedCourses],
  );
  const validationStatus = isSubmitted
    ? "Submitted"
    : !hasValidated
      ? "Not validated yet"
      : blockingIssues.length > 0
        ? "Validated with issues"
        : warningIssues.length > 0
          ? "Validated with warnings"
          : "Valid plan";
  const isSubmissionWindowOpen = selectedTermStatus.submissionWindowStatus === "Open";
  const submissionChecklist = [
    {
      label: "Selected sections exist",
      complete: selectedSchedule.length > 0,
    },
    {
      label: "Validation passed with no issues",
      complete: hasValidated && blockingIssues.length === 0 && warningIssues.length === 0,
    },
    {
      label: "Submission window open",
      complete: isSubmissionWindowOpen,
    },
  ];
  const canSubmitFinalSchedule =
    selectedSchedule.length > 0 &&
    hasValidated &&
    blockingIssues.length === 0 &&
    warningIssues.length === 0 &&
    isSubmissionWindowOpen &&
    selectedTermStatus.editable &&
    !isSubmitted;
  const submissionDisabledReason = isSubmitted
    ? "This schedule has already been submitted."
    : !selectedTermStatus.editable
      ? selectedTermStatus.message
    : selectedSchedule.length === 0
      ? "Add at least one section before submitting."
      : !hasValidated
        ? "Validate the draft plan before submitting."
        : blockingIssues.length > 0
          ? "Fix blocking validation issues before submitting."
          : warningIssues.length > 0
            ? "Resolve validation warnings before submitting."
            : !isSubmissionWindowOpen
              ? "Submission window is closed for this term."
              : "";
  const suggestions = validationIssues.map((issue) => {
    if (issue.type === "Time Conflict") {
      return {
        title: "Choose another section",
        message: issue.alternateSuggestion
          ? `Alternate section available: ${issue.alternateSuggestion}, with no time conflict detected.`
          : "Remove one of the conflicting sections or choose another open section.",
      };
    }

    if (issue.type === "Missing Prerequisite") {
      return {
        title: "Follow prerequisite path",
        message:
          "Complete the missing prerequisite before planning this course. Draft or in-progress courses do not satisfy prerequisites.",
      };
    }

    if (issue.type === "Full Section") {
      return {
        title: "Pick an open section",
        message: "Remove the full section and choose an open or low-seat section instead.",
      };
    }

    return {
      title: "Adjust credit load",
      message:
        totalDraftCredits < 12
          ? "Add another eligible course to reach full-time status."
          : "Remove a course or choose fewer credits to stay within the recommended load.",
    };
  });
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredCourses = useMemo(
    () =>
      termOfferedCourses.filter((course) => {
        if (!normalizedSearchTerm) {
          return true;
        }

        return [course.code, course.title, course.category, course.description]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearchTerm);
      }),
    [normalizedSearchTerm, termOfferedCourses],
  );
  const groupedCourses = courseCategories
    .map((category) => ({
      category,
      courses: filteredCourses.filter((course) => course.category === category),
    }))
    .filter((group) => group.courses.length > 0);

  useEffect(() => {
    let isMounted = true;

    async function loadTerms() {
      setIsLoadingTerms(true);
      setTermLoadError("");

      try {
        const response = await fetch(`${API_BASE_URL}/student/terms`);

        if (!response.ok) {
          throw new Error("Unable to load terms.");
        }

        const termData = await response.json();
        const normalizedTerms = termData.map(normalizeTermStatus);

        if (!isMounted) {
          return;
        }

        setTerms(normalizedTerms);

        const currentSelectionExists = normalizedTerms.some(
          (term) => term.semester === selectedSemester && term.year === selectedYear,
        );

        if (!currentSelectionExists && normalizedTerms.length > 0) {
          setSelectedSemester(normalizedTerms[0].semester);
          setSelectedYear(normalizedTerms[0].year);
        }
      } catch (error) {
        if (isMounted) {
          setTermLoadError("Could not load terms from the backend. Showing fallback demo terms.");
          setTerms(fallbackTerms);
        }
      } finally {
        if (isMounted) {
          setIsLoadingTerms(false);
        }
      }
    }

    loadTerms();

    return () => {
      isMounted = false;
    };
  }, [fallbackTerms]);

  useEffect(() => {
    const storedSchedule = readStoredSchedule(selectedTerm);

    if (!storedSchedule) {
      return;
    }

    setDraftsByTerm((current) => ({
      ...current,
      [selectedTerm]: storedSchedule.draftSections || [],
    }));
    setValidationByTerm((current) => ({
      ...current,
      [selectedTerm]: storedSchedule.validationState || {
        hasValidated: false,
        issues: [],
      },
    }));
    setSubmittedByTerm((current) => {
      const next = { ...current };

      if (storedSchedule.submittedSchedule) {
        next[selectedTerm] = storedSchedule.submittedSchedule;
      } else {
        delete next[selectedTerm];
      }

      return next;
    });
  }, [selectedTerm]);

  useEffect(() => {
    writeStoredSchedule(selectedTerm, {
      draftSections: selectedDraftSchedule,
      validationState,
      submittedStatus: Boolean(submittedByTerm[selectedTerm]),
      submittedSchedule: submittedByTerm[selectedTerm] || null,
      submittedTerm: submittedByTerm[selectedTerm]?.term || null,
      submittedSectionCount: submittedByTerm[selectedTerm]?.sectionCount || 0,
      submittedCredits: submittedByTerm[selectedTerm]?.credits || 0,
    });
  }, [selectedTerm, selectedDraftSchedule, validationState, submittedByTerm]);

  function resetValidationForSelectedTerm() {
    setValidationByTerm((current) => ({
      ...current,
      [selectedTerm]: {
        hasValidated: false,
        issues: [],
      },
    }));
  }

  function handleSemesterChange(event) {
    setSelectedSemester(event.target.value);
    setSearchTerm("");
    setExpandedCourses({});
  }

  function handleYearChange(event) {
    setSelectedYear(Number(event.target.value));
    setSearchTerm("");
    setExpandedCourses({});
  }

  function toggleCategory(category) {
    setExpandedCategories((current) => ({
      ...current,
      [category]: !current[category],
    }));
  }

  function toggleCourse(courseCode) {
    setExpandedCourses((current) => ({
      ...current,
      [courseCode]: !current[courseCode],
    }));
  }

  function addSection(course, section) {
    if (!canEditSelectedTerm || section.seatStatus === "Full" || selectedCourseCodes.has(course.code)) {
      return;
    }

    setDraftsByTerm((current) => ({
      ...current,
      [selectedTerm]: [
        ...(current[selectedTerm] || []),
        {
          courseCode: course.code,
          title: course.title,
          credits: course.credits,
          category: course.category,
          sectionNumber: section.sectionNumber,
          instructor: section.instructor,
          days: section.days,
          time: section.time,
          location: section.location,
          seatStatus: section.seatStatus,
          prerequisites: course.prerequisites || [],
        },
      ],
    }));
    resetValidationForSelectedTerm();
  }

  function removeSection(courseCode) {
    if (!canEditSelectedTerm) {
      return;
    }

    setDraftsByTerm((current) => ({
      ...current,
      [selectedTerm]: (current[selectedTerm] || []).filter((item) => item.courseCode !== courseCode),
    }));
    resetValidationForSelectedTerm();
  }

  function findAlternateSection(courseCode, currentSectionNumber) {
    const course = termOfferedCourses.find((offeredCourse) => offeredCourse.code === courseCode);

    if (!course) {
      return "";
    }

    const otherSelectedSections = selectedSchedule.filter((section) => section.courseCode !== courseCode);
    const alternate = course.sections.find(
      (section) =>
        section.sectionNumber !== currentSectionNumber &&
        section.seatStatus !== "Full" &&
        !otherSelectedSections.some((selectedSection) => sectionsOverlap(section, selectedSection)),
    );

    return alternate ? `${courseCode} Section ${alternate.sectionNumber}` : "";
  }

  function validatePlan() {
    if (!canEditSelectedTerm) {
      return;
    }

    const issues = [];

    selectedSchedule.forEach((section, index) => {
      selectedSchedule.slice(index + 1).forEach((comparisonSection) => {
        if (sectionsOverlap(section, comparisonSection)) {
          issues.push({
            type: "Time Conflict",
            severity: getIssueSeverity("Time Conflict"),
            affectedCourse: `${section.courseCode} Section ${section.sectionNumber}`,
            explanation: `${section.courseCode} Section ${section.sectionNumber} overlaps with ${comparisonSection.courseCode} Section ${comparisonSection.sectionNumber}.`,
            impact: "One of these sections must be removed or changed before submission.",
            alternateSuggestion:
              findAlternateSection(section.courseCode, section.sectionNumber) ||
              findAlternateSection(comparisonSection.courseCode, comparisonSection.sectionNumber),
          });
        }
      });

      const missingPrerequisites = section.prerequisites.filter(
        (prerequisite) => !completedCourseCodes.has(prerequisite),
      );

      if (missingPrerequisites.length > 0) {
        issues.push({
          type: "Missing Prerequisite",
          severity: getIssueSeverity("Missing Prerequisite"),
          affectedCourse: `${section.courseCode} ${section.title}`,
          explanation: `${section.courseCode} requires ${missingPrerequisites.join(", ")} to be completed.`,
          impact:
            "Only completed coursework satisfies prerequisites; draft and in-progress courses do not count.",
          pathGuidance: {
            course: `${section.courseCode} ${section.title}`,
            reasonUnavailable: "Required prerequisite has not been finalized as completed.",
            missingPrerequisite: missingPrerequisites.join(", "),
            nextStep: `Complete ${missingPrerequisites.join(", ")} before planning ${section.courseCode}.`,
          },
        });
      }

      if (section.seatStatus === "Full") {
        issues.push({
          type: "Full Section",
          severity: getIssueSeverity("Full Section"),
          affectedCourse: `${section.courseCode} Section ${section.sectionNumber}`,
          explanation: "This section has no seats remaining.",
          impact: "Full sections cannot be included in a submitted plan.",
        });
      }
    });

    if (totalDraftCredits < 12) {
      issues.push({
        type: "Credit Warning",
        severity: getIssueSeverity("Credit Warning"),
        affectedCourse: "Draft schedule",
        explanation: "Draft schedule is below full-time credit load.",
        impact: "Consider adding another eligible course before submission.",
      });
    } else if (totalDraftCredits > 18) {
      issues.push({
        type: "Credit Warning",
        severity: getIssueSeverity("Credit Warning"),
        affectedCourse: "Draft schedule",
        explanation: "Draft schedule is above the recommended maximum credit load.",
        impact: "Consider removing a course before submission.",
      });
    }

    setValidationByTerm((current) => ({
      ...current,
      [selectedTerm]: {
        hasValidated: true,
        issues,
      },
    }));
  }

  function submitFinalSchedule() {
    if (!canSubmitFinalSchedule) {
      return;
    }

    setSubmittedByTerm((current) => ({
      ...current,
      [selectedTerm]: {
        term: selectedTerm,
        sections: selectedSchedule,
        sectionCount: selectedSchedule.length,
        credits: totalDraftCredits,
      },
    }));
  }

  function editDraft() {
    if (!selectedTermStatus.editable || !submittedSchedule) {
      return;
    }

    setDraftsByTerm((current) => ({
      ...current,
      [selectedTerm]: submittedSchedule.sections,
    }));
    setSubmittedByTerm((current) => {
      const next = { ...current };
      delete next[selectedTerm];
      return next;
    });
    resetValidationForSelectedTerm();
  }

  return (
    <DashboardLayout
      role="student"
      title="Scheduling Assistant"
      subtitle="Build, validate, and submit your semester schedule."
    >
      <section className="panel-card scheduling-controls-card">
        <div className="panel-header">
          <h3>Term Selection and Planning Controls</h3>
          <p>Select an academic term to view planning availability and mock offerings.</p>
        </div>

        {isLoadingTerms && (
          <div className="scheduling-term-message">Loading terms from the backend...</div>
        )}
        {termLoadError && (
          <div className="scheduling-term-message error">{termLoadError}</div>
        )}

        <div className="scheduling-term-selector">
          <label>
            <span>Semester</span>
            <select value={selectedSemester} onChange={handleSemesterChange}>
              {availableSemesters.map((semester) => (
                <option value={semester} key={semester}>
                  {semester}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Year</span>
            <select value={selectedYear} onChange={handleYearChange}>
              {availableYears.map((year) => (
                <option value={year} key={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="scheduling-control-grid">
          <div>
            <span>Selected Term</span>
            <strong>{selectedTerm}</strong>
          </div>
          <div>
            <span>Term Status</span>
            <strong>{selectedTermStatus.termStatus}</strong>
          </div>
          <div>
            <span>Planning Mode</span>
            <strong>{selectedTermStatus.planningMode}</strong>
          </div>
          <div>
            <span>Submission Window</span>
            <strong>{selectedTermStatus.submissionWindowStatus}</strong>
          </div>
        </div>

        <div className={`scheduling-window-note ${selectedTermStatus.termStatus.toLowerCase().replaceAll(" ", "-").replaceAll("_", "-")}`}>
          <div className="scheduling-window-note-header">
            <strong>{selectedTerm}</strong>
            <span>{selectedTermStatus.submissionWindowStatus}</span>
          </div>
          <p>{selectedTermStatus.message}</p>
        </div>
      </section>

      <section className="panel-card scheduling-context-card">
        <div className="panel-header">
          <h3>Student Planning Context</h3>
          <p>Summary context that future scheduling logic will use.</p>
        </div>

        <div className="scheduling-context-grid">
          <div>
            <span>Student</span>
            <strong>{studentPlanningContext.studentName}</strong>
          </div>
          <div>
            <span>Major</span>
            <strong>{studentPlanningContext.major}</strong>
          </div>
          <div>
            <span>Track</span>
            <strong>{studentPlanningContext.track}</strong>
          </div>
          <div>
            <span>Completed Credits</span>
            <strong>{studentPlanningContext.completedCredits}</strong>
          </div>
          <div>
            <span>Completed CS Requirements</span>
            <strong>{studentPlanningContext.completedCsRequirementsCount}</strong>
          </div>
        </div>
      </section>

      <section className="scheduling-workspace">
        <div className="table-panel scheduling-offered-panel">
          <div className="panel-header">
            <h3>Main Scheduling Workspace</h3>
            <p>
              Browse mock offered courses and add sections to a local draft schedule.
            </p>
          </div>

          <label className="scheduling-search">
            <span>Search offered courses</span>
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by code, title, track, or description"
            />
          </label>

          <div className="scheduling-course-list">
            {groupedCourses.map((group) => (
              <section className="scheduling-category-group" key={group.category}>
                <button
                  className="scheduling-category-toggle"
                  type="button"
                  onClick={() => toggleCategory(group.category)}
                  aria-expanded={expandedCategories[group.category]}
                >
                  <span>{expandedCategories[group.category] ? "-" : "+"}</span>
                  <strong>{group.category}</strong>
                  <em>{group.courses.length} courses</em>
                </button>

                {expandedCategories[group.category] && (
                  <div className="scheduling-category-courses">
                    {group.courses.map((course) => {
                      const isCourseExpanded = Boolean(expandedCourses[course.code]);
                      const isCourseSelected = selectedCourseCodes.has(course.code);

                      return (
                        <article className="scheduling-course-card" key={course.code}>
                          <div className="scheduling-course-header">
                            <div>
                              <span>{course.category}</span>
                              <h4>
                                {course.code} {course.title}
                              </h4>
                            </div>
                            <div className="scheduling-course-actions">
                              <strong>{course.credits} credits</strong>
                              <button
                                className="scheduling-toggle-btn"
                                type="button"
                                onClick={() => toggleCourse(course.code)}
                                aria-expanded={isCourseExpanded}
                                aria-label={isCourseExpanded ? "Collapse course" : "Expand course"}
                                title={isCourseExpanded ? "Collapse course" : "Expand course"}
                              >
                                <span aria-hidden="true">{isCourseExpanded ? "▾" : "▸"}</span>
                              </button>
                            </div>
                          </div>

                          <p>{course.description}</p>

                          <div className="scheduling-course-meta">
                            <span>{course.numberOfSections} sections</span>
                            <span>{course.sectionSummary}</span>
                            {isCourseSelected && <span>Section selected in draft</span>}
                          </div>

                          {isCourseExpanded && (
                            <div className="scheduling-section-list">
                              {course.sections.map((section) => {
                                const sectionKey = `${course.code}-${section.sectionNumber}`;
                                const isSelected = selectedSectionKeys.has(sectionKey);
                                const isUnavailable =
                                  isSubmitted ||
                                  section.seatStatus === "Full" ||
                                  (isCourseSelected && !isSelected);

                                return (
                                  <div className="scheduling-section-row" key={sectionKey}>
                                    <div>
                                      <strong>Section {section.sectionNumber}</strong>
                                      <span>{section.instructor}</span>
                                    </div>
                                    <span>
                                      {section.days} {section.time}
                                    </span>
                                    <span>{section.location}</span>
                                    <span>
                                      {section.seatsRemaining} of {section.capacity} seats open
                                    </span>
                                    <span
                                      className={`scheduling-seat-status ${getSeatStatusClass(section.seatStatus)}`}
                                    >
                                      {section.seatStatus}
                                    </span>
                                    <button
                                      className="scheduling-add-btn"
                                      type="button"
                                      disabled={isUnavailable || isSelected}
                                      onClick={() => addSection(course, section)}
                                    >
                                      {isSelected ? "Selected ✓" : isSubmitted ? "Submitted" : "Add Section"}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            ))}

            {groupedCourses.length === 0 && (
              <div className="scheduling-placeholder-card">
                <h4>No offerings available</h4>
                <p>
                  {termOfferedCourses.length === 0
                    ? `${selectedTerm} has no configured offerings in mock data. ${selectedTermStatus.message}`
                    : "Try searching by a course code, title, track, or description."}
                </p>
              </div>
            )}
          </div>
        </div>

        <aside className="panel-card scheduling-selected-panel">
          <div className="panel-header">
            <h3>Selected Schedule</h3>
            <p>{selectedSchedule.length} selected sections in this draft.</p>
          </div>

          {selectedSchedule.length === 0 ? (
            <div className="scheduling-placeholder-card">
              <h4>No sections selected yet</h4>
              <p>
                Start by expanding a course and selecting an open section. This schedule remains a
                draft until submitted.
              </p>
            </div>
          ) : (
            <div className="scheduling-selected-list">
              {selectedSchedule.map((item) => (
                <article className="scheduling-selected-card" key={`${item.courseCode}-${item.sectionNumber}`}>
                  <div>
                    <h4>
                      {item.courseCode} {item.title}
                    </h4>
                    <span>
                      Section {item.sectionNumber} - {item.days} {item.time}
                    </span>
                    <span>{item.credits} credits</span>
                    <span className={`scheduling-seat-status ${getSeatStatusClass(item.seatStatus)}`}>
                      {item.seatStatus}
                    </span>
                  </div>
                  <button
                    className="scheduling-remove-btn"
                    type="button"
                    disabled={isSubmitted}
                    onClick={() => removeSection(item.courseCode)}
                  >
                    Remove
                  </button>
                </article>
              ))}
            </div>
          )}

          <div className="scheduling-draft-note">
            Draft plans do not update Academic Progress, do not appear as In Progress, and do not
            reduce official seat availability. Draft and submitted mock schedules are saved only in
            localStorage until backend persistence replaces this later.
          </div>
          {isSubmitted && (
            <div className="scheduling-submitted-note">
              This submitted schedule is now considered In Progress for {submittedSchedule.term}.
            </div>
          )}
          <div className="scheduling-credit-guidance">Recommended load: 12-18 credits</div>

          <button
            className="scheduling-validate-btn"
            type="button"
            disabled={selectedSchedule.length === 0 || !canEditSelectedTerm}
            onClick={validatePlan}
          >
            Validate Plan
          </button>
          {isSubmitted && selectedTermStatus.editable && (
            <button className="scheduling-edit-btn" type="button" onClick={editDraft}>
              Edit Draft
            </button>
          )}
        </aside>
      </section>

      <section className="panel-card scheduling-summary-strip">
        <div>
          <span>{isSubmitted ? "Submitted Sections" : "Draft Courses"}</span>
          <strong>{selectedSchedule.length}</strong>
        </div>
        <div>
          <span>{isSubmitted ? "Submitted Credits" : "Draft Credits"}</span>
          <strong>{totalDraftCredits}</strong>
          <small>Recommended load: 12-18 credits</small>
        </div>
        <div>
          <span>Selected Term</span>
          <strong>{selectedTerm}</strong>
        </div>
        <div>
          <span>Draft Status</span>
          <strong>{validationStatus}</strong>
        </div>
      </section>

      {hasValidated && (
        <section className="panel-card scheduling-validation-section">
          <div className="panel-header">
            <h3>Validation Results</h3>
            <p>
              {isSubmitted
                ? "This submitted schedule passed mock validation before submission."
                : "Validation checks this local draft only. It does not submit the plan or update Academic Progress."}
            </p>
          </div>

          {blockingIssues.length === 0 && warningIssues.length === 0 ? (
            <div className="scheduling-validation-success">
              <strong>{isSubmitted ? "Submitted schedule passed validation." : "Draft plan is valid."}</strong>
              <span>
                {isSubmitted
                  ? "This schedule is now considered In Progress for the selected term."
                  : "This plan can move toward final submission."}
              </span>
            </div>
          ) : (
            <>
              <div className={`scheduling-validation-summary ${blockingIssues.length > 0 ? "error" : "warning"}`}>
                <strong>
                  {blockingIssues.length > 0
                    ? "Draft plan has issues that must be fixed before submission."
                    : "Draft plan has warnings."}
                </strong>
                <span>
                  {blockingIssues.length > 0
                    ? "Resolve blocking errors before this draft can be submitted."
                    : "Warnings are non-blocking, but should be reviewed before submission."}
                </span>
              </div>
            <div className="scheduling-issue-list">
              {validationIssues.map((issue, index) => (
                <article
                  className={`scheduling-issue-card ${issue.severity}`}
                  key={`${issue.type}-${index}`}
                >
                  <div>
                    <strong>{issue.type}</strong>
                    <span>{issue.affectedCourse}</span>
                  </div>
                  <p>{issue.explanation}</p>
                  <p>{issue.impact}</p>
                </article>
              ))}
            </div>
            </>
          )}
        </section>
      )}

      {hasValidated && suggestions.length > 0 && (
        <section className="panel-card scheduling-suggestions-section">
          <div className="panel-header">
            <h3>Suggestions and Path Guidance</h3>
            <p>Issue-based next steps for improving this draft schedule.</p>
          </div>

          <div className="scheduling-suggestion-list">
            {suggestions.map((suggestion, index) => (
              <article className="scheduling-suggestion-card" key={`${suggestion.title}-${index}`}>
                <strong>{suggestion.title}</strong>
                <span>{suggestion.message}</span>
              </article>
            ))}
          </div>

          {validationIssues
            .filter((issue) => issue.pathGuidance)
            .map((issue) => (
              <article className="scheduling-path-guidance-card" key={issue.pathGuidance.course}>
                <div className="scheduling-path-guidance-header">
                  <h4>{issue.pathGuidance.course}</h4>
                  <span>Not eligible for this term</span>
                </div>
                <dl>
                  <div>
                    <dt>Reason unavailable</dt>
                    <dd>{issue.pathGuidance.reasonUnavailable}</dd>
                  </div>
                  <div>
                    <dt>Missing prerequisite</dt>
                    <dd>{issue.pathGuidance.missingPrerequisite}</dd>
                  </div>
                  <div>
                    <dt>Next step</dt>
                    <dd>{issue.pathGuidance.nextStep}</dd>
                  </div>
                </dl>
              </article>
            ))}
        </section>
      )}

      {!isSubmitted && (
        <section className="panel-card scheduling-inactive-placeholders">
          <div>
            <h3>Final Submission</h3>
            <p>
              Submit only after validation passes and the submission window is open. Backend seat
              updates will come later.
            </p>
            <ul className="scheduling-submission-checklist">
              {submissionChecklist.map((item) => (
                <li className={item.complete ? "complete" : "incomplete"} key={item.label}>
                  <span>{item.complete ? "✓" : "○"}</span>
                  {item.label}
                </li>
              ))}
            </ul>
            {submissionDisabledReason && (
              <div className="scheduling-submit-reason">{submissionDisabledReason}</div>
            )}
            <button
              className="scheduling-submit-btn"
              type="button"
              disabled={!canSubmitFinalSchedule}
              onClick={submitFinalSchedule}
            >
              Submit Final Schedule
            </button>
            <span>
              Only submitted valid plans become In Progress. Draft validation alone does not update
              Academic Progress.
            </span>
          </div>
        </section>
      )}

      {isSubmitted && (
        <section className="panel-card scheduling-submission-success">
          <div>
            <h3>Schedule Submitted</h3>
            <p>
              This submitted schedule is now considered In Progress for the selected term. Real seat
              availability will not change until backend integration is added.
            </p>
          </div>
          <div className="scheduling-submitted-summary">
            <div>
              <span>Submitted Term</span>
              <strong>{submittedSchedule.term}</strong>
            </div>
            <div>
              <span>Submitted Sections</span>
              <strong>{submittedSchedule.sectionCount}</strong>
            </div>
            <div>
              <span>Submitted Credits</span>
              <strong>{submittedSchedule.credits}</strong>
            </div>
          </div>
          {selectedTermStatus.editable && (
            <button className="scheduling-edit-btn" type="button" onClick={editDraft}>
              Edit Draft
            </button>
          )}
        </section>
      )}
    </DashboardLayout>
  );
}

export default SchedulingAssistant;
