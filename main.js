/**
 * Date Timer Pomodoro Pro Plugin
 * A comprehensive productivity plugin for Obsidian featuring:
 * - Calendar with daily file creation
 * - Pomodoro timer with customizable work/break periods
 * - Task management system
 * 
 * @author Amir
 * @version 1.0.0
 */

// Import required Obsidian classes
const { Plugin, ItemView } = require("obsidian");

// Unique identifier for the plugin view type
const VIEW_TYPE = "date-timer-pomodoro-view";

/**
 * Main view class that renders the calendar, timer, and task management interface
 * Extends Obsidian's ItemView to provide a custom panel in the workspace
 */
class SimpleWorkingView extends ItemView {
    /**
     * Initialize the view with required properties and default values
     * @param {Object} leaf - The workspace leaf where this view will be displayed
     * @param {Object} plugin - The main plugin instance
     */
    constructor(leaf, plugin) {
        super(leaf);
        this.app = leaf.app; // Reference to the Obsidian app instance
        this.plugin = plugin; // Reference to the main plugin
        this.tasks = []; // Array to store task objects
        this.timeLeft = 40 * 60; // Current timer value in seconds (default: 40 minutes)
        this.workTime = 40 * 60; // Work session duration in seconds (default: 40 minutes)
        this.breakTime = 5 * 60; // Break duration in seconds (default: 5 minutes)
        this.timerRunning = false; // Flag to track if timer is currently running
        this.timerInterval = null; // Interval reference for timer updates
        this.isWorkSession = true; // Track current session type (true=work, false=break)
        this.currentDate = new Date(); // Current date for calendar display
    }

    /**
     * Returns the unique view type identifier
     * @returns {string} The view type constant
     */
    getViewType() {
        return VIEW_TYPE;
    }

    /**
     * Returns the display text shown in the UI
     * @returns {string} Human-readable view name
     */
    getDisplayText() {
        return "Date Timer Pomodoro";
    }

    /**
     * Returns the Lucide icon name for the view
     * @returns {string} Icon identifier
     */
    getIcon() {
        return "calendar-days";
    }

    /**
     * Called when the view is opened and rendered
     * Initializes all three main sections of the plugin interface
     */
    async onOpen() {
        // Get the main container element (index 1 is the content area in Obsidian views)
        const container = this.containerEl.children[1];
        container.empty(); // Clear any existing content
        
        // Initialize the three main functional sections
        this.addCalendarSection(container); // Add calendar navigation and display
        this.addTimerSection(container);     // Add timer controls and display
        this.addTasksSection(container);     // Add task management interface
    }

    /**
     * Creates and initializes the calendar section
     * @param {HTMLElement} container - The parent container element
     */
    addCalendarSection(container) {
        // Create a section container with custom styling class
        const section = container.createDiv("dtp-section");
        
        // Create the calendar container element
        const calendarDiv = section.createDiv("calendar-simple");
        this.renderCalendar(calendarDiv); // Render the current month view
        this.addCalendarEventListeners(); // Set up click handlers for navigation
    }

    /**
     * Renders the calendar for the current month with navigation and click handlers
     * @param {HTMLElement} container - The container element to render the calendar in
     */
    renderCalendar(container) {
        // Define month names for display
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'];
        
        // Calculate calendar grid data for the current month
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const firstDay = new Date(year, month, 1); // First day of the month
        const lastDay = new Date(year, month + 1, 0); // Last day of the month
        const daysInMonth = lastDay.getDate(); // Number of days in the month
        
        // Adjust start day for Monday-first week (0=Sunday becomes 6=Sunday)
        let startDay = firstDay.getDay();
        startDay = startDay === 0 ? 6 : startDay - 1;

        let dayHTML = '';
        
        // Create day headers (Mon-Sun)
        dayHTML += '<div class="day-header">Mon</div><div class="day-header">Tue</div><div class="day-header">Wed</div>';
        dayHTML += '<div class="day-header">Thu</div><div class="day-header">Fri</div><div class="day-header">Sat</div><div class="day-header">Sun</div>';
        
        // Add empty cells for days before the month starts (to align calendar grid)
        for (let i = 0; i < startDay; i++) {
            dayHTML += '<div class="calendar-day empty"></div>';
        }

        // Create cells for each day of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const isToday = this.isDateToday(date); // Check if this is today's date
            const dateStr = this.formatDateString(date); // Format as YYYY-MM-DD
            const dayClass = isToday ? 'calendar-day today' : 'calendar-day'; // Apply special styling for today
            
            // Create clickable day element with data attribute for file creation
            dayHTML += `<div class="${dayClass}" data-date="${dateStr}">${day}</div>`;
        }

