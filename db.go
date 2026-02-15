package main

import (
	"database/sql"
	_ "github.com/mattn/go-sqlite3"
)

var db *sql.DB

func InitDB() error {
	var err error
	db, err = sql.Open("sqlite3", "vlc_cast.db")
	if err != nil {
		return err
	}

	query := `
	CREATE TABLE IF NOT EXISTS recent (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		url TEXT NOT NULL,
		date TEXT,
		time TEXT
	);`
	_, err = db.Exec(query)
	return err
}
