/**
 * Deadline Plugin
 * A comprehensive productivity plugin for Obsidian featuring:
 * - Calendar with daily file creation
 * - Pomodoro timer with customizable work/break periods
 * - Task management system
 * 
 * @author Javlonbek Saydullaev
 * @version 1.1.0
 */

// Import required Obsidian classes
const { Plugin, ItemView } = require("obsidian");

// Unique identifier for the plugin view type
const VIEW_TYPE = "deadline-view";

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
        this.app = leaf.app;
        this.plugin = plugin;

        // Timer state
        this.workTime = 40 * 60;          // Work session duration in seconds
        this.breakTime = 5 * 60;          // Break duration in seconds
        this.timeLeft = 40 * 60;          // Current remaining time in seconds
        this.isWorkSession = true;        // Session type (true = work, false = break)
        this.timerRunning = false;        // Is timer currently counting?
        this.timerEndTime = null;         // Timestamp (ms) when timer should end
        this.timerAnimationFrame = null;  // requestAnimationFrame ID

        // Calendar state
        this.currentDate = new Date();

        // Tasks state
        this.tasks = [];
    }

    getViewType() {
        return VIEW_TYPE;
    }

    getDisplayText() {
        return "Deadline";
    }

    getIcon() {
        return "calendar-days";
    }

    async onOpen() {
        const container = this.containerEl.children[1];
        container.empty();

        this.addCalendarSection(container);
        this.addTimerSection(container);
        this.addTasksSection(container);
    }

    /* ────────────────────────────── CALENDAR ────────────────────────────── */
    addCalendarSection(container) {
        const section = container.createDiv("dtp-section");
        const calendarDiv = section.createDiv("calendar-simple");
        this.renderCalendar(calendarDiv);
    }

    renderCalendar(container) {
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];

        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();

        // Monday = 0, Sunday = 6
        let startDay = firstDay.getDay();
        startDay = startDay === 0 ? 6 : startDay - 1;

        let dayHTML = '';
        dayHTML += '<div class="day-header">Mon</div><div class="day-header">Tue</div><div class="day-header">Wed</div>';
        dayHTML += '<div class="day-header">Thu</div><div class="day-header">Fri</div><div class="day-header">Sat</div><div class="day-header">Sun</div>';

        for (let i = 0; i < startDay; i++) {
            dayHTML += '<div class="calendar-day empty"></div>';
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const isToday = this.isDateToday(date);
            const dateStr = this.formatDateString(date);
            const dayClass = isToday ? 'calendar-day today' : 'calendar-day';
            dayHTML += `<div class="${dayClass}" data-date="${dateStr}">${day}</div>`;
        }

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

        // Attach event listeners immediately (no setTimeout needed)
        const prevBtn = container.querySelector('.prev-month');
        const nextBtn = container.querySelector('.next-month');
        const daysGrid = container.querySelector('.calendar-grid');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                this.currentDate.setMonth(this.currentDate.getMonth() - 1);
                this.renderCalendar(container);
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.currentDate.setMonth(this.currentDate.getMonth() + 1);
                this.renderCalendar(container);
            });
        }

        if (daysGrid) {
            daysGrid.querySelectorAll('.calendar-day:not(.empty)').forEach(dayEl => {
                dayEl.addEventListener('click', () => {
                    const dateStr = dayEl.dataset.date;
                    this.createDailyFile(dateStr);
                });
            });
        }
    }

    isDateToday(date) {
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    }

    formatDateString(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    async createDailyFile(dateStr) {
        const fileName = `${dateStr}.md`;

        try {
            const existingFile = this.app.vault.getAbstractFileByPath(fileName);
            if (existingFile) {
                const leaf = this.app.workspace.getLeaf(false);
                await leaf.openFile(existingFile);
            } else {
                const content = `# Header 1\n\n## Header 2\n\n### Header 3\n\n`;
                const newFile = await this.app.vault.create(fileName, content);
                const leaf = this.app.workspace.getLeaf(false);
                await leaf.openFile(newFile);

                // Use the container of this view, not a global selector
                const section = this.containerEl.querySelector('.dtp-section');
                if (section) {
                    const successMsg = section.createEl("p", {
                        text: `✅ File created: ${fileName}`,
                        cls: "success-message"
                    });
                    setTimeout(() => successMsg.remove(), 3000);
                }
            }
        } catch (error) {
            console.error('Error creating file:', error);
            const section = this.containerEl.querySelector('.dtp-section');
            if (section) {
                section.createEl("p", {
                    text: `❌ Error creating file: ${error.message}`,
                    cls: "error-message"
                });
            }
        }
    }

    /* ────────────────────────────── TIMER ────────────────────────────── */
    addTimerSection(container) {
        const section = container.createDiv("dtp-section");
        const timerDiv = section.createDiv("timer-section");

        timerDiv.innerHTML = `
            <div class="timer-display">
                <div class="timer-progress-container">
                    <div class="timer-progress-bar"></div>
                </div>
                <div class="timer-time">40:00</div>
                <div class="timer-status">Ready</div>
            </div>
            <div class="timer-controls">
                <button class="timer-btn settings-btn">Settings</button>
                <button class="timer-btn start-btn">Start</button>
                <button class="timer-btn reset-btn">Reset</button>
            </div>
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
            <div class="timer-info">Work: 40min | Break: 5min</div>
        `;

        // Store references to DOM elements inside this view
        this.timerElements = {
            time: timerDiv.querySelector('.timer-time'),
            status: timerDiv.querySelector('.timer-status'),
            progressBar: timerDiv.querySelector('.timer-progress-bar'),
            startBtn: timerDiv.querySelector('.start-btn'),
            resetBtn: timerDiv.querySelector('.reset-btn'),
            settingsBtn: timerDiv.querySelector('.settings-btn'),
            saveSettingsBtn: timerDiv.querySelector('.save-settings-btn'),
            cancelSettingsBtn: timerDiv.querySelector('.cancel-settings-btn'),
            workInput: timerDiv.querySelector('#work-time'),
            breakInput: timerDiv.querySelector('#break-time'),
            settingsEl: timerDiv.querySelector('.timer-settings'),
            infoEl: timerDiv.querySelector('.timer-info')
        };

        this.attachTimerListeners();
        this.updateTimerDisplay(); // initial render
    }

    attachTimerListeners() {
        const els = this.timerElements;

        if (els.startBtn) {
            els.startBtn.addEventListener('click', () => this.toggleTimer());
        }
        if (els.resetBtn) {
            els.resetBtn.addEventListener('click', () => this.resetTimer());
        }
        if (els.settingsBtn) {
            els.settingsBtn.addEventListener('click', () => this.toggleTimerSettings());
        }
        if (els.saveSettingsBtn) {
            els.saveSettingsBtn.addEventListener('click', () => this.saveTimerSettings());
        }
        if (els.cancelSettingsBtn) {
            els.cancelSettingsBtn.addEventListener('click', () => this.toggleTimerSettings());
        }
        if (els.workInput) {
            els.workInput.addEventListener('input', () => this.updateTimerInfo());
        }
        if (els.breakInput) {
            els.breakInput.addEventListener('input', () => this.updateTimerInfo());
        }
    }

    toggleTimer() {
        if (this.timerRunning) {
            this.pauseTimer();
        } else {
            this.startTimer();
        }
    }

    startTimer() {
        if (this.timerRunning) return;

        this.timerRunning = true;
        if (this.timerElements.startBtn) {
            this.timerElements.startBtn.textContent = '⏸️ Pause';
        }

        // Calculate absolute end time based on current remaining seconds
        const now = Date.now();
        this.timerEndTime = now + this.timeLeft * 1000;

        const tick = () => {
            if (!this.timerRunning) return;

            const now = Date.now();
            const remainingMs = this.timerEndTime - now;
            const remainingSec = Math.max(0, Math.round(remainingMs / 1000));

            if (remainingSec <= 0) {
                this.completeTimer();
                return;
            }

            // Only update if the displayed second actually changed
            if (remainingSec !== this.timeLeft) {
                this.timeLeft = remainingSec;
                this.updateTimerDisplay();
            }

            // Schedule next frame
            this.timerAnimationFrame = requestAnimationFrame(tick);
        };

        this.timerAnimationFrame = requestAnimationFrame(tick);
        this.updateTimerDisplay();
    }

    pauseTimer() {
        if (!this.timerRunning) return;

        this.timerRunning = false;
        if (this.timerAnimationFrame) {
            cancelAnimationFrame(this.timerAnimationFrame);
            this.timerAnimationFrame = null;
        }
        if (this.timerElements.startBtn) {
            this.timerElements.startBtn.textContent = '▶️ Start';
        }

        // Store the exact remaining time (already updated in tick loop)
        this.updateTimerDisplay();
    }

    resetTimer() {
        this.pauseTimer();
        this.isWorkSession = true;
        this.timeLeft = this.workTime;
        this.updateTimerDisplay();

        if (this.timerElements.status) {
            this.timerElements.status.textContent = 'Ready';
        }
        if (this.timerElements.progressBar) {
            this.timerElements.progressBar.style.width = '0%';
        }
    }

    completeTimer() {
        this.pauseTimer();

        // Switch session type
        this.isWorkSession = !this.isWorkSession;
        this.timeLeft = this.isWorkSession ? this.workTime : this.breakTime;

        const sessionType = this.isWorkSession ? 'Work' : 'Break';
        if (this.timerElements.status) {
            this.timerElements.status.textContent = `${sessionType} Session Complete! 🎉`;
        }

        this.playBeepSound();

        // Auto‑start next session after 2 seconds
        setTimeout(() => {
            this.startTimer();
        }, 2000);
    }

    updateTimerDisplay() {
        const els = this.timerElements;

        if (els.time) {
            const minutes = Math.floor(this.timeLeft / 60);
            const seconds = this.timeLeft % 60;
            els.time.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }

        if (els.status) {
            const sessionName = this.isWorkSession ? 'Work Session' : 'Break Time';
            if (this.timerRunning) {
                els.status.textContent = `${sessionName} Running`;
            } else {
                els.status.textContent = `${sessionName} Ready`;
            }
        }

        if (els.progressBar) {
            const totalTime = this.isWorkSession ? this.workTime : this.breakTime;
            const progress = ((totalTime - this.timeLeft) / totalTime) * 100;
            els.progressBar.style.width = `${progress}%`;

            if (this.isWorkSession) {
                els.progressBar.style.background = 'linear-gradient(90deg, var(--interactive-accent, #2196f3), var(--interactive-accent-hover, #1976d2))';
            } else {
                els.progressBar.style.background = 'linear-gradient(90deg, var(--color-green, #4caf50), #45a049)';
            }
        }
    }

    toggleTimerSettings() {
        const settingsEl = this.timerElements.settingsEl;
        if (!settingsEl) return;

        const isVisible = settingsEl.style.display !== 'none';
        settingsEl.style.display = isVisible ? 'none' : 'block';

        if (!isVisible) {
            // Populate inputs with current values
            if (this.timerElements.workInput) {
                this.timerElements.workInput.value = this.workTime / 60;
            }
            if (this.timerElements.breakInput) {
                this.timerElements.breakInput.value = this.breakTime / 60;
            }
        }
    }

    saveTimerSettings() {
        if (this.timerElements.workInput) {
            this.workTime = parseInt(this.timerElements.workInput.value, 10) * 60;
        }
        if (this.timerElements.breakInput) {
            this.breakTime = parseInt(this.timerElements.breakInput.value, 10) * 60;
        }

        if (!this.timerRunning) {
            // Reset to new work time only if timer is not running
            if (this.isWorkSession) {
                this.timeLeft = this.workTime;
            } else {
                this.timeLeft = this.breakTime;
            }
            this.updateTimerDisplay();
        }

        this.updateTimerInfo();
        this.toggleTimerSettings();
    }

    updateTimerInfo() {
        const els = this.timerElements;
        if (els.workInput && els.breakInput && els.infoEl) {
            els.infoEl.textContent = `Work: ${els.workInput.value}min | Break: ${els.breakInput.value}min`;
        }
    }

    playBeepSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            console.log('Audio not available:', error);
        }
    }

    /* ────────────────────────────── TASKS ────────────────────────────── */
    addTasksSection(container) {
        const section = container.createDiv("dtp-section");
        const tasksDiv = section.createDiv("tasks-section");

        tasksDiv.innerHTML = `
            <div class="task-input-section">
                <input type="text" class="task-input" placeholder="Add a new task...">
                <button class="add-task-btn">Add</button>
            </div>
            <div class="task-list-container"></div>
        `;

        this.taskElements = {
            input: tasksDiv.querySelector('.task-input'),
            addBtn: tasksDiv.querySelector('.add-task-btn'),
            container: tasksDiv.querySelector('.task-list-container')
        };

        this.attachTaskListeners();
        this.renderTasks();
    }

    attachTaskListeners() {
        const { input, addBtn } = this.taskElements;

        if (addBtn) {
            addBtn.addEventListener('click', () => this.addTask());
        }

        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.addTask();
            });
        }
    }

    addTask() {
        const input = this.taskElements.input;
        const text = input.value.trim();
        if (!text) return;

        this.tasks.push({
            id: Date.now(),
            text: text,
            completed: false
        });

        input.value = '';
        this.renderTasks();
    }

    toggleTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            this.renderTasks();
        }
    }

    deleteTask(taskId) {
        this.tasks = this.tasks.filter(t => t.id !== taskId);
        this.renderTasks();
    }

    renderTasks() {
        const container = this.taskElements.container;
        if (!container) return;

        container.empty();

        if (this.tasks.length === 0) {
            container.createDiv('empty-tasks').textContent = 'No tasks yet. Add your first task above!';
            return;
        }

        this.tasks.forEach(task => {
            const taskEl = container.createDiv('task-item');
            if (task.completed) taskEl.classList.add('completed');

            const checkbox = taskEl.createEl('input', { type: 'checkbox' });
            checkbox.checked = task.completed;
            checkbox.addEventListener('change', () => this.toggleTask(task.id));

            const taskText = taskEl.createDiv('task-text');
            taskText.textContent = task.text;

            const deleteBtn = taskEl.createEl('button', { text: '🗑️', cls: 'delete-task-btn' });
            deleteBtn.addEventListener('click', () => this.deleteTask(task.id));
        });
    }

    /* ────────────────────────────── CLEANUP ────────────────────────────── */
    onClose() {
        if (this.timerAnimationFrame) {
            cancelAnimationFrame(this.timerAnimationFrame);
        }
    }
}

/**
 * Main plugin class
 */
module.exports = class SimpleTestPlugin extends Plugin {
    async onload() {
        console.log("Deadline Plugin loading...");

        this.registerView(
            VIEW_TYPE,
            (leaf) => new SimpleWorkingView(leaf, this)
        );

        this.addRibbonIcon('calendar-days', 'Deadline', () => {
            this.activateView();
        });

        this.addCommand({
            id: 'open-deadline',
            name: 'Open Deadline',
            callback: () => this.activateView()
        });

        console.log("Deadline Plugin loaded!");
    }

    async onunload() {
        console.log("Deadline Plugin unloaded!");
    }

    async activateView() {
        const { workspace } = this.app;
        let leaf = workspace.getLeavesOfType(VIEW_TYPE)[0];

        if (!leaf) {
            leaf = workspace.getLeftLeaf(false);
        }

        if (leaf) {
            await leaf.setViewState({ type: VIEW_TYPE, active: true });
            workspace.revealLeaf(leaf);
        }
    }
};
