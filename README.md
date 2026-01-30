# Date Timer Pomodoro Pro

A comprehensive productivity plugin for Obsidian that combines calendar functionality, Pomodoro timer, and task management into a single integrated workspace view.

## Features

### 📅 Calendar
- **Monthly View**: Clean, interactive calendar showing the current month
- **Navigation**: Browse between months with previous/next buttons
- **Daily File Creation**: Click any date to create/open a daily note (YYYY-MM-DD.md format)
- **Today Highlighting**: Current date is visually highlighted
- **Auto-Open**: Daily notes open automatically in new tabs when created
- **Visual Feedback**: Success/error messages for file operations

### ⏱️ Pomodoro Timer
- **Flexible Timing**: Default 40-minute work sessions and 5-minute breaks
- **Customizable Settings**: Adjust work and break durations through settings panel
- **Visual Progress**: Animated progress bar shows elapsed time
- **Large Display**: Clear MM:SS time display in monospace font
- **Status Indicators**: Shows Ready/Running/Complete states
- **Audio Feedback**: Completion sound when timer finishes
- **Auto-Reset**: Automatically resets after completion with 2-second delay

### 📋 Task Manager
- **Quick Add**: Add tasks via input field with Enter key support
- **Task List**: Visual list with checkboxes for each task
- **Complete/Uncomplete**: Toggle task completion with visual feedback
- **Delete Tasks**: Remove individual tasks with delete button
- **Empty State**: Helpful message when no tasks exist
- **Visual States**: Completed tasks show strikethrough and reduced opacity

### 🎨 Professional Design
- **Obsidian Integration**: Uses native CSS variables for theme compatibility
- **Dark/Light Themes**: Seamlessly adapts to both light and dark modes
- **Smooth Animations**: Hover effects, transitions, and micro-interactions
- **Responsive Layout**: Adapts to different screen sizes and panel widths
- **Custom Scrollbars**: Styled scrollbars for task lists
- **Professional Typography**: Clean, readable interface with proper spacing

## Installation

### Method 1: Community Plugins (Recommended)
1. Go to **Settings → Community Plugins → Browse**
2. Search for "Date Timer Pomodoro Pro"
3. Click **Install** and then **Enable**

