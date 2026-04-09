import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Calendar as CalendarIcon,
  Download,
  Pencil,
  Sun,
  Moon,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isWithinInterval,
  addMonths,
  subMonths,
  getDay,
  isToday,
} from "date-fns";
import "./WallCalendar.css";

// ⚠️ VITE ENV INJECTION: Ensure your .env file has VITE_API_NINJAS_KEY=your_key_here
const API_NINJAS_KEY = import.meta.env.VITE_API_NINJAS_KEY || "";

// --- Constants & Mock Data ---
const MONTH_IMAGES = [
  "https://images.unsplash.com/photo-1641755842771-165180b90ba2?q=80&w=800",
  "https://images.unsplash.com/photo-1712860308569-11a26d25cef8?q=80&w=800",
  "https://images.unsplash.com/photo-1668487103585-0ec72fb7a941?q=80&w=800",
  "https://images.unsplash.com/photo-1661953029179-e1b0dc900490?q=80&w=800",
  "https://images.unsplash.com/photo-1713009361693-9687f038b25e?q=80&w=800",
  "https://images.unsplash.com/photo-1664493115827-573d5669f032?q=80&w=800",
  "https://images.unsplash.com/photo-1641755842771-165180b90ba2?q=80&w=800",
  "https://images.unsplash.com/photo-1712860308569-11a26d25cef8?q=80&w=800",
  "https://images.unsplash.com/photo-1668487103585-0ec72fb7a941?q=80&w=800",
  "https://images.unsplash.com/photo-1661953029179-e1b0dc900490?q=80&w=800",
  "https://images.unsplash.com/photo-1713009361693-9687f038b25e?q=80&w=800",
  "https://images.unsplash.com/photo-1664493115827-573d5669f032?q=80&w=800",
];

const MONTH_THEMES = [
  { primary: "#4A90E2", secondary: "#E3F2FD", accent: "#1976D2" },
  { primary: "#E91E63", secondary: "#FCE4EC", accent: "#C2185B" },
  { primary: "#4CAF50", secondary: "#E8F5E9", accent: "#388E3C" },
  { primary: "#FF9800", secondary: "#FFF3E0", accent: "#F57C00" },
  { primary: "#9C27B0", secondary: "#F3E5F5", accent: "#7B1FA2" },
  { primary: "#00BCD4", secondary: "#E0F7FA", accent: "#0097A7" },
  { primary: "#FF5722", secondary: "#FBE9E7", accent: "#E64A19" },
  { primary: "#3F51B5", secondary: "#E8EAF6", accent: "#303F9F" },
  { primary: "#795548", secondary: "#EFEBE9", accent: "#5D4037" },
  { primary: "#F44336", secondary: "#FFEBEE", accent: "#D32F2F" },
  { primary: "#607D8B", secondary: "#ECEFF1", accent: "#455A64" },
  { primary: "#4A90E2", secondary: "#E3F2FD", accent: "#1976D2" },
];

const NOTE_CATEGORIES = {
  general: { color: "#6b7280", label: "Gen" },
  work: { color: "#ef4444", label: "Work" },
  personal: { color: "#10b981", label: "Pers" },
  urgent: { color: "#f59e0b", label: "Urg" },
};

const FALLBACK_HOLIDAYS = {
  "01-01": { name: "New Year" },
  "01-26": { name: "Republic Day" },
  "08-15": { name: "Independence Day" },
  "10-02": { name: "Gandhi Jayanti" },
  "12-25": { name: "Christmas" },
};

// --- Custom Physics Variants for Realistic Paper Flip ---
const flipVariants = {
  enter: (direction) => ({
    // If going NEXT, new page is flat and fades in underneath.
    // If going PREV, new page starts flipped up (-90deg) and drops down.
    rotateX: direction > 0 ? 0 : -90,
    opacity: direction > 0 ? 0 : 1,
    zIndex: direction > 0 ? 0 : 10,
    boxShadow: direction > 0 ? "none" : "0 20px 40px rgba(0,0,0,0.6)",
  }),
  center: {
    rotateX: 0,
    opacity: 1,
    zIndex: 5,
    boxShadow: "0 0px 0px rgba(0,0,0,0)",
  },
  exit: (direction) => ({
    // If going NEXT, current page flips UP (-90deg) and away.
    // If going PREV, current page stays flat and is covered by the falling page.
    rotateX: direction > 0 ? -90 : 0,
    opacity: direction > 0 ? 1 : 0,
    zIndex: direction > 0 ? 10 : 0,
    boxShadow: direction > 0 ? "0 20px 40px rgba(0,0,0,0.6)" : "none",
  }),
};

