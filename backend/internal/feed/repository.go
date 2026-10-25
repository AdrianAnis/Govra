package feed

import (
	"context"
	"errors"
	"sync"
	"time"

	"github.com/google/uuid"
	"govra/internal/platform/db"
)

type Repository interface {
	ListFeeds(ctx context.Context, userID string) ([]FeedItem, error)
	CreateFeed(ctx context.Context, item *FeedItem) error
	ToggleLike(ctx context.Context, feedID, userID string) (bool, int, error)
	IncrementShare(ctx context.Context, feedID string) (int, error)
}

type repository struct {
	db    *db.Database
	mu    sync.RWMutex
	feeds []*FeedItem
	likes map[string]map[string]bool
}

func NewRepository(database *db.Database) Repository {
	r := &repository{
		db:    database,
		likes: make(map[string]map[string]bool),
	}
	r.seedFeeds()
	return r
}

func (r *repository) seedFeeds() {
	sample := &FeedItem{
		ID:           "fd-001",
		AuthorID:     "u0000000-0000-0000-0000-000000000003",
		AuthorName:   "Budi Santoso",
		AuthorAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80",
		IssueID:      "i0000000-0000-0000-0000-000000000001",
		IssueTitle:   "Jalan Berlubang di Dekat Bundaran Air Mancur",
		IssueUrgency: "TINGGI",
		Content:      "Kondisi terkini jalan berlubang di Jl. Merdeka Barat. Sangat berbahaya saat hujan deras, mohon warga bantu dukung agar cepat diperbaiki!",
		MediaType:    MediaImage,
		MediaURL:     "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80",
		LikesCount:   24,
		SharesCount:  8,
		CreatedAt:    time.Now().Add(-6 * time.Hour),
	}
	r.feeds = append(r.feeds, sample)
}

func (r *repository) ListFeeds(ctx context.Context, userID string) ([]FeedItem, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	res := make([]FeedItem, len(r.feeds))
	for i, f := range r.feeds {
		item := *f
		if userID != "" && r.likes[f.ID] != nil {
			item.IsLiked = r.likes[f.ID][userID]
		}
		res[i] = item
	}
	return res, nil
}

func (r *repository) CreateFeed(ctx context.Context, item *FeedItem) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	if item.ID == "" {
		item.ID = uuid.New().String()
	}
	item.CreatedAt = time.Now()
	r.feeds = append([]*FeedItem{item}, r.feeds...)
	return nil
}

func (r *repository) ToggleLike(ctx context.Context, feedID, userID string) (bool, int, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	var target *FeedItem
	for _, f := range r.feeds {
		if f.ID == feedID {
			target = f
			break
		}
	}
	if target == nil {
		return false, 0, errors.New("postingan feed tidak ditemukan")
	}
	if r.likes[feedID] == nil {
		r.likes[feedID] = make(map[string]bool)
	}
	liked := r.likes[feedID][userID]
	if liked {
		delete(r.likes[feedID], userID)
		target.LikesCount--
		return false, target.LikesCount, nil
	}
	r.likes[feedID][userID] = true
	target.LikesCount++
	return true, target.LikesCount, nil
}

func (r *repository) IncrementShare(ctx context.Context, feedID string) (int, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	for _, f := range r.feeds {
		if f.ID == feedID {
			f.SharesCount++
			return f.SharesCount, nil
		}
	}
	return 0, errors.New("postingan feed tidak ditemukan")
}
