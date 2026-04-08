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
  "01-01": { name: "New Year", emoji: "🎉" },
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

  // App State
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [holidays, setHolidays] = useState({});
  const [notes, setNotes] = useState([]);
  const [currentNote, setCurrentNote] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("general");
  const [editingNoteId, setEditingNoteId] = useState(null);

  // Load Notes & Theme Preference
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
    if (savedTheme === "dark") setIsDarkMode(true);
  }, []);

  // Save Notes & Theme
  useEffect(() => {
    localStorage.setItem("calendar-notes", JSON.stringify(notes));
  }, [notes]);
  useEffect(() => {
    localStorage.setItem("calendar-theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  // Holiday API Fetch
  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const year = currentDate.getFullYear();
        const res = await fetch(
          `https://date.nager.at/api/v3/PublicHolidays/${year}/IN`,
        );
        if (!res.ok) throw new Error("API Offline");
        const data = await res.json();
        const holidayMap = {};
        data.forEach((h) => {
          holidayMap[h.date.substring(5)] = { name: h.name, emoji: "🇮🇳" };
        });
        setHolidays(holidayMap);
      } catch (error) {
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

  // Actions
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
      setNotes([
        {
          id: Date.now().toString(),
          text: currentNote,
          category: selectedCategory,
          dateRange: { ...selectedRange },
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
    const textContent = notes
      .map(
        (n) =>
          `[${NOTE_CATEGORIES[n.category || "general"].label}] ${formatNoteDate(n.dateRange)}: \n${n.text}\n`,
      )
      .join("\n---\n\n");
    const blob = new Blob([textContent || "No notes."], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "notes.txt";
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
  const formatNoteDate = (range) =>
    !range.start
      ? "Gen"
      : !range.end || isSameDay(range.start, range.end)
        ? format(range.start, "MMM d")
        : `${format(range.start, "MMM d")}-${format(range.end, "d")}`;

  // Dynamic CSS Variables
  const wrapperStyle = {
    "--theme-primary": currentTheme.primary,
    "--theme-secondary": isDarkMode
      ? `${currentTheme.primary}40`
      : currentTheme.secondary,
    "--theme-accent": currentTheme.accent,
  };

  return (
    <div
      className={`calendar-page-wrapper ${isDarkMode ? "dark" : "light"}`}
      style={wrapperStyle}
    >
      {/* Top Toolbar */}
      <div className="top-toolbar">
        <div className="toolbar-left">
          <button onClick={jumpToToday} className="toolbar-btn outline">
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
        {/* Navigation */}
        <div className="calendar-nav">
          <button
            onClick={() => {
              setDirection(-1);
              setIsFlipping(true);
              setTimeout(() => {
                setCurrentDate(subMonths(currentDate, 1));
                setTimeout(() => setIsFlipping(false), 50);
              }, 300);
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
              }, 300);
            }}
            className="nav-btn"
            disabled={isFlipping}
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* 3D Calendar Card */}
        <div className="calendar-card-3d">
          {/* Hardware Hanger */}
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

          {/* Top-Hinged Flip Animation */}
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentDate.getMonth()}
              custom={direction}
              initial={{ rotateX: direction > 0 ? -90 : 90, opacity: 0 }}
              animate={{ rotateX: 0, opacity: 1 }}
              exit={{ rotateX: direction > 0 ? 90 : -90, opacity: 0 }}
              transition={{ type: "spring", stiffness: 100, damping: 15 }}
              style={{ transformOrigin: "top center" }}
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
                  <div className="hero-year">{format(currentDate, "yyyy")}</div>
                  <div className="hero-month">
                    {format(currentDate, "MMMM").toUpperCase()}
                  </div>
                </div>
              </div>

              <div className="calendar-body">
                <div className="content-grid">
                  {/* Notes Area */}
                  <div className="notes-area">
                    <div className="notes-header">Memos & Notes</div>
                    <div className="notes-list">
                      {notes.length === 0 ? (
                        <div className="empty-notes">No notes yet.</div>
                      ) : (
                        notes.slice(0, 4).map((note) => (
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
                            {format(date, "d")}
                            {holiday && (
                              <span
                                className="holiday-emoji"
                                title={holiday.name}
                              >
                                {holiday.emoji}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Add Note Section */}
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
