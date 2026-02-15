package main

import (
	"bytes"
	"context"
	"fmt"
	"os/exec"
	"strings"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type App struct {
	ctx context.Context
}

type Recent struct {
	ID   int
	URL  string
	Date string
	Time string
}

func NewApp() *App {
	return &App{}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}
func (a *App) GetRecent() ([]Recent, error) {
	rows, err := db.Query("SELECT id, url, date, time FROM recent ORDER BY id DESC LIMIT 50")
	if err != nil {
		return []Recent{}, nil
	}

	defer rows.Close()

	var list []Recent
	for rows.Next() {
		var r Recent
		rows.Scan(&r.ID, &r.URL, &r.Date, &r.Time)
		list = append(list, r)
	}
	return list, nil
}

func (a *App) DeleteRecent(id int) error {
    _, err := db.Exec("DELETE FROM recent WHERE id = ?", id)
    return err
}
// Device struct for the frontend
type Device struct {
	ID string `json:"id"`
}

// GetDevices scans for connected Android devices
func (a *App) GetDevices() []Device {
	cmd := exec.Command("adb", "devices")
	var out bytes.Buffer
	cmd.Stdout = &out
	cmd.Run()

	lines := strings.Split(out.String(), "\n")
	var devices []Device
	for _, line := range lines {
		if strings.Contains(line, "\tdevice") {
			parts := strings.Fields(line)
			if len(parts) > 0 {
				devices = append(devices, Device{ID: parts[0]})
			}
		}
	}
	return devices
}
func (a *App) AddDevice(addr string) ([]Device, error) {
	cmd := exec.Command("adb", "connect", addr)
	_, err := cmd.CombinedOutput()
	if err != nil {
		return nil, err
	}
	return a.GetDevices(), err
}

func (a *App) TogglePause(deviceID string) {
	exec.Command("adb", "-s", deviceID, "shell", "input", "keyevent", "85").Run()
}

// FastForward sends the fast-forward keyevent
func (a *App) FastForward(deviceID string) {
	exec.Command("adb", "-s", deviceID, "shell", "input", "keyevent", "90").Run()
}

// Rewind sends the rewind keyevent
func (a *App) Rewind(deviceID string) {
	exec.Command("adb", "-s", deviceID, "shell", "input", "keyevent", "89").Run()
}
// Inside your Go App struct
func (a *App) StartStatusMonitor() {
    go func() {
        for {
            // 1. Run ADB command to get VLC position
            // Example command: adb shell dumpsys media_session
            // Or better: use VLC's RC interface if enabled
            
            currTime := "00:10:00" // Replace with actual logic
            totalTime := "01:30:00" // Replace with actual logic
            percentage := 15.0      // (curr/total * 100)

            // 2. Emit event to React
            runtime.EventsEmit(a.ctx, "vlc_status", map[string]interface{}{
                "curr": currTime,
                "total": totalTime,
                "percent": percentage,
            })

            time.Sleep(1 * time.Second)
        }
    }()
}
// PlayVLC executes the force-stop and the specific Naruto stream intent
func (a *App) PlayVLC(deviceID string, videoURL string) string {
    // Sanity check for blank links
    if strings.TrimSpace(videoURL) == "" {
        return "Error: URL cannot be blank"
    }

    // 1. Force Stop & Start VLC
    exec.Command("adb", "-s", deviceID, "shell", "am", "force-stop", "org.videolan.vlc").Run()

    args := []string{
        "-s", deviceID, 
        "shell", "am", "start",
        "-a", "android.intent.action.VIEW",
        "-d", videoURL,
        "-n", "org.videolan.vlc/org.videolan.vlc.gui.video.VideoPlayerActivity",
        "--ei", "hardware_acceleration", "1",
    }

    cmd := exec.Command("adb", args...)
    if err := cmd.Run(); err != nil {
        return fmt.Sprintf("Error: %s", err.Error())
    }

    // 2. Log to Database ONLY if it's not a duplicate of the most recent entry
    var lastURL string
    _ = db.QueryRow("SELECT url FROM recent ORDER BY id DESC LIMIT 1").Scan(&lastURL)

    if videoURL != lastURL {
        now := time.Now()
        date := now.Format("2006-01-02")
        timeStr := now.Format("15:04:05")
        _, _ = db.Exec("INSERT INTO recent(url, date, time) VALUES(?,?,?)", videoURL, date, timeStr)
    }

    return "Success"
}