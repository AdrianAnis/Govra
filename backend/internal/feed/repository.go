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
	if database == nil || database.Pool == nil {
		r.feeds = []*FeedItem{
			{
				ID:          "fd-001",
				AuthorID:    "a0000000-0000-0000-0000-000000000001",
				AuthorName:  "Budi Santoso",
				Content:     "Jalan berlubang di Jl. Sudirman akhirnya mulai ditambal dinas PU!",
				MediaType:   MediaImage,
				MediaURL:    "https://images.unsplash.com/photo-1541888946425-d0fbb18086f6",
				LikesCount:  12,
				SharesCount: 3,
				CreatedAt:   time.Now().Add(-2 * time.Hour),
			},
		}
	}
	return r
}

func (r *repository) ListFeeds(ctx context.Context, userID string) ([]FeedItem, error) {
	if r.db != nil && r.db.Pool != nil {
		query := `SELECT f.id, f.author_id, COALESCE(p.display_name,'Warga Peduli'), COALESCE(p.avatar_url,''), 
		          COALESCE(f.report_id::text,''), COALESCE(f.issue_id::text,''), COALESCE(i.title,''), COALESCE(i.urgency,'NORMAL'), 
		          f.content, f.media_type, f.media_url, f.likes_count, f.shares_count, f.created_at,
		          EXISTS(SELECT 1 FROM app.feed_likes fl WHERE fl.feed_id = f.id AND fl.user_id = NULLIF($1,'')::uuid) as is_liked 
		          FROM app.feeds f 
		          LEFT JOIN app.profiles p ON f.author_id = p.id 
		          LEFT JOIN app.issues i ON f.issue_id = i.id 
		          ORDER BY f.created_at DESC`
		rows, err := r.db.Pool.Query(ctx, query, userID)
		if err == nil {
			defer rows.Close()
			var list []FeedItem
			for rows.Next() {
				var item FeedItem
				var mediaTypeStr string
				if err := rows.Scan(&item.ID, &item.AuthorID, &item.AuthorName, &item.AuthorAvatar, &item.ReportID, &item.IssueID, &item.IssueTitle, &item.IssueUrgency, &item.Content, &mediaTypeStr, &item.MediaURL, &item.LikesCount, &item.SharesCount, &item.CreatedAt, &item.IsLiked); err == nil {
					item.MediaType = MediaType(mediaTypeStr)
					list = append(list, item)
				}
			}
			return list, nil
		}
	}

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
	if item.ID == "" {
		item.ID = uuid.New().String()
	}
	item.CreatedAt = time.Now()

	if r.db != nil && r.db.Pool != nil {
		query := `INSERT INTO app.feeds (id, author_id, report_id, issue_id, content, media_type, media_url, likes_count, shares_count, created_at) 
		          VALUES ($1, $2::uuid, NULLIF($3,'')::uuid, NULLIF($4,'')::uuid, $5, $6, $7, $8, $9, $10)`
		_, err := r.db.Pool.Exec(ctx, query, item.ID, item.AuthorID, item.ReportID, item.IssueID, item.Content, string(item.MediaType), item.MediaURL, item.LikesCount, item.SharesCount, item.CreatedAt)
		return err
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	r.feeds = append([]*FeedItem{item}, r.feeds...)
	return nil
}

func (r *repository) ToggleLike(ctx context.Context, feedID, userID string) (bool, int, error) {
	if r.db != nil && r.db.Pool != nil {
		var exists bool
		_ = r.db.Pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM app.feed_likes WHERE feed_id = $1::uuid AND user_id = $2::uuid)`, feedID, userID).Scan(&exists)
		if exists {
			_, _ = r.db.Pool.Exec(ctx, `DELETE FROM app.feed_likes WHERE feed_id = $1::uuid AND user_id = $2::uuid`, feedID, userID)
			_, _ = r.db.Pool.Exec(ctx, `UPDATE app.feeds SET likes_count = GREATEST(0, likes_count - 1) WHERE id = $1::uuid`, feedID)
		} else {
			_, _ = r.db.Pool.Exec(ctx, `INSERT INTO app.feed_likes (id, feed_id, user_id, created_at) VALUES ($1, $2::uuid, $3::uuid, now())`, uuid.New().String(), feedID, userID)
			_, _ = r.db.Pool.Exec(ctx, `UPDATE app.feeds SET likes_count = likes_count + 1 WHERE id = $1::uuid`, feedID)
		}
		var count int
		_ = r.db.Pool.QueryRow(ctx, `SELECT likes_count FROM app.feeds WHERE id = $1::uuid`, feedID).Scan(&count)
		return !exists, count, nil
	}

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
	if r.db != nil && r.db.Pool != nil {
		var count int
		err := r.db.Pool.QueryRow(ctx, `UPDATE app.feeds SET shares_count = shares_count + 1 WHERE id = $1::uuid RETURNING shares_count`, feedID).Scan(&count)
		if err == nil {
			return count, nil
		}
	}

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