        // Set the complete HTML structure for the calendar
        container.innerHTML = `
            <div class="calendar-nav">
                <button class="nav-btn prev-month">◀</button>
                <span class="month-year">${monthNames[month]} ${year}</span>
                <button class="nav-btn next-month">▶</button>
            </div>
            <div class="calendar-grid">
                ${dayHTML}
            </div>
        `;

        // Add event listeners after DOM elements are created (setTimeout ensures HTML is rendered)
        setTimeout(() => {
            const prevBtn = container.querySelector('.prev-month');
            const nextBtn = container.querySelector('.next-month');
            const daysGrid = container.querySelector('.calendar-grid');

            // Previous month navigation
            if (prevBtn) {
                prevBtn.addEventListener('click', () => {
                    this.currentDate.setMonth(this.currentDate.getMonth() - 1);
                    this.renderCalendar(container);
                });
            }

            // Next month navigation
            if (nextBtn) {
                nextBtn.addEventListener('click', () => {
                    this.currentDate.setMonth(this.currentDate.getMonth() + 1);
                    this.renderCalendar(container);
                });
            }

            // Add click handlers to each day for daily file creation
            if (daysGrid) {
                daysGrid.querySelectorAll('.calendar-day:not(.empty)').forEach(dayEl => {
                    dayEl.addEventListener('click', () => {
                        const dateStr = dayEl.dataset.date;
                        this.createDailyFile(dateStr);
                    });
                });
            }
        }, 100);
    }

    /**
     * Returns HTML for day headers (unused helper method)
     * @returns {string} HTML string for weekday headers
     */
    getDayHeaders() {
        return '<div class="day-header">Mon</div><div class="day-header">Tue</div><div class="day-header">Wed</div><div class="day-header">Thu</div><div class="day-header">Fri</div><div class="day-header">Sat</div><div class="day-header">Sun</div>';
    }

    /**
     * Generates HTML for calendar days (unused helper method)
     * @returns {string} HTML string for calendar days
     */
    getDaysHTML() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();

        let startDay = firstDay.getDay();
        startDay = startDay === 0 ? 6 : startDay - 1;

        let html = '';
        
        // Generate empty cells for days before month starts
        for (let i = 0; i < startDay; i++) {
            html += '<div class="day-cell empty"></div>';
        }

        // Generate cells for each day of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const isToday = this.isDateToday(date);
            html += `<div class="day-cell ${isToday ? 'today' : ''}" data-day="${day}">${day}</div>`;
        }

        return html;
    }

    /**
     * Checks if a given date is today's date
     * @param {Date} date - The date to check
     * @returns {boolean} True if the date is today, false otherwise
     */
    isDateToday(date) {
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    }

    /**
     * Adds event listeners for calendar navigation and day selection (alternative implementation)
     * This method appears to be an older/duplicate version of the event handling in renderCalendar
     */
    addCalendarEventListeners() {
        setTimeout(() => {
            const prevBtn = document.querySelector('.prev-month-btn');
            const nextBtn = document.querySelector('.next-month-btn');
            
            // Previous month button handler
            if (prevBtn) {
                prevBtn.addEventListener('click', () => {
                    this.currentDate.setMonth(this.currentDate.getMonth() - 1);
                    this.renderCalendar(document.querySelector('.calendar-simple'));
                });
            }
            
            // Next month button handler
            if (nextBtn) {
                nextBtn.addEventListener('click', () => {
                    this.currentDate.setMonth(this.currentDate.getMonth() + 1);
                    this.renderCalendar(document.querySelector('.calendar-simple'));
                });
            }

            // Add click listeners to calendar days for file creation
            document.querySelectorAll('.day-cell:not(.empty)').forEach(dayEl => {
                dayEl.addEventListener('click', (e) => {
                    const day = parseInt(e.target.dataset.day);
                    const date = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), day);
                    const dateStr = this.formatDateString(date);
                    this.createDailyFile(dateStr);
                });
            });
        }, 100);
    }

    /**
     * Formats a date object as YYYY-MM-DD string for file naming
     * @param {Date} date - The date to format
     * @returns {string} Formatted date string in ISO format without time
     */
    formatDateString(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Add leading zero for single-digit months
        const day = String(date.getDate()).padStart(2, '0');         // Add leading zero for single-digit days
        return `${year}-${month}-${day}`;
    }

    /**
     * Creates or opens a daily note file for the specified date
     * If file exists, opens it; otherwise creates it with default content
     * @param {string} dateStr - Date string in YYYY-MM-DD format
     */
    async createDailyFile(dateStr) {
        const fileName = `${dateStr}.md`; // Create filename with .md extension
        
        try {
            // Check if file already exists in the vault
            const existingFile = this.app.vault.getAbstractFileByPath(fileName);
            if (existingFile) {
                // File exists: open it in a new tab
                const leaf = this.app.workspace.getLeaf(false);
                await leaf.openFile(existingFile);
            } else {
                // File doesn't exist: create with default template content
                const content = `# ${dateStr}\n\n## Header 1\n\n- [ ] Task 1\n\n## Header 2\n\n- [ ] Task 2\n\n## Header 3\n\n- [ ] Task 3\n\n`;
                const newFile = await this.app.vault.create(fileName, content);
                const leaf = this.app.workspace.getLeaf(false);
                await leaf.openFile(newFile);
                
                // Display temporary success message
                const section = document.querySelector('.dtp-section');
                if (section) {
                    const successMsg = section.createEl("p", { 
                        text: `✅ File created: ${fileName}`, 
                        cls: "success-message" 
                    });
                    // Remove message after 3 seconds
                    setTimeout(() => successMsg.remove(), 3000);
                }
            }
        } catch (error) {
            // Handle errors during file creation/opening
            console.error('Error creating file:', error);
            const section = document.querySelector('.dtp-section');
            if (section) {
                section.createEl("p", { 
                    text: `❌ Error creating file: ${error.message}`, 
                    cls: "error-message" 
                });
            }
        }
    }

    /**
     * Creates and initializes the timer section with controls and settings
     * @param {HTMLElement} container - The parent container element
     */
    addTimerSection(container) {
        // Create section container with styling
        const section = container.createDiv("dtp-section");
        
        // Create timer display and control interface
        const timerDiv = section.createDiv("timer-section");
        timerDiv.innerHTML = `
            <!-- Timer display with progress bar and status -->
            <div class="timer-display">
                <div class="timer-progress-container">
                    <div class="timer-progress-bar"></div>
                </div>
                <div class="timer-time">40:00</div>
                <div class="timer-status">Ready</div>
            </div>
            
            <!-- Timer control buttons -->
            <div class="timer-controls">
                <button class="timer-btn settings-btn">Settings</button>
                <button class="timer-btn start-btn">Start</button>
                <button class="timer-btn reset-btn">Reset</button>
            </div>
            
            <!-- Collapsible settings panel -->
            <div class="timer-settings" style="display: none;">
                <div class="setting-row">
                    <label>Work (min):</label>
                    <input type="number" id="work-time" value="40" min="1" max="180">
                </div>
                <div class="setting-row">
                    <label>Break (min):</label>
                    <input type="number" id="break-time" value="5" min="1" max="60">
                </div>
                <div class="setting-buttons">
                    <button class="save-settings-btn">Save</button>
                    <button class="cancel-settings-btn">Cancel</button>
                </div>
            </div>
            
            <!-- Current settings display -->
            <div class="timer-info">Work: 40min | Break: 5min</div>
        `;
        
        // Initialize event handlers for timer controls
        this.addTimerEventListeners();
    }

    /**
     * Sets up event listeners for all timer controls and settings
     * Uses setTimeout to ensure DOM elements are rendered before attaching listeners
     */
    addTimerEventListeners() {
        setTimeout(() => {
            // Get references to all timer control buttons
            const startBtn = document.querySelector('.start-btn');
            const resetBtn = document.querySelector('.reset-btn');
            const settingsBtn = document.querySelector('.settings-btn');
            const saveSettingsBtn = document.querySelector('.save-settings-btn');
            const cancelSettingsBtn = document.querySelector('.cancel-settings-btn');
            
            // Start/Pause button handler
            if (startBtn) {
                startBtn.addEventListener('click', () => this.toggleTimer());
            }
            
            // Reset button handler
            if (resetBtn) {
                resetBtn.addEventListener('click', () => this.resetTimer());
            }
            
            // Settings toggle button handler
            if (settingsBtn) {
                settingsBtn.addEventListener('click', () => this.toggleTimerSettings());
            }
            
            // Save settings button handler
            if (saveSettingsBtn) {
                saveSettingsBtn.addEventListener('click', () => this.saveTimerSettings());
            }
            
            // Cancel settings button handler (closes settings panel)
            if (cancelSettingsBtn) {
                cancelSettingsBtn.addEventListener('click', () => this.toggleTimerSettings());
            }
            
            // Live preview handlers for settings inputs
            const workInput = document.querySelector('#work-time');
            const breakInput = document.querySelector('#break-time');
            
            if (workInput) {
                workInput.addEventListener('input', () => this.updateTimerInfo());
            }
            
            if (breakInput) {
                breakInput.addEventListener('input', () => this.updateTimerInfo());
            }
        }, 100);
    }

    /**
     * Toggles timer between running and paused states
     */
    toggleTimer() {
        if (this.timerRunning) {
            this.pauseTimer();
        } else {
            this.startTimer();
        }
    }

    /**
     * Starts the timer countdown and updates display every second
     */
    startTimer() {
        this.timerRunning = true;
        const startBtn = document.querySelector('.start-btn');
        if (startBtn) startBtn.textContent = '⏸️ Pause'; // Update button to show pause icon
        
        // Set up interval to update timer every second
        this.timerInterval = setInterval(() => {
            if (this.timeLeft > 0) {
                this.timeLeft--; // Decrement remaining time
                this.updateTimerDisplay(); // Update visual display
            } else {
                this.completeTimer(); // Handle timer completion
            }
        }, 1000);
        
        this.updateTimerDisplay(); // Initial display update
    }

    /**
     * Pauses the timer and clears the interval
     */
    pauseTimer() {
        this.timerRunning = false;
        clearInterval(this.timerInterval); // Stop the countdown interval
        const startBtn = document.querySelector('.start-btn');
        if (startBtn) startBtn.textContent = '▶️ Start'; // Update button to show play icon
        this.updateTimerDisplay(); // Update visual display
    }

    /**
     * Resets timer to initial work session duration
     */
    resetTimer() {
        this.pauseTimer(); // Stop the timer if running
        this.isWorkSession = true; // Reset to work session
        this.timeLeft = this.workTime; // Reset to work session duration
        this.updateTimerDisplay(); // Update display
        
        // Reset status text
        const statusEl = document.querySelector('.timer-status');
        if (statusEl) statusEl.textContent = 'Ready';
        
        // Reset progress bar
        const progressBar = document.querySelector('.timer-progress-bar');
        if (progressBar) progressBar.style.width = '0%';
    }

    /**
     * Handles timer completion: plays sound, switches session type, and prepares for next session
     */
    completeTimer() {
        this.pauseTimer(); // Stop the timer
        
        // Switch session type
        this.isWorkSession = !this.isWorkSession;
        
        // Set timer for next session
        this.timeLeft = this.isWorkSession ? this.workTime : this.breakTime;
        
        const statusEl = document.querySelector('.timer-status');
        const sessionType = this.isWorkSession ? 'Work' : 'Break';
        
        if (statusEl) {
            statusEl.textContent = `${sessionType} Session Complete! 🎉`; // Show completion message
        }
        
        this.playBeepSound(); // Play completion sound
        
        // Auto-start next session after 2 seconds
        setTimeout(() => {
            this.startTimer(); // Automatically start the next session
        }, 2000);
    }

    /**
     * Updates timer display, status, and progress bar
     */
    updateTimerDisplay() {
        const timeEl = document.querySelector('.timer-time');
        const statusEl = document.querySelector('.timer-status');
        const progressBar = document.querySelector('.timer-progress-bar');

        // Update time display in MM:SS format
        if (timeEl) {
            const minutes = Math.floor(this.timeLeft / 60);
            const seconds = this.timeLeft % 60;
            const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            timeEl.textContent = timeStr;
        }
        
        // Update status text based on timer state and session type
        if (statusEl) {
            if (this.timerRunning) {
                const sessionType = this.isWorkSession ? 'Work Session' : 'Break Time';
                statusEl.textContent = `${sessionType} Running`;
            } else {
                const sessionType = this.isWorkSession ? 'Work Session' : 'Break Time';
                statusEl.textContent = `${sessionType} Ready`;
            }
        }
        
        // Update progress bar based on current session
        if (progressBar) {
            const totalTime = this.isWorkSession ? this.workTime : this.breakTime;
            const progress = ((totalTime - this.timeLeft) / totalTime) * 100;
            progressBar.style.width = `${progress}%`;
            
            // Change progress bar color based on session type
            if (this.isWorkSession) {
                progressBar.style.background = 'linear-gradient(90deg, var(--interactive-accent, #2196f3), var(--interactive-accent-hover, #1976d2))';
            } else {
                progressBar.style.background = 'linear-gradient(90deg, var(--color-green, #4caf50), #45a049)';
            }
        }
    }

    /**
     * Toggles the visibility of the timer settings panel
     */
    toggleTimerSettings() {
        const settingsEl = document.querySelector('.timer-settings');
        if (settingsEl) {
            const isVisible = settingsEl.style.display !== 'none';
            settingsEl.style.display = isVisible ? 'none' : 'block'; // Toggle visibility
            
            if (!isVisible) {
                // When opening settings, populate inputs with current values
                const workInput = document.querySelector('#work-time');
                const breakInput = document.querySelector('#break-time');
                if (workInput) workInput.value = this.workTime / 60; // Convert seconds to minutes
                if (breakInput) breakInput.value = this.breakTime / 60;
            }
        }
    }

    /**
     * Saves the timer settings from the input fields
     */
    saveTimerSettings() {
        const workInput = document.querySelector('#work-time');
        const breakInput = document.querySelector('#break-time');
        
        // Update timer durations from input values (convert minutes to seconds)
        if (workInput) this.workTime = parseInt(workInput.value) * 60;
        if (breakInput) this.breakTime = parseInt(breakInput.value) * 60;
        
        // Reset timer to new work duration if not currently running
        if (!this.timerRunning) {
            this.timeLeft = this.workTime;
            this.updateTimerDisplay();
        }
        
        // Update the settings display and close settings panel
        this.updateTimerInfo();
        this.toggleTimerSettings();
    }

    /**
     * Updates the timer info display with current settings
     */
    updateTimerInfo() {
        const workInput = document.querySelector('#work-time');
        const breakInput = document.querySelector('#break-time');
        const infoEl = document.querySelector('.timer-info');
        
        // Update the info text with current setting values
        if (workInput && breakInput && infoEl) {
            infoEl.textContent = `Work: ${workInput.value}min | Break: ${breakInput.value}min`;
        }
    }

    /**
     * Plays a completion beep sound using the Web Audio API
     * Uses a sine wave oscillator with exponential decay for a pleasant tone
     */
    playBeepSound() {
        try {
            // Create audio context (handles browser compatibility)
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            // Connect audio nodes
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            // Configure oscillator for a pleasant beep tone
            oscillator.frequency.value = 800; // Frequency in Hz
            oscillator.type = 'sine';        // Waveform type
            
            // Configure gain for smooth fade-out
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime); // Initial volume
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5); // Fade out

            // Play the sound for 0.5 seconds
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            console.log('Audio not available:', error); // Handle cases where audio API is not available
        }
    }

    /**
     * Creates and initializes the task management section
     * @param {HTMLElement} container - The parent container element
     */
    addTasksSection(container) {
        // Create section container with styling
        const section = container.createDiv("dtp-section");
        
        // Create task interface with input field and list container
        const tasksDiv = section.createDiv("tasks-section");
        tasksDiv.innerHTML = `
            <!-- Task input area -->
            <div class="task-input-section">
                <input type="text" class="task-input" placeholder="Add a new task...">
            </div>
            <!-- Container for task list -->
            <div class="task-list-container"></div>
        `;
        
        // Initialize event handlers and render existing tasks
        this.addTaskEventListeners();
        this.renderTasks();
    }

    /**
     * Sets up event listeners for task input and add button
     * Uses setTimeout to ensure DOM elements are rendered before attaching listeners
     */
    addTaskEventListeners() {
        setTimeout(() => {
            const addBtn = document.querySelector('.add-task-btn');
            const input = document.querySelector('.task-input');
            
            // Add button click handler
            if (addBtn) {
                addBtn.addEventListener('click', () => this.addTask());
            }
            
            // Enter key handler for the input field
            if (input) {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.addTask();
                    }
                });
            }
        }, 100);
    }

    /**
     * Adds a new task from the input field
     * Creates a task object with unique ID, text, and completed status
     */
    addTask() {
        const input = document.querySelector('.task-input');
        const text = input.value.trim(); // Remove whitespace from input
        
        if (!text) return; // Don't add empty tasks
        
        // Create new task object
        this.tasks.push({
            id: Date.now(),        // Use timestamp for unique ID
            text: text,            // Task text content
            completed: false       // Initial completion status
        });
        
        input.value = ''; // Clear input field
        this.renderTasks(); // Re-render task list
    }

    /**
     * Toggles the completion status of a task
     * @param {number} taskId - The unique ID of the task to toggle
     */
    toggleTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed; // Flip the completion status
            this.renderTasks(); // Re-render to update display
        }
    }

    /**
     * Deletes a task from the task list
     * @param {number} taskId - The unique ID of the task to delete
     */
    deleteTask(taskId) {
        this.tasks = this.tasks.filter(t => t.id !== taskId); // Remove task by ID
        this.renderTasks(); // Re-render to update display
    }

    /**
     * Renders the task list with all current tasks
     * Shows empty state message when no tasks exist
     */
    renderTasks() {
        const container = document.querySelector('.task-list-container');
        if (!container) return; // Exit if container not found
        
        container.innerHTML = ''; // Clear existing content
        
        // Show empty state message when no tasks exist
        if (this.tasks.length === 0) {
            container.createDiv('empty-tasks').textContent = 'No tasks yet. Add your first task above!';
            return;
        }
        
        // Render each task as a list item
        this.tasks.forEach(task => {
            const taskEl = container.createDiv('task-item');
            if (task.completed) {
                taskEl.classList.add('completed'); // Apply completed styling
            }
            
            // Create checkbox for completion toggle
            const checkbox = taskEl.createEl('input', { type: 'checkbox' });
            checkbox.checked = task.completed; // Set initial state
            checkbox.addEventListener('change', () => this.toggleTask(task.id));
            
            // Create task text display
            const taskText = taskEl.createDiv('task-text');
            taskText.textContent = task.text;
            
            // Create delete button
            const deleteBtn = taskEl.createEl('button', { text: '🗑️', cls: 'delete-task-btn' });
            deleteBtn.addEventListener('click', () => this.deleteTask(task.id));
        });
    }

    /**
     * Called when the view is closed
     * Cleans up resources like the timer interval
     */
    onClose() {
        // Clear the timer interval to prevent memory leaks
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
    }
}

