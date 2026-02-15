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

type Device struct {
	ID string `json:"id"`
}


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


func (a *App) FastForward(deviceID string) {
	exec.Command("adb", "-s", deviceID, "shell", "input", "keyevent", "90").Run()
}


func (a *App) Rewind(deviceID string) {
	exec.Command("adb", "-s", deviceID, "shell", "input", "keyevent", "89").Run()
}

func (a *App) StartStatusMonitor() {
    go func() {
        for {
            
            
            currTime := "00:10:00" 
            totalTime := "01:30:00" 
            percentage := 15.0      

    
            runtime.EventsEmit(a.ctx, "vlc_status", map[string]interface{}{
                "curr": currTime,
                "total": totalTime,
                "percent": percentage,
            })

            time.Sleep(1 * time.Second)
        }
    }()
}

func (a *App) PlayVLC(deviceID string, videoURL string) string {
   
    if strings.TrimSpace(videoURL) == "" {
        return "Error: URL cannot be blank"
    }

    
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
func (a *App) EmergencyKill() string {
    err := exec.Command("adb", "kill-server").Run()
    if err != nil {
        return fmt.Sprintf("Error killing server: %s", err.Error())
    }
    return "ADB_TERMINATED"
}