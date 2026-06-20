# Event Management System (EMS)

A desktop application for managing events, organizers, customers, and staff. Built with Electron for the frontend and C++ for the backend, this system provides a complete event management solution with user authentication, event creation, registration handling, and staff/vendor management.

## Features

### For Organizers
- **User Authentication**: Secure signup and login for event organizers
- **Event Management**: Create, modify, and delete events
- **Event Types**: Support for multiple event types (MUN, Olympiad, Seminar, Ceremony, Festival, Concert, Custom)
- **Staff Management**: Add and manage event staff members
- **Vendor Management**: Handle vendor assignments for events
- **Event Details**: Store comprehensive event information including dates, venues, seat capacity

### For Customers
- **User Registration**: Create customer accounts
- **Event Browsing**: View all available events with detailed information
- **Event Registration**: Register for events and manage registrations
- **Registration Tracking**: View all registered events and registration status
- **Fee Management**: Track registration fees

### General Features
- **Desktop Application**: Runs as a standalone Electron desktop app
- **Persistent Storage**: Events stored in JSON, user data in binary format
- **Type Safety**: Multiple event types with enum support
- **Responsive UI**: Clean, intuitive user interface with modal dialogs

## Tech Stack

- **Frontend**: 
  - Electron 26.6.10 (Desktop framework)
  - HTML5
  - CSS3
  - JavaScript (Vanilla)

- **Backend**:
  - C++ (Core business logic and data management)
  - Binary file format for user/staff/vendor data
  - JSON format for events

- **Build System**: Node.js/npm

## Project Structure

```
Event-Management-System/
├── main.js                 # Electron main process
├── preload.js             # Secure preload script for IPC
├── renderer.js            # Frontend UI logic and event handlers
├── backend-bridge.js      # Bridge between frontend and C++ backend
├── backend.cpp            # C++ backend implementation
├── backend.exe            # Compiled C++ backend (generated)
├── index.html             # Main HTML interface
├── style.css              # Application styling
├── package.json           # Project dependencies
└── data/
    ├── events.json        # Event data storage
    ├── organisers.dat     # Binary organizer data
    ├── customers.dat      # Binary customer data
    ├── registrations.dat  # Binary registration data
    ├── staff.dat          # Binary staff data
    └── vendors.dat        # Binary vendor data
```

## Prerequisites

- **Node.js** (v14 or higher) - for running the Electron application
- **npm** - package manager
- **C++ Compiler** (for building backend.cpp)
  - **Windows**: Visual Studio or MinGW
  - **Linux**: g++
  - **macOS**: Clang

## Installation

1. **Clone or download the project**
   ```bash
   cd Event-Management-System
   ```

2. **Install Node.js dependencies**
   ```bash
   npm install
   ```

3. **Compile the C++ backend** (if backend.exe doesn't exist)
   
   **On Windows (Visual Studio):**
   ```bash
   cl /W3 backend.cpp /link /OUT:backend.exe
   ```
   
   **On Windows (MinGW):**
   ```bash
   g++ -o backend.exe backend.cpp
   ```
   
   **On Linux/macOS:**
   ```bash
   g++ -o backend backend.cpp
   # Update BACKEND_EXE path in backend-bridge.js accordingly
   ```

## Usage

### Starting the Application

```bash
npm start
```

This will launch the Electron application window.

### User Workflows

#### As an Organizer:
1. Launch the app and select "Organiser" from the main menu
2. Sign up with name, email, username, and password
3. Login with credentials
4. Access organizer dashboard to:
   - Create new events
   - Manage existing events
   - Add staff members to events
   - Add vendors to events
   - View event details

#### As a Customer:
1. Launch the app and select "Customer" from the main menu
2. Sign up with your details
3. Login with credentials
4. Browse all available events
5. Register for events you're interested in
6. View your registrations and manage them

## Architecture

### Frontend Architecture
- **Electron Main Process** (`main.js`): Manages window creation and IPC channels
- **Preload Script** (`preload.js`): Secure bridge for renderer process
- **Renderer Process** (`renderer.js`): Handles UI logic and user interactions
- **UI** (`index.html`, `style.css`): User interface and styling

### Backend Architecture
- **Backend Bridge** (`backend-bridge.js`): Communicates with C++ backend via child process spawning
- **C++ Backend** (`backend.cpp`): Core business logic, data validation, and file I/O
- **Data Storage**: Binary files for structured data, JSON for events

### Communication Flow
```
Renderer (UI) 
  ↓ (IPC - preload.js)
Main Process (main.js)
  ↓ (IPC handlers)
Backend Bridge (backend-bridge.js)
  ↓ (Child process)
C++ Backend (backend.exe)
  ↓ (File I/O)
Data Files (binary & JSON)
```

## Data Storage

### Binary File Formats

**Organiser** (144 bytes)
- ID (4 bytes)
- Name (50 bytes)
- Email (50 bytes)
- Username (20 bytes)
- Password (20 bytes)

**Customer** (144 bytes)
- Same structure as Organiser

**Staff** (136 bytes)
- ID (4 bytes)
- Event ID (4 bytes)
- Name (50 bytes)
- Role (50 bytes)
- Contact (20 bytes)
- Email (20 bytes)

**Vendor** (132 bytes)
- ID (4 bytes)
- Event ID (4 bytes)
- Name (50 bytes)
- Services (50 bytes)
- Contact (20 bytes)
- Cost (4 bytes)

**Registration** (24 bytes)
- Customer ID (4 bytes)
- Event ID (4 bytes)
- Fee Paid (4 bytes)
- Status (10 bytes)

### JSON Format

**events.json**: Array of event objects with the following structure:
```json
{
  "eventID": 1,
  "type": 1,
  "name": "Sample Event",
  "description": "Event description",
  "venue": "Event venue",
  "startDate": "2024-01-15",
  "endDate": "2024-01-16",
  "totalSeats": 100,
  "soldTickets": 25
}
```

## IPC Channels

### Organiser Operations
- `organiser:signup` - Register new organizer
- `organiser:login` - Authenticate organizer

### Customer Operations
- `customer:signup` - Register new customer
- `customer:login` - Authenticate customer
- `customer:register` - Register for event
- `customer:getRegistrations` - Retrieve customer registrations

### Event Operations
- `event:add` - Create new event
- `event:getAll` - Retrieve all events
- `event:modify` - Update event details
- `event:delete` - Delete an event

### Staff Operations
- `staff:add` - Add staff to event
- `staff:getByEvent` - Get staff for specific event
- `staff:delete` - Remove staff member

## Building and Development

### Development Mode
```bash
npm start
```

### Rebuilding Backend
If you modify `backend.cpp`, rebuild it:

**Windows:**
```bash
g++ -o backend.exe backend.cpp
```

**Linux/macOS:**
```bash
g++ -o backend backend.cpp
```

### Debugging
- Use Chrome DevTools: Press `Ctrl+Shift+I` (or `Cmd+Option+I` on macOS)
- Check console logs in the DevTools
- Backend output appears in the terminal

## Troubleshooting

### Application Won't Start
- Verify Node.js is installed: `node --version`
- Ensure all dependencies are installed: `npm install`
- Check that Electron can find the main.js file

### Backend Executable Not Found
- Recompile the C++ backend using the commands above
- Ensure `backend.exe` (or `backend` on Linux/macOS) is in the project root
- Verify the path in `backend-bridge.js` matches your system

### Cannot Create/Modify Events
- Check `data/` directory exists
- Verify write permissions in the project directory
- Ensure `events.json` is valid JSON format

### IPC Communication Errors
- Check preload.js is properly configured
- Verify context isolation is enabled in main.js
- Review browser console for detailed error messages

## Security Notes

- **Password Storage**: Passwords are stored in plaintext in binary files (for development only)
- **Context Isolation**: Enabled by default for security
- **Node Integration**: Disabled in renderer process
- **Preload Script**: Used for secure IPC communication

## Future Enhancements

- Password hashing and encryption
- Database integration (SQLite, PostgreSQL)
- Email notifications
- Payment integration
- Advanced reporting and analytics
- Multi-user concurrent access
- Cloud backup
- Mobile app companion

## License

ISC

## Author

Created for Event Management System project

---

## Support

For issues, questions, or suggestions, please review the code structure and ensure all dependencies are properly installed. Check the browser console (DevTools) for detailed error messages.
