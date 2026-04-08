import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Calendar as CalendarIcon,
  Download,
  Pencil,
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

// --- Constants & Mock Data ---
const MONTH_IMAGES = [
  "https://images.unsplash.com/photo-1641755842771-165180b90ba2?q=80&w=800", // Jan
  "https://images.unsplash.com/photo-1712860308569-11a26d25cef8?q=80&w=800", // Feb
  "https://images.unsplash.com/photo-1668487103585-0ec72fb7a941?q=80&w=800", // Mar
  "https://images.unsplash.com/photo-1661953029179-e1b0dc900490?q=80&w=800", // Apr
  "https://images.unsplash.com/photo-1713009361693-9687f038b25e?q=80&w=800", // May
  "https://images.unsplash.com/photo-1664493115827-573d5669f032?q=80&w=800", // Jun
  "https://images.unsplash.com/photo-1641755842771-165180b90ba2?q=80&w=800", // Jul
  "https://images.unsplash.com/photo-1712860308569-11a26d25cef8?q=80&w=800", // Aug
  "https://images.unsplash.com/photo-1668487103585-0ec72fb7a941?q=80&w=800", // Sep
  "https://images.unsplash.com/photo-1661953029179-e1b0dc900490?q=80&w=800", // Oct
  "https://images.unsplash.com/photo-1713009361693-9687f038b25e?q=80&w=800", // Nov
  "https://images.unsplash.com/photo-1664493115827-573d5669f032?q=80&w=800", // Dec
];

// Seasonal Themes mapping to CSS Variables
const MONTH_THEMES = [
  { primary: "#4A90E2", secondary: "#E3F2FD", accent: "#1976D2" }, // Jan
  { primary: "#E91E63", secondary: "#FCE4EC", accent: "#C2185B" }, // Feb
  { primary: "#4CAF50", secondary: "#E8F5E9", accent: "#388E3C" }, // Mar
  { primary: "#FF9800", secondary: "#FFF3E0", accent: "#F57C00" }, // Apr
  { primary: "#9C27B0", secondary: "#F3E5F5", accent: "#7B1FA2" }, // May
  { primary: "#00BCD4", secondary: "#E0F7FA", accent: "#0097A7" }, // Jun
  { primary: "#FF5722", secondary: "#FBE9E7", accent: "#E64A19" }, // Jul
  { primary: "#3F51B5", secondary: "#E8EAF6", accent: "#303F9F" }, // Aug
  { primary: "#795548", secondary: "#EFEBE9", accent: "#5D4037" }, // Sep
  { primary: "#F44336", secondary: "#FFEBEE", accent: "#D32F2F" }, // Oct
  { primary: "#607D8B", secondary: "#ECEFF1", accent: "#455A64" }, // Nov
  { primary: "#4A90E2", secondary: "#E3F2FD", accent: "#1976D2" }, // Dec
];

const NOTE_CATEGORIES = {
  general: { color: "#6b7280", label: "General" },
  work: { color: "#ef4444", label: "Work" },
  personal: { color: "#10b981", label: "Personal" },
  urgent: { color: "#f59e0b", label: "Urgent" },
};

const FALLBACK_HOLIDAYS = {
  "01-01": { name: "New Year's Day", emoji: "🎉" },
  "01-26": { name: "Republic Day", emoji: "🇮🇳" },
  "08-15": { name: "Independence Day", emoji: "🇮🇳" },
  "10-02": { name: "Gandhi Jayanti", emoji: "🕊️" },
  "12-25": { name: "Christmas", emoji: "🎄" },
};

