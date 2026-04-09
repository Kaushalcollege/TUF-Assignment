# Interactive Wall Calendar Component

## 1. Project Overview

The TUF-Assignment is a highly interactive, frontend-only web application that implements a realistic, wire-bound wall calendar. The purpose of this project is to provide a rich user experience for tracking dates, managing monthly memos, and viewing regional public holidays within a single, cohesive interface.

The application solves the problem of disjointed digital date management by combining standard calendar grid functionality with localized note-taking, wrapped in a skeuomorphic 3D design that mimics physical paper interaction. It is targeted toward users requiring a lightweight, aesthetically pleasing desktop and mobile planner without the overhead of heavy backend systems.

## 2. Changelog

- **v1.3.0**
  - **Fixes:** Locked grid layout to strictly 42 cells (6 rows) to prevent vertical layout shifts during month transitions.
  - **Improvements:** Converted API Ninjas fetch call to omit the specific year parameter, satisfying free-tier REST constraints while preventing 400 Bad Request errors.
- **v1.2.0**
  - **Features:** Integrated Framer Motion for custom 3D spring physics, simulating top-hinged page flips.
  - **Features:** Implemented dynamic CSS variables for immediate Dark/Light mode toggling.
- **v1.1.0**
  - **Features:** Added local storage persistence for note-taking.
  - **Improvements:** Refactored CSS to strictly utilize viewport heights (`vh`) to prevent browser scrolling.
- **v1.0.0**
  - **Features:** Initial project scaffolding with Vite and React. Implemented core date logic utilizing `date-fns`.

## 3. Features

### User Interface & Experience

- **Physical Flip Animation:** Utilizes custom 3D spring physics to simulate a real wire-bound wall calendar page flipping from the top hinge.
- **Responsive Bounding:** Strictly constrained CSS layout that adapts to both desktop and mobile viewports without relying on external scrollbars.
- **Theming:** Full CSS variable-driven dynamic theming supporting instantly switchable Dark and Light modes.
- **Glassmorphism:** Semi-transparent component layering to provide visual depth.

### Application Logic

- **Integrated Notes System:** Month-specific state management allowing users to create, edit, delete, and categorize memos.
- **Range Selection:** Two-click date range selection logic mapping start and end dates across the grid.
- **Data Export:** Client-side generation of `.txt` files for downloading monthly memos.
- **Data Persistence:** Automatic synchronization of application state with browser `localStorage`.

### External Data

- **Live API Integration:** Asynchronous fetching of real Indian public holidays with gracefully handled fallback data structures in the event of network failure or rate-limiting.

## 4. Tech Stack

- **Frontend Framework:** React 19
- **Build Tooling:** Vite 8
- **Animation Engine:** Framer Motion (`motion`)
- **Date Manipulation:** `date-fns`
- **Iconography:** Lucide React (`lucide-react`)
- **Styling:** Vanilla CSS (No utility frameworks)
- **Deployment:** GitHub Pages (`gh-pages`)

## 5. Project Structure

```text
TUF-Assignment/
├── public/                 # Static assets
├── src/
│   ├── components/
│   │   ├── WallCalendar.jsx # Main calendar logic, state, and UI
│   │   └── WallCalendar.css # Component-specific styling and variables
│   ├── App.jsx             # Root component wrapper
│   └── main.jsx            # React DOM rendering entry point
├── .env                    # Environment variables (API Keys)
├── .gitignore              # Git exclusion rules
├── package.json            # Project metadata and dependencies
└── vite.config.js          # Vite bundler configuration and base pathing
```

### Important Files

- **`WallCalendar.jsx`**: Acts as the controller for the application. Manages React state, handles the `useEffect` hooks for API fetching and local storage, and defines the Framer Motion animation variants.
- **`WallCalendar.css`**: Defines the visual architecture. Utilizes deep CSS nesting, CSS Grid for the calendar days, and CSS Variables for theme management.
- **`vite.config.js`**: Crucial for deployment. Configures the base path (`/TUF-Assignment/`) required for GitHub Pages asset routing.

## 6. Installation Guide

### Prerequisites

- Node.js (v20.19.0+ or v22.12.0+)
- npm, yarn, or pnpm

### Setup Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Kaushalcollege/TUF-Assignment.git
   cd TUF-Assignment
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Environment Setup:**
   Create a `.env` file in the root directory and add your API Ninjas key:
   ```env
   VITE_API_NINJAS_KEY=your_api_key_here
   ```
4. **Run the development server:**
   ```bash
   npm run dev
   ```

## 7. Dependencies

### Core Dependencies

- `date-fns` (^4.1.0): Provides utility functions for parsing, validating, manipulating, and formatting dates without extending the native Date object.
- `lucide-react` (^1.7.0): A lightweight, customizable SVG icon library.
- `motion` (^12.38.0): The core animation library driving the 3D page flip physics and transition presence.
- `react` / `react-dom` (^19.2.4): The core UI library and DOM renderer.

### Development Dependencies

- `@vitejs/plugin-react` (^6.0.1): Provides Fast Refresh and Babel configuration for React in Vite.
- `eslint` (^9.39.4): Static code analysis tool for identifying problematic patterns.
- `gh-pages` (^6.3.0): Utility for publishing files to a `gh-pages` branch on GitHub.
- `vite` (^8.0.4): Next-generation frontend tooling for fast compilation and hot-module replacement.

## 8. Scripts

- `npm run dev`: Starts the local Vite development server.
- `npm run build`: Compiles the application into static assets within the `dist` directory for production.
- `npm run lint`: Executes ESLint across the codebase to check for code quality and formatting issues.
- `npm run preview`: Boots up a local static web server that serves the files from the `dist` folder to preview the production build.
- `npm run predeploy`: Automatically runs `npm run build` before the deployment script is executed.
- `npm run deploy`: Uses the `gh-pages` package to push the contents of the `dist` folder to the `gh-pages` branch for hosting.

## 9. Application Flow

1. **Initialization:** Upon mounting, `WallCalendar.jsx` executes a `useEffect` hook to read `calendar-notes` and `calendar-theme` from `localStorage`, hydrating the initial component state.
2. **Data Fetching:** A separate `useEffect` triggers an asynchronous fetch to the API Ninjas endpoint to retrieve regional holidays. If the request fails, a fallback object is injected into state.
3. **User Interaction (Navigation):** When the user clicks a directional chevron, the `direction` state updates (1 or -1), and `isFlipping` is set to true. A timeout updates the `currentDate` state.
4. **Animation Pipeline:** The `currentDate` update triggers `AnimatePresence`. The exiting month uses the `exit` variant (swinging away on the X-axis), while the entering month uses the `enter` variant (swinging in or fading up), dictated by the `direction` state.
5. **Data Modification:** When a user saves a note, the state array is updated. This mutation triggers a `useEffect` dependency array, which immediately serializes and writes the updated notes back to `localStorage`.

## 10. API Documentation

### API Ninjas: Public Holidays API

- **Route:** `GET https://api.api-ninjas.com/v1/holidays`
- **Purpose:** Fetches a JSON array of public holidays for a specified country to overlay on the calendar grid.
- **Headers:** \* `X-Api-Key`: Required for authentication.
- **Query Parameters:**
  - `country`: Set to `IN` (India).
- **Response Format:** Array of objects containing `date` (YYYY-MM-DD), `name`, `type`, and `country`.

## 11. UI / Webpage Structure

### Layout Overview

The UI is composed of a centralized column layout. A top toolbar handles global actions (Today, Export, Theme Toggle). Below it sits the calendar navigation (Month/Year display and directional chevrons). The core element is the 3D card, which contains the hardware visuals (wire and rings) and the flip container. The flip container houses a Hero Image section and a Body section, which is split into a CSS Grid: a sidebar for notes and a main 7-column grid for the days.

### CSS Class Dictionary

#### Global & Container

- `calendar-page-wrapper`: The main viewport container. Controls the `100vh` constraint, flex centering, and establishes the CSS variables based on the active theme.
- `calendar-main-container`: Bounds the width of the central application column.

#### Toolbar & Navigation

