package main

import (
	"embed"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/mac"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {

	app := NewApp()
	err2 := InitDB()
	if err2 != nil {
		panic(err2)
	}
	err := wails.Run(&options.App{
		Title:  "VLC ADB Cast",
		Width:  1024,
		Height: 768,
		// Change Fullscreen from true to false
		Fullscreen: false,
		Frameless: false,
		// Use this instead to start maximized but visible
		WindowStartState: options.Maximised,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		Mac: &mac.Options{
            TitleBar: mac.TitleBarHiddenInset(),
            WebviewIsTransparent: true,
            WindowIsTranslucent:  true,
            
        },
		Bind: []interface{}{
			app,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