export function WallCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedRange, setSelectedRange] = useState({
    start: null,
    end: null,
  });
  const [direction, setDirection] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);

  // Feature States
  const [holidays, setHolidays] = useState({});
  const [manualTheme, setManualTheme] = useState(null); // Overrides seasonal theme
  const [notes, setNotes] = useState([]);
  const [currentNote, setCurrentNote] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("general");
  const [editingNoteId, setEditingNoteId] = useState(null);

  // 1. Load Notes from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem("calendar-notes");
    if (saved) {
      setNotes(
        JSON.parse(saved).map((n) => ({
          ...n,
          dateRange: {
            start: n.dateRange.start ? new Date(n.dateRange.start) : null,
            end: n.dateRange.end ? new Date(n.dateRange.end) : null,
          },
        })),
      );
    }
  }, []);

  // 2. Save Notes to LocalStorage
  useEffect(() => {
    localStorage.setItem("calendar-notes", JSON.stringify(notes));
  }, [notes]);

  // 3. Real API Fetch with Graceful Fallback
  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const year = currentDate.getFullYear();
        // Public API for holidays
        const res = await fetch(
          `https://date.nager.at/api/v3/PublicHolidays/${year}/IN`,
        );
        if (!res.ok) throw new Error("API Rate Limit or Offline");

        const data = await res.json();
        const holidayMap = {};
        data.forEach((h) => {
          const monthDay = h.date.substring(5); // Extracts MM-DD
          holidayMap[monthDay] = { name: h.name, emoji: "🇮🇳" };
        });
        setHolidays(holidayMap);
      } catch (error) {
        console.warn("Using fallback holidays:", error.message);
        setHolidays(FALLBACK_HOLIDAYS);
      }
    };
    fetchHolidays();
  }, [currentDate.getFullYear()]); // Refetch if year changes

  // Date Logic Helpers
  const currentTheme = manualTheme || MONTH_THEMES[currentDate.getMonth()];
  const currentMonthImage = MONTH_IMAGES[currentDate.getMonth()];
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const firstDayOfWeek = getDay(monthStart);

  // --- Interaction Handlers ---

  const jumpToToday = () => {
    setCurrentDate(new Date());
    setSelectedRange({ start: new Date(), end: null });
  };

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

    if (editingNoteId) {
      setNotes(
        notes.map((n) =>
          n.id === editingNoteId
            ? { ...n, text: currentNote, category: selectedCategory }
            : n,
        ),
      );
      setEditingNoteId(null);
    } else {
      const newNote = {
        id: Date.now().toString(),
        text: currentNote,
        category: selectedCategory,
        dateRange: { ...selectedRange },
      };
      setNotes([newNote, ...notes]);
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

  const deleteNote = (id) => {
    setNotes(notes.filter((n) => n.id !== id));
  };

  const exportNotes = () => {
    const textContent = notes
      .map((n) => {
        const dateStr = formatNoteDate(n.dateRange);
        const category = NOTE_CATEGORIES[n.category || "general"].label;
        return `[${category}] ${dateStr}: \n${n.text}\n`;
      })
      .join("\n---\n\n");

    const blob = new Blob([textContent || "No notes to export."], {
      type: "text/plain",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "my-calendar-notes.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Conditionals
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
  const getHoliday = (date) => holidays[format(date, "MM-dd")];
  const formatNoteDate = (range) =>
    !range.start
      ? "General"
      : !range.end || isSameDay(range.start, range.end)
        ? format(range.start, "MMM d")
        : `${format(range.start, "MMM d")} - ${format(range.end, "d")}`;

  // Inject CSS variables for the theme
  const wrapperStyle = {
    "--theme-primary": currentTheme.primary,
    "--theme-secondary": currentTheme.secondary,
    "--theme-accent": currentTheme.accent,
  };

  return (
    <div className="calendar-page-wrapper" style={wrapperStyle}>
      {/* Top Features Toolbar */}
      <div className="top-toolbar">
        <div className="toolbar-left">
          <button onClick={jumpToToday} className="toolbar-btn outline">
            <CalendarIcon size={14} /> Today
          </button>
          <button onClick={exportNotes} className="toolbar-btn outline">
            <Download size={14} /> Export Notes
          </button>
        </div>

        <div className="theme-selector">
          <span className="theme-label">Theme:</span>
          <button
            onClick={() => setManualTheme(null)}
            className={`theme-dot ${!manualTheme ? "active" : ""}`}
            title="Auto Season"
            style={{ background: "linear-gradient(45deg, #4A90E2, #4CAF50)" }}
          ></button>
          {/* A few manual theme options */}
          <button
            onClick={() => setManualTheme(MONTH_THEMES[0])}
            className={`theme-dot ${manualTheme?.primary === MONTH_THEMES[0].primary ? "active" : ""}`}
            style={{ backgroundColor: MONTH_THEMES[0].primary }}
          ></button>
          <button
            onClick={() => setManualTheme(MONTH_THEMES[2])}
            className={`theme-dot ${manualTheme?.primary === MONTH_THEMES[2].primary ? "active" : ""}`}
            style={{ backgroundColor: MONTH_THEMES[2].primary }}
          ></button>
          <button
            onClick={() => setManualTheme(MONTH_THEMES[9])}
            className={`theme-dot ${manualTheme?.primary === MONTH_THEMES[9].primary ? "active" : ""}`}
            style={{ backgroundColor: MONTH_THEMES[9].primary }}
          ></button>
        </div>
      </div>

      <div className="calendar-main-container">
        {/* Navigation */}
        <div className="calendar-nav">
          <button
            onClick={() => {
              setDirection(-1);
              setIsFlipping(true);
              setTimeout(() => {
                setCurrentDate(subMonths(currentDate, 1));
                setTimeout(() => setIsFlipping(false), 300);
              }, 150);
            }}
            className="nav-btn"
            disabled={isFlipping}
          >
            <ChevronLeft size={20} />
          </button>
          <div className="nav-title-area">
            <div className="month-title">
              {format(currentDate, "MMMM yyyy")}
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
          <button
            onClick={() => {
              setDirection(1);
              setIsFlipping(true);
              setTimeout(() => {
                setCurrentDate(addMonths(currentDate, 1));
                setTimeout(() => setIsFlipping(false), 300);
              }, 150);
            }}
            className="nav-btn"
            disabled={isFlipping}
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* 3D Calendar Card */}
        <motion.div
          className="calendar-card-3d"
          animate={{ rotateY: isFlipping ? (direction > 0 ? 10 : -10) : 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="spiral-binding-bar">
            <div className="spiral-rings-container">
              {Array.from({ length: 15 }).map((_, i) => (
                <div key={i} className="spiral-ring">
                  <div className="spiral-ring-inner"></div>
                </div>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentDate.getMonth()}
              custom={direction}
              initial={{ rotateY: direction > 0 ? 180 : -180, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: direction > 0 ? -180 : 180, opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              className="calendar-flip-content"
            >
              {/* Hero */}
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
                    fill="white"
                  />
                </svg>
                <div className="hero-text">
                  <div className="hero-year">{format(currentDate, "yyyy")}</div>
                  <div className="hero-month">
                    {format(currentDate, "MMMM").toUpperCase()}
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="calendar-body">
                <div className="content-grid">
                  {/* Notes Area */}
                  <div className="notes-area">
                    <div className="notes-header">Memos & Notes</div>
                    <div className="notes-list">
                      {notes.length === 0 ? (
                        <div className="empty-notes">
                          No notes yet. Add one below!
                        </div>
                      ) : (
                        notes.slice(0, 8).map((note) => (
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
                                <Pencil size={12} />
                              </button>
                              <button
                                onClick={() => deleteNote(note.id)}
                                className="icon-btn delete"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Grid Area */}
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
                      {Array.from({
                        length: firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1,
                      }).map((_, i) => (
                        <div key={`empty-${i}`} className="empty-cell" />
                      ))}
                      {daysInMonth.map((date) => {
                        const inRange = isDateInRange(date);
                        const start = isStart(date);
                        const end = isEnd(date);
                        const holiday = getHoliday(date);
                        const today = isToday(date);
                        const isWeekend =
                          getDay(date) === 0 || getDay(date) === 6;

                        let cellClass = "day-cell";
                        if (start || end) cellClass += " is-endpoint";
                        else if (inRange) cellClass += " in-range";
                        else if (today) cellClass += " is-today";
                        else if (isWeekend) cellClass += " is-weekend";

                        return (
                          <motion.button
                            key={date.toISOString()}
                            onClick={() => handleDateClick(date)}
                            className={cellClass}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {format(date, "d")}
                            {holiday && (
                              <span
                                className="holiday-emoji"
                                title={holiday.name}
                              >
                                {holiday.emoji}
                              </span>
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Add Note Area */}
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
                      placeholder={
                        editingNoteId
                          ? "Update your note..."
                          : "Add a new note..."
                      }
                      className="note-input"
                    />
                    <button
                      onClick={handleSaveNote}
                      disabled={!currentNote.trim()}
                      className="add-note-btn"
                    >
                      {editingNoteId ? "Update" : "Add"}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Legend */}
        <div className="legend-section">
          <div className="legend-item">
            <div className="legend-box border-only"></div>
            <span>Today</span>
          </div>
          <div className="legend-item">
            <div className="legend-box primary-bg"></div>
            <span>Selected</span>
          </div>
          <div className="legend-item">
            <div className="legend-box secondary-bg"></div>
            <span>Range</span>
          </div>
          <div className="legend-item">
            <span className="weekend-text font-semibold">SAT/SUN</span>
            <span>Weekend</span>
          </div>
        </div>
      </div>
    </div>
  );
}