export function WallCalendar() {
  const [currentDate, setCurrentDate] = useState(
    new Date("2026-04-01T00:00:00"),
  );
  const [selectedRange, setSelectedRange] = useState({
    start: null,
    end: null,
  });
  const [direction, setDirection] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);

  // App State
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [holidays, setHolidays] = useState({});
  const [notes, setNotes] = useState([]);
  const [currentNote, setCurrentNote] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("general");
  const [editingNoteId, setEditingNoteId] = useState(null);

  // Storage Persistence
  useEffect(() => {
    const savedNotes = localStorage.getItem("calendar-notes");
    if (savedNotes) {
      setNotes(
        JSON.parse(savedNotes).map((n) => ({
          ...n,
          dateRange: {
            start: n.dateRange.start ? new Date(n.dateRange.start) : null,
            end: n.dateRange.end ? new Date(n.dateRange.end) : null,
          },
        })),
      );
    }
    const savedTheme = localStorage.getItem("calendar-theme");
    if (savedTheme === "light") setIsDarkMode(false);
  }, []);

  useEffect(() => {
    localStorage.setItem("calendar-notes", JSON.stringify(notes));
  }, [notes]);
  useEffect(() => {
    localStorage.setItem("calendar-theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  // Robust API Fetch
  useEffect(() => {
    const fetchHolidays = async () => {
      const year = currentDate.getFullYear();
      console.log(`[API] Fetching holidays for India, Year: ${year}...`);

      try {
        if (!API_NINJAS_KEY) throw new Error("API Key missing from .env");

        // Removed the specific `type` parameter which frequently causes 400 Bad Requests
        const res = await fetch(
          `https://api.api-ninjas.com/v1/holidays?country=IN`,
          { headers: { "X-Api-Key": API_NINJAS_KEY } },
        );

        if (!res.ok) {
          const errText = await res.text();
          console.error(`[API] Fetch failed. Status: ${res.status}.`, errText);
          throw new Error("API Offline or Bad Request");
        }

        const data = await res.json();
        console.log(`[API] Success! Fetched ${data.length} holidays.`);

        const holidayMap = {};
        data.forEach((h) => {
          holidayMap[h.date.substring(5)] = { name: h.name };
        });
        setHolidays(holidayMap);
      } catch (error) {
        console.error(
          "[API] Caught Error:",
          error.message,
          "-> Using fallback data.",
        );
        setHolidays(FALLBACK_HOLIDAYS);
      }
    };
    fetchHolidays();
  }, [currentDate.getFullYear()]);

  // Derived Values
  const currentTheme = MONTH_THEMES[currentDate.getMonth()];
  const currentMonthImage = MONTH_IMAGES[currentDate.getMonth()];
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const firstDayOfWeek = getDay(monthStart);

  const visibleNotes = notes.filter((n) => {
    if (!n.dateRange.start) return false;
    const noteDate = new Date(n.dateRange.start);
    return (
      noteDate.getMonth() === currentDate.getMonth() &&
      noteDate.getFullYear() === currentDate.getFullYear()
    );
  });

  // Actions
  const handleDateClick = (date) => {
    if (!selectedRange.start || (selectedRange.start && selectedRange.end)) {
      setSelectedRange({ start: date, end: null });
    } else {
      date < selectedRange.start
        ? setSelectedRange({ start: date, end: selectedRange.start })
        : setSelectedRange({ start: selectedRange.start, end: date });
    }
  };

  const handleSaveNote = () => {
    if (!currentNote.trim()) return;
    const rangeToSave = selectedRange.start
      ? { ...selectedRange }
      : { start: currentDate, end: null };

    if (editingNoteId) {
      setNotes(
        notes.map((n) =>
          n.id === editingNoteId
            ? {
                ...n,
                text: currentNote,
                category: selectedCategory,
                dateRange: rangeToSave,
              }
            : n,
        ),
      );
      setEditingNoteId(null);
    } else {
      setNotes([
        {
          id: Date.now().toString(),
          text: currentNote,
          category: selectedCategory,
          dateRange: rangeToSave,
        },
        ...notes,
      ]);
    }
    setCurrentNote("");
    setSelectedCategory("general");
  };

  const editNote = (note) => {
    setCurrentNote(note.text);
    setSelectedCategory(note.category || "general");
    setEditingNoteId(note.id);
    setSelectedRange(note.dateRange);
  };

  const exportNotes = () => {
    const textContent = visibleNotes
      .map(
        (n) =>
          `[${NOTE_CATEGORIES[n.category || "general"].label}] ${formatNoteDate(n.dateRange)}: \n${n.text}\n`,
      )
      .join("\n---\n\n");
    const blob = new Blob([textContent || "No notes for this month."], {
      type: "text/plain",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `notes_${format(currentDate, "MMM_yyyy")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isDateInRange = (date) =>
    selectedRange.start &&
    (selectedRange.end
      ? isWithinInterval(date, {
          start: selectedRange.start,
          end: selectedRange.end,
        })
      : isSameDay(date, selectedRange.start));
  const isStart = (date) =>
    selectedRange.start && isSameDay(date, selectedRange.start);
  const isEnd = (date) =>
    selectedRange.end && isSameDay(date, selectedRange.end);
  const formatNoteDate = (range) =>
    !range.start
      ? "General"
      : !range.end || isSameDay(range.start, range.end)
        ? format(range.start, "MMM d")
        : `${format(range.start, "MMM d")} - ${format(range.end, "d")}`;

  const wrapperStyle = {
    "--theme-primary": currentTheme.primary,
    "--theme-secondary": isDarkMode
      ? `${currentTheme.primary}40`
      : currentTheme.secondary,
    "--theme-accent": currentTheme.accent,
  };

  const totalCells = 42;
  const prefixEmptyDays = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
  const suffixEmptyDays = totalCells - (prefixEmptyDays + daysInMonth.length);

  return (
    <div
      className={`calendar-page-wrapper ${isDarkMode ? "dark" : "light"}`}
      style={wrapperStyle}
    >
      <div className="top-toolbar">
        <div className="toolbar-left">
          <button
            onClick={() => {
              setCurrentDate(new Date());
              setSelectedRange({ start: new Date(), end: null });
            }}
            className="toolbar-btn outline"
          >
            <CalendarIcon size={14} /> Today
          </button>
          <button onClick={exportNotes} className="toolbar-btn outline">
            <Download size={14} /> Export
          </button>
        </div>
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="toolbar-btn outline icon-only"
        >
          {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>

      <div className="calendar-main-container">
        <div className="calendar-nav">
          <button
            onClick={() => {
              setDirection(-1);
              setIsFlipping(true);
              setTimeout(() => {
                setCurrentDate(subMonths(currentDate, 1));
                setTimeout(() => setIsFlipping(false), 50);
              }, 350);
            }}
            className="nav-btn"
            disabled={isFlipping}
          >
            <ChevronLeft size={20} />
          </button>
          <div className="nav-title-area">
            <div className="month-title" style={{ color: "var(--text-main)" }}>
              {format(currentDate, "MMMM yyyy")}
            </div>
          </div>
          <button
            onClick={() => {
              setDirection(1);
              setIsFlipping(true);
              setTimeout(() => {
                setCurrentDate(addMonths(currentDate, 1));
                setTimeout(() => setIsFlipping(false), 50);
              }, 350);
            }}
            className="nav-btn"
            disabled={isFlipping}
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="calendar-card-3d">
          <div className="calendar-hanger">
            <div className="nail"></div>
            <div className="wire"></div>
          </div>

          <div className="spiral-binding-bar">
            <div className="spiral-rings-container">
              {Array.from({ length: 15 }).map((_, i) => (
                <div key={i} className="spiral-ring">
                  <div className="spiral-ring-inner"></div>
                </div>
              ))}
            </div>
          </div>

          <div className="flip-wrapper">
            {/* Removed mode="wait" to allow simultaneous overlap peeling animations */}
            <AnimatePresence custom={direction}>
              <motion.div
                key={currentDate.getMonth()}
                custom={direction}
                variants={flipVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  type: "spring",
                  stiffness: 60,
                  damping: 14,
                  mass: 1,
                }}
                style={{
                  transformOrigin: "top center",
                  backfaceVisibility: "hidden",
                }}
                className="calendar-flip-content"
              >
                <div className="hero-section">
                  <img
                    src={currentMonthImage}
                    alt="Season"
                    className="hero-image"
                  />
                  <svg
                    className="hero-wave"
                    viewBox="0 0 500 150"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M0,80 L250,20 L500,60 L500,150 L0,150 Z"
                      fill="var(--theme-primary)"
                      opacity="0.9"
                    />
                    <path
                      d="M0,100 L200,50 L500,90 L500,150 L0,150 Z"
                      fill="var(--card-bg)"
                    />
                  </svg>
                  <div className="hero-text">
                    <div className="hero-year">
                      {format(currentDate, "yyyy")}
                    </div>
                    <div className="hero-month">
                      {format(currentDate, "MMMM").toUpperCase()}
                    </div>
                  </div>
                </div>

                <div className="calendar-body">
                  <div className="content-grid">
                    <div className="notes-area">
                      <div className="notes-header">Memos</div>
                      <div className="notes-list">
                        {visibleNotes.length === 0 ? (
                          <div className="empty-notes">
                            No notes for {format(currentDate, "MMM")}.
                          </div>
                        ) : (
                          visibleNotes.slice(0, 4).map((note) => (
                            <div key={note.id} className="note-slot">
                              <div
                                className="note-indicator"
                                style={{
                                  backgroundColor:
                                    NOTE_CATEGORIES[note.category || "general"]
                                      .color,
                                }}
                              ></div>
                              <div className="note-content">
                                <span className="note-date">
                                  {formatNoteDate(note.dateRange)}:
                                </span>
                                <span className="note-desc">{note.text}</span>
                              </div>
                              <div className="note-actions">
                                <button
                                  onClick={() => editNote(note)}
                                  className="icon-btn edit"
                                >
                                  <Pencil size={10} />
                                </button>
                                <button
                                  onClick={() =>
                                    setNotes(
                                      notes.filter((n) => n.id !== note.id),
                                    )
                                  }
                                  className="icon-btn delete"
                                >
                                  <X size={10} />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="grid-area">
                      <div className="day-headers">
                        {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map(
                          (day, i) => (
                            <div
                              key={day}
                              className={`day-header ${i >= 5 ? "weekend-header" : ""}`}
                            >
                              {day}
                            </div>
                          ),
                        )}
                      </div>

                      <div className="days-grid">
                        {Array.from({ length: prefixEmptyDays }).map((_, i) => (
                          <div
                            key={`empty-start-${i}`}
                            className="empty-cell"
                          />
                        ))}

                        {daysInMonth.map((date) => {
                          const inRange = isDateInRange(date);
                          const start = isStart(date);
                          const end = isEnd(date);
                          const holiday = holidays[format(date, "MM-dd")];

                          let cellClass = "day-cell";
                          if (start || end) cellClass += " is-endpoint";
                          else if (inRange) cellClass += " in-range";
                          else if (isToday(date)) cellClass += " is-today";
                          else if (getDay(date) === 0 || getDay(date) === 6)
                            cellClass += " is-weekend";

                          return (
                            <button
                              key={date.toISOString()}
                              onClick={() => handleDateClick(date)}
                              className={cellClass}
                            >
                              <span className="day-number">
                                {format(date, "d")}
                              </span>
                              {holiday && (
                                <span
                                  className="holiday-text"
                                  title={holiday.name}
                                >
                                  {holiday.name}
                                </span>
                              )}
                            </button>
                          );
                        })}

                        {Array.from({ length: suffixEmptyDays }).map((_, i) => (
                          <div key={`empty-end-${i}`} className="empty-cell" />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="add-note-section">
                    <div className="add-note-controls">
                      {selectedRange.start && (
                        <div className="selected-date-badge">
                          📅 {formatNoteDate(selectedRange)}
                        </div>
                      )}
                      <div className="category-selector">
                        {Object.entries(NOTE_CATEGORIES).map(([key, cat]) => (
                          <label
                            key={key}
                            className="category-label"
                            style={{ "--cat-color": cat.color }}
                          >
                            <input
                              type="radio"
                              name="category"
                              value={key}
                              checked={selectedCategory === key}
                              onChange={(e) =>
                                setSelectedCategory(e.target.value)
                              }
                            />
                            <span>{cat.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="note-input-row">
                      <input
                        type="text"
                        value={currentNote}
                        onChange={(e) => setCurrentNote(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSaveNote()}
                        placeholder="Add a note..."
                        className="note-input"
                      />
                      <button
                        onClick={handleSaveNote}
                        disabled={!currentNote.trim()}
                        className="add-note-btn"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {selectedRange.start && (
          <button
            onClick={() => setSelectedRange({ start: null, end: null })}
            className="clear-selection-btn"
          >
            <X size={12} /> Clear selection
          </button>
        )}
      </div>
    </div>
  );
}
