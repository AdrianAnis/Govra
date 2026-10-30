package assistant

import "errors"

var (
	ErrRateLimited   = errors.New("terlalu banyak permintaan, coba lagi beberapa menit lagi")
	ErrInvalidInput  = errors.New("format pesan tidak valid")
	ErrEmptyMessages = errors.New("daftar pesan tidak boleh kosong")
	ErrLastNotUser   = errors.New("pesan terakhir wajib dari user")
	ErrNotFound      = errors.New("data tidak ditemukan")
	ErrUnauthorized  = errors.New("wajib masuk terlebih dahulu")
)
