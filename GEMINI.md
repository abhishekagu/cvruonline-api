# Project Rules

## 1. Documentation & Progress Tracking
- **Automatic Updates**: Whenever a task involving code implementation is completed (e.g., Backend APIs/models, or Frontend components/pages/routing), you MUST automatically update the respective documentation without being explicitly asked.
  - **Backend**: Update `api_doc.md` (add endpoints) and `progress.md` (move to completed milestones).
  - **Frontend**: Update `frontend_progress.md` in the frontend directory by moving completed UI tasks to the completed section and updating the current status.

## 2. File Management
- **Temporary Files Cleanup**: After the use of any temporary file (e.g., test scripts, mock JSON files, scratchpad codes), you MUST delete it immediately to keep the workspace clean.

## 3. Frontend Development Rules
- **Global Theming**: All theme variables (colors, fonts, border-radius) MUST be defined using CSS variables globally (e.g., in `index.css`) and mapped within `tailwind.config.js`. NEVER hardcode hex codes or static values inside component class names (e.g., use `bg-primary` instead of `bg-[#f58220]`). This ensures the theme can be changed from a single place.
- **Component Reusability**: Build UI elements as small, isolated, and reusable components. Avoid massive monolithic files.
- **API Integration**: All API calls must be centralized in a dedicated `services` or `api` folder using an Axios instance, rather than cluttering UI components with raw `fetch` or `axios` calls.
- **Responsive Design First**: Every component must be built with mobile-first Tailwind classes, ensuring perfect responsiveness across all screen sizes.