- `top-toolbar`: Glassmorphic container for global utility buttons.
- `toolbar-left`: Flex container grouping the 'Today' and 'Export' buttons.
- `toolbar-btn`: Base styling for action buttons.
- `calendar-nav`: Flex container aligning the month title and navigation chevrons.
- `nav-btn`: Circular button styling for the chevrons.
- `month-title`: Typography styling for the current month and year.

#### Hardware & 3D Elements

- `calendar-card-3d`: The main wrapper providing the drop shadow and `perspective` context for the 3D animations.
- `calendar-hanger` / `nail` / `wire`: Absolute positioned pseudo-elements creating the visual of a wall mount.
- `spiral-binding-bar` / `spiral-rings-container` / `spiral-ring`: Creates the aesthetic of wire-bound notebook rings.
- `flip-wrapper`: Establishes the 3D space (`perspective: 1200px`) for the child animations.
- `calendar-flip-content`: The animated `motion.div`. Uses `transform-origin: top center` to anchor the rotation.

#### Hero Section

- `hero-section`: Bounding box for the top imagery.
- `hero-image`: Object-fit styling for the seasonal photography.
- `hero-wave`: SVG path positioning to create a transitional angle between the image and the body.
- `hero-text` / `hero-year` / `hero-month`: Typography overlays for the active date.

#### Main Body & Grid

- `calendar-body`: Container for the lower half of the calendar.
- `content-grid`: The primary CSS Grid splitting the notes sidebar from the days grid.
- `days-grid`: The core CSS Grid handling the mathematical layout of the calendar. Strictly enforces `grid-template-rows: repeat(6, 1fr)`.
- `day-cell`: Base styling for a calendar date block.
- `empty-cell`: Placeholder styling for padding days before the 1st and after the end of the month.
- `is-endpoint` / `in-range` / `is-today` / `is-weekend`: Conditional modifier classes applied dynamically via React state to alter cell backgrounds and borders.
- `holiday-text`: Absolute positioned typography for the API-injected holiday names.

#### Notes System

- `notes-area`: Container for the vertical list of memos.
- `note-slot`: Layout for an individual note item.
- `note-indicator`: Small colored circular div representing the category.
- `note-content` / `note-date` / `note-desc`: Typography for the note payload.
- `note-actions`: Container for the edit/delete buttons, revealed on hover.
- `add-note-section`: Form container for inputting new notes.
- `category-selector` / `category-label`: Layout for the radio button group.
- `note-input-row` / `note-input` / `add-note-btn`: Flex layout for the text input and submission trigger.

## 12. Code Insights

### Grid Mathematics Strategy

To prevent the UI from vertically jumping between months (e.g., February requiring 5 rows while March requires 6), the codebase employs a strict grid algorithm. The `days-grid` is locked to 42 cells.

- `prefixEmptyDays`: Calculated using `getDay()` to determine the starting offset.
- `suffixEmptyDays`: Calculated by subtracting the sum of `prefixEmptyDays` and the actual `daysInMonth.length` from 42.
  This guarantees the DOM always renders 42 mathematical blocks, ensuring perfect layout stability.

### Animation Hinge Physics

The project utilizes a custom Framer Motion variant (`flipVariants`). By setting the CSS `transformOrigin: "top center"`, the `rotateX` property simulates a hinge. The `enter` and `exit` states calculate positive or negative degrees (-90 or 90) based on the user's `direction` state, mathematically forcing the pages to swing toward or away from the user on the Z-axis.

## 13. Future Improvements

- **Backend Synchronization:** Replace `localStorage` with a robust backend (e.g., Node.js/PostgreSQL) via a REST or GraphQL API to allow cross-device synchronization of notes.
- **Authentication:** Implement JWT or OAuth to secure user-specific calendar data.
- **Drag and Drop Constraints:** Integrate libraries like `dnd-kit` to allow users to visually drag notes between different date cells on the grid.
- **Custom Image Uploads:** Allow users to upload and persist custom photography for the Hero section.

## 14. Contribution Guide

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request for review

## 15. License

Distributed under the MIT License. See `LICENSE` for more information.