### Method 2: Manual Installation
1. Download the latest release from [GitHub Releases](https://github.com/YOUR_USERNAME/date-timer-pomodoro-pro/releases)
2. Extract the ZIP file to: `/Users/YOUR_USERNAME/.obsidian/plugins/date-timer-pomodoro-pro/`
3. Restart Obsidian completely
4. Go to **Settings → Community Plugins**
5. Enable "Date Timer Pomodoro Pro" in the list
6. Use the command palette (`Ctrl+P` or `Cmd+P`) and search for "Open Date Timer Pomodoro Pro"

### Method 2: Community Plugins (Future)
1. Go to **Settings → Community Plugins → Browse**
2. Search for "Date Timer Pomodoro Pro"
3. Click **Install** and then **Enable**

## Usage Guide

### Calendar Operations

#### Navigation
- **Previous Month**: Click the left arrow button (◀)
- **Next Month**: Click the right arrow button (▶)
- **Current Month**: Navigate back to today using the month/year display

#### Daily Note Creation
1. Click on any date in the calendar
2. A new file will be created with the format `YYYY-MM-DD.md`
3. The file will contain a template with headers and checkbox tasks
4. The file opens automatically in a new tab
5. Green confirmation message appears briefly if successful

### Timer Operations

#### Basic Controls
- **Start Timer**: Click the "Start" button (▶️) to begin countdown
- **Pause Timer**: Click "Pause" (⏸️) to temporarily stop the timer
- **Reset Timer**: Click "Reset" (🔄) to return to initial work duration

#### Settings Configuration
1. Click the **Settings** button to open the configuration panel
2. Adjust **Work Duration**: Set work session length (1-180 minutes)
3. Adjust **Break Duration**: Set break length (1-60 minutes)
4. Click **Save** to apply changes or **Cancel** to discard
5. Settings update the info display in real-time

#### Timer Behavior
- Timer counts down from the configured work duration
- Progress bar fills as time elapses
- Status changes from "Ready" → "Running" → "Complete!"
- Audio notification plays when timer completes
- Timer auto-resets after 2 seconds for next session

### Task Management

#### Adding Tasks
1. Type task description in the input field
2. Press **Enter** or click **Add** button
3. Task appears in the list below with checkbox

#### Managing Tasks
- **Complete Task**: Click the checkbox to toggle completion status
- **Delete Task**: Click the trash icon (🗑️) to remove task
- **View Status**: Completed tasks show strikethrough text

#### Task States
- **Active**: Black text, white background
- **Completed**: Strikethrough text, reduced opacity, gray background

## Configuration

### Default Settings
- **Work Duration**: 40 minutes
- **Break Duration**: 5 minutes
- **File Format**: `YYYY-MM-DD.md`
- **Template Content**: Predefined headers with checkbox tasks

### Customization Options
All visual elements use Obsidian's CSS variables, ensuring compatibility with:
- Light themes
- Dark themes  
- Custom color schemes
- Font preferences
- System scaling settings

## File Structure

```
date-timer-pomodoro-pro/
 ├── main.js              # Main plugin logic and UI components
 ├── manifest.json         # Obsidian plugin metadata
 ├── package.json          # Node.js package configuration
 ├── styles.css            # Plugin styling and animations
 ├── data/                # Directory for plugin data storage
 └── README.md             # This documentation file
```

## Technical Details

### Plugin Architecture
- **Framework**: Native Obsidian Plugin API (no external dependencies)
- **Language**: JavaScript (ES6+ compatible)
- **Styling**: CSS3 with CSS variables and animations
- **Audio**: Web Audio API for completion sounds
- **Storage**: Uses Obsidian's Vault API for file operations

### Key Components

#### SimpleWorkingView Class
- Main UI component extending Obsidian's `ItemView`
- Manages calendar, timer, and task sections
- Handles user interactions and state management

#### SimpleTestPlugin Class  
- Main plugin class extending Obsidian's `Plugin`
- Registers view type, ribbon icon, and commands
- Manages plugin lifecycle events

#### CSS Architecture
- Modular organization with clear section comments
- Responsive design using Flexbox and CSS Grid
- Smooth animations and transitions
- Cross-browser compatible with vendor prefixes

## Development

### Building from Source
This plugin uses the standard Obsidian plugin structure with no build process required:

1. Clone the plugin directory
2. Modify source files as needed
3. Reload the plugin in Obsidian
4. Debug using browser developer tools

### Extending Functionality
The modular structure allows for easy extensions:
- Add new calendar features in `addCalendarSection()`
- Enhance timer capabilities in `addTimerSection()`
- Expand task management in `addTasksSection()`
- Update styling in organized CSS sections

### Best Practices Followed
- **No Memory Leaks**: Proper cleanup of intervals and event listeners
- **Error Handling**: Try-catch blocks for file operations
- **Accessibility**: Semantic HTML and proper labeling
- **Performance**: Efficient DOM manipulation and event delegation
- **Maintainability**: Clear code structure and comprehensive comments

## Troubleshooting

### Common Issues

#### Plugin Not Loading
- Verify plugin files are in the correct directory
- Restart Obsidian completely
- Check that the plugin is enabled in Settings
- Review developer console for error messages

#### Calendar Not Creating Files
- Check vault permissions for file creation
- Verify sufficient disk space
- Ensure no conflicting files exist
- Review Obsidian's error notifications

#### Timer Not Working
- Clear browser cache and reload plugin
- Check if other plugins are interfering
- Verify audio permissions for completion sound
- Reset plugin settings to defaults

#### Tasks Not Saving
- Tasks are session-based by design
- Restart plugin to clear task list
- Consider persistent storage for future versions

### Getting Help
For issues, feature requests, or contributions:
1. Check the developer console (F12) for error messages
2. Review Obsidian's plugin documentation
3. Test with other plugins disabled
4. Create an issue in the plugin repository

## Version History

### v1.0.0 (Current)
- Initial stable release
- Complete calendar with daily file creation
- Full-featured Pomodoro timer with settings
- Task management system
- Professional UI with animations
- Dark/light theme support

### Planned Features
- Persistent task storage
- Multiple timer presets
- Calendar event integration
- Export/import functionality
- Custom templates
- Statistics and tracking

## License

This plugin is licensed under the MIT License, allowing:
- Free commercial and personal use
- Modification and distribution
- Inclusion in other projects
- No warranty or liability

## Contributing

Contributions are welcome! Please follow these guidelines:
- Maintain the existing code style and structure
- Add appropriate comments for new features
- Test across different themes and screen sizes
- Update documentation for user-facing changes
- Submit pull requests with clear descriptions

## Support

If you find this plugin helpful, please consider:
- ⭐ Rating it in the Obsidian Community Plugins browser
- 🐛 Reporting issues to help improve stability  
- 💡 Suggesting features for future development
- 📝 Contributing documentation improvements

---

**Thank you for using Date Timer Pomodoro Pro!** 🎉

Built with ❤️ for the Obsidian community.