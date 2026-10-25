package feed

import (
	"context"
	"errors"
)

type Service interface {
	ListFeeds(ctx context.Context, userID string) ([]FeedItem, error)
	CreateFeed(ctx context.Context, req CreateFeedRequest, authorID, authorName, authorAvatar string) (*FeedItem, error)
	ToggleLike(ctx context.Context, feedID, userID string) (bool, int, error)
	ShareFeed(ctx context.Context, feedID string) (int, error)
}

type service struct {
	repo Repository
}

func NewService(repo Repository) Service {
	return &service{repo: repo}
}

func (s *service) ListFeeds(ctx context.Context, userID string) ([]FeedItem, error) {
	return s.repo.ListFeeds(ctx, userID)
}

func (s *service) CreateFeed(ctx context.Context, req CreateFeedRequest, authorID, authorName, authorAvatar string) (*FeedItem, error) {
	if req.Content == "" {
		return nil, errors.New("isi postingan feed tidak boleh kosong")
	}
	if req.MediaURL == "" {
		return nil, errors.New("lampiran foto atau video reels wajib disertakan")
	}
	item := &FeedItem{
		AuthorID:     authorID,
		AuthorName:   authorName,
		AuthorAvatar: authorAvatar,
		ReportID:     req.ReportID,
		IssueID:      req.IssueID,
		Content:      req.Content,
		MediaType:    req.MediaType,
		MediaURL:     req.MediaURL,
		LikesCount:   0,
		SharesCount:  0,
	}
	if err := s.repo.CreateFeed(ctx, item); err != nil {
		return nil, err
	}
	return item, nil
}

func (s *service) ToggleLike(ctx context.Context, feedID, userID string) (bool, int, error) {
	if userID == "" {
		return false, 0, errors.New("wajib masuk untuk menyukai postingan")
	}
	return s.repo.ToggleLike(ctx, feedID, userID)
}

func (s *service) ShareFeed(ctx context.Context, feedID string) (int, error) {
	return s.repo.IncrementShare(ctx, feedID)
}
