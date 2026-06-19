# Windows packaged QA

Run this checklist on a Windows machine or VM after building the NSIS installer with:

```bash
npm run dist:win
```

## Install and launch

- Install CallFlow from the generated NSIS installer.
- Confirm the Start Menu shortcut opens the app.
- Confirm the Desktop shortcut opens the app when selected during install.
- Confirm the app version matches `package.json`.

## Runtime behavior

- Register a call and restart the app; the call must persist.
- Copy the last CRM line and paste it into Notepad.
- Export a note as `.md` and `.txt`.
- Export a full backup, import it, and confirm calls, reminders, settings, knowledge base and timer state are restored.
- Create a reminder due in the next minute and confirm the alarm overlay and notification appear.
- Complete and snooze a reminder from the alarm overlay.
- Enable background close, close the window, and confirm the app keeps reminder checks alive.
- Restart Windows or sign out/in if startup behavior changed.

## Storage and diagnostics

- Open Settings, refresh Diagnostics, and confirm data path, app version, schema versions and log path are shown.
- Confirm `%APPDATA%/CallFlow` contains versioned JSON files and `logs/callflow.log`.
- Uninstall CallFlow and confirm the uninstaller runs. App data should remain unless removed manually.