/**
 * Main plugin class that handles initialization and plugin lifecycle
 * Extends Obsidian's Plugin class
 */
module.exports = class SimpleTestPlugin extends Plugin {
    /**
     * Called when the plugin is loaded and enabled
     * Sets up views, ribbon icons, and commands
     */
    async onload() {
        console.log("Simple Test Plugin loading...");
        
        // Register the custom view type with Obsidian
        this.registerView(
            VIEW_TYPE,
            (leaf) => new SimpleWorkingView(leaf) // Create view instance for each leaf
        );

        // Add ribbon icon in the left sidebar for quick access
        this.addRibbonIcon('calendar-days', 'Simple Test', () => {
            this.activateView();
        });

        // Add command to palette for opening the plugin view
        this.addCommand({
            id: 'open-simple-test',           // Unique command ID
            name: 'Open Simple Test',          // Display name in command palette
            callback: () => {
                this.activateView();           // Action to perform when command is executed
            }
        });

        console.log("Simple Test Plugin loaded!");
    }

    /**
     * Called when the plugin is disabled or unloaded
     * Performs cleanup tasks
     */
    async onunload() {
        console.log("Simple Test Plugin unloaded!");
    }

    /**
     * Activates and shows the plugin view in the workspace
     * Either reveals existing view or creates new one in left sidebar
     */
    async activateView() {
        const { workspace } = this.app;

        let leaf = null;
        const leaves = workspace.getLeavesOfType(VIEW_TYPE); // Find existing views of this type

        // Use existing view if available
        if (leaves.length > 0) {
            leaf = leaves[0];
        } else {
            // Create new leaf in left sidebar if no existing view
            leaf = workspace.getLeftLeaf(false);
        }

        // Set the view state and reveal it to the user
        if (leaf) {
            await leaf.setViewState({ type: VIEW_TYPE, active: true });
            workspace.revealLeaf(leaf);
        }
    }
};