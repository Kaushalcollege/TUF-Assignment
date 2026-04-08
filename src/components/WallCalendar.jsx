import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
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

// Seasonal images for each month
const MONTH_IMAGES = [
  "https://images.unsplash.com/photo-1641755842771-165180b90ba2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
  "https://images.unsplash.com/photo-1641755842771-165180b90ba2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
  "https://images.unsplash.com/photo-1712860308569-11a26d25cef8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
  "https://images.unsplash.com/photo-1712860308569-11a26d25cef8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
  "https://images.unsplash.com/photo-1668487103585-0ec72fb7a941?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
  "https://images.unsplash.com/photo-1661953029179-e1b0dc900490?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
  "https://images.unsplash.com/photo-1661953029179-e1b0dc900490?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
  "https://images.unsplash.com/photo-1713009361693-9687f038b25e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
  "https://images.unsplash.com/photo-1664493115827-573d5669f032?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
  "https://images.unsplash.com/photo-1664493115827-573d5669f032?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
  "https://images.unsplash.com/photo-1664493115827-573d5669f032?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
  "https://images.unsplash.com/photo-1641755842771-165180b90ba2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
];

// Theme colors for each month
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

const INDIAN_HOLIDAYS = {
  "01-01": { name: "New Year's Day", emoji: "🎉" },
  "01-26": { name: "Republic Day", emoji: "🇮🇳" },
  "08-15": { name: "Independence Day", emoji: "🇮🇳" },
  "10-02": { name: "Gandhi Jayanti", emoji: "🕊️" },
  "12-25": { name: "Christmas", emoji: "🎄" },
  // Truncated for brevity, feel free to add the rest back
};

export function WallCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedRange, setSelectedRange] = useState({
    start: null,
    end: null,
  });
  const [notes, setNotes] = useState([]);
  const [currentNote, setCurrentNote] = useState("");
  const [direction, setDirection] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);

  useEffect(() => {
    const savedNotes = localStorage.getItem("wallcalendar-notes");
    if (savedNotes) {
      const parsed = JSON.parse(savedNotes);
      setNotes(
        parsed.map((note) => ({
          ...note,
          dateRange: {
            start: note.dateRange.start ? new Date(note.dateRange.start) : null,
            end: note.dateRange.end ? new Date(note.dateRange.end) : null,
          },
        })),
      );
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("wallcalendar-notes", JSON.stringify(notes));
  }, [notes]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const firstDayOfWeek = getDay(monthStart);

  const currentTheme = MONTH_THEMES[currentDate.getMonth()];
  const currentMonthImage = MONTH_IMAGES[currentDate.getMonth()];

  const handlePrevMonth = () => {
    setDirection(-1);
    setIsFlipping(true);
    setTimeout(() => {
      setCurrentDate(subMonths(currentDate, 1));
      setTimeout(() => setIsFlipping(false), 300);
    }, 150);
  };

  const handleNextMonth = () => {
    setDirection(1);
    setIsFlipping(true);
    setTimeout(() => {
      setCurrentDate(addMonths(currentDate, 1));
      setTimeout(() => setIsFlipping(false), 300);
    }, 150);
  };

  const handleDateClick = (date) => {
    if (!selectedRange.start || (selectedRange.start && selectedRange.end)) {
      setSelectedRange({ start: date, end: null });
    } else {
      if (date < selectedRange.start) {
        setSelectedRange({ start: date, end: selectedRange.start });
      } else {
        setSelectedRange({ start: selectedRange.start, end: date });
      }
    }
  };

  const isDateInRange = (date) => {
    if (!selectedRange.start) return false;
    if (!selectedRange.end) return isSameDay(date, selectedRange.start);
    return isWithinInterval(date, {
      start: selectedRange.start,
      end: selectedRange.end,
    });
  };

  const isStartDate = (date) =>
    selectedRange.start && isSameDay(date, selectedRange.start);
  const isEndDate = (date) =>
    selectedRange.end && isSameDay(date, selectedRange.end);
  const getHoliday = (date) => INDIAN_HOLIDAYS[format(date, "MM-dd")];

  const addNote = () => {
    if (!currentNote.trim()) return;
    const newNote = {
      id: Date.now().toString(),
      text: currentNote,
      dateRange: { ...selectedRange },
      createdAt: new Date().toISOString(),
    };
    setNotes([newNote, ...notes]);
    setCurrentNote("");
  };

  const deleteNote = (id) => setNotes(notes.filter((note) => note.id !== id));
  const clearSelection = () => setSelectedRange({ start: null, end: null });

  const formatNoteDate = (range) => {
    if (!range.start) return "General";
    if (!range.end || isSameDay(range.start, range.end))
      return format(range.start, "MMM d");
    return `${format(range.start, "MMM d")}-${format(range.end, "d")}`;
  };

  return (
    <div className="calendar-page-wrapper">
      <div className="calendar-main-container">
        {/* Navigation */}
        <div className="calendar-nav">
          <button
            onClick={handlePrevMonth}
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
              <button onClick={clearSelection} className="clear-selection-btn">
                <X size={12} /> Clear selection
              </button>
            )}
          </div>

          <button
            onClick={handleNextMonth}
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
          {/* Spiral Binding */}
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
              {/* Hero Image Section */}
              <div className="hero-section">
                <img
                  src={currentMonthImage}
                  alt={format(currentDate, "MMMM")}
                  className="hero-image"
                />

                {/* SVG Wave */}
                <svg
                  className="hero-wave"
                  viewBox="0 0 500 150"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient
                      id="waveGradient"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="0%"
                    >
                      <stop
                        offset="0%"
                        style={{
                          stopColor: currentTheme.primary,
                          stopOpacity: 0.95,
                        }}
                      />
                      <stop
                        offset="100%"
                        style={{
                          stopColor: currentTheme.accent,
                          stopOpacity: 0.95,
                        }}
                      />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0,80 L250,20 L500,60 L500,150 L0,150 Z"
                    fill="url(#waveGradient)"
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

              {/* Body Section */}
              <div className="calendar-body">
                <div className="content-grid">
                  {/* Notes Area */}
                  <div className="notes-area">
                    <div className="notes-header">Notes</div>
                    {Array.from({ length: 7 }).map((_, i) => {
                      const note = notes[i];
                      return (
                        <div key={i} className="note-slot">
                          <div className="note-line">
                            {note && (
                              <div className="note-content">
                                <div className="note-text">
                                  <span
                                    style={{ color: currentTheme.primary }}
                                    className="note-date"
                                  >
                                    {formatNoteDate(note.dateRange)}:
                                  </span>
                                  <span className="note-desc">
                                    {note.text.length > 15
                                      ? note.text.substring(0, 15) + "..."
                                      : note.text}
                                  </span>
                                </div>
                                <button
                                  onClick={() => deleteNote(note.id)}
                                  className="delete-note-btn"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Grid Area */}
                  <div className="grid-area">
                    <div className="day-headers">
                      {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map(
                        (day, i) => (
                          <div
                            key={day}
                            className="day-header"
                            style={{
                              color: i >= 5 ? currentTheme.primary : "#6B7280",
                            }}
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
                        const isStart = isStartDate(date);
                        const isEnd = isEndDate(date);
                        const holiday = getHoliday(date);
                        const today = isToday(date);
                        const dayOfWeek = getDay(date);
                        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                        let cellClass = "day-cell";
                        if (isStart || isEnd) cellClass += " is-endpoint";
                        else if (inRange) cellClass += " in-range";
                        else if (today) cellClass += " is-today";
                        else if (isWeekend) cellClass += " is-weekend";

                        return (
                          <motion.button
                            key={date.toISOString()}
                            onClick={() => handleDateClick(date)}
                            className={cellClass}
                            style={{
                              backgroundColor:
                                isStart || isEnd
                                  ? currentTheme.primary
                                  : inRange
                                    ? currentTheme.secondary
                                    : "transparent",
                              color:
                                isStart || isEnd
                                  ? "white"
                                  : isWeekend && !inRange
                                    ? currentTheme.primary
                                    : "#1f2937",
                              borderColor:
                                today && !isStart && !isEnd
                                  ? currentTheme.primary
                                  : "transparent",
                            }}
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

                {/* Add Note Input Area */}
                <div className="add-note-section">
                  {selectedRange.start && (
                    <div
                      className="selected-date-badge"
                      style={{
                        backgroundColor: currentTheme.secondary,
                        color: currentTheme.accent,
                      }}
                    >
                      📅 {formatNoteDate(selectedRange)}
                    </div>
                  )}
                  <div className="note-input-row">
                    <input
                      type="text"
                      value={currentNote}
                      onChange={(e) => setCurrentNote(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addNote()}
                      placeholder="Add a note..."
                      className="note-input"
                    />
                    <button
                      onClick={addNote}
                      disabled={!currentNote.trim()}
                      className="add-note-btn"
                      style={{
                        backgroundColor: currentNote.trim()
                          ? currentTheme.primary
                          : "#d1d5db",
                      }}
                    >
                      Add
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
            <div
              className="legend-box border-only"
              style={{ borderColor: currentTheme.primary }}
            ></div>
            <span>Today</span>
          </div>
          <div className="legend-item">
            <div
              className="legend-box"
              style={{ backgroundColor: currentTheme.primary }}
            ></div>
            <span>Selected</span>
          </div>
          <div className="legend-item">
            <div
              className="legend-box"
              style={{ backgroundColor: currentTheme.secondary }}
            ></div>
            <span>Range</span>
          </div>
          <div className="legend-item">
            <span style={{ color: currentTheme.primary, fontWeight: 600 }}>
              SAT/SUN
            </span>
            <span>Weekend</span>
          </div>
        </div>
      </div>
    </div>
  );
}
