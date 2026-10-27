package feed

import (
	"context"
	"errors"
	"strings"
)

type Service interface {
	ListFeeds(ctx context.Context, userID, tab string) ([]FeedItem, error)
	CreateFeed(ctx context.Context, req CreateFeedRequest, authorID, authorName, authorAvatar string) (*FeedItem, error)
	ToggleLike(ctx context.Context, feedID, userID string) (bool, int, error)
	ToggleSupport(ctx context.Context, feedID, userID, userName string) (bool, int, error)
	ShareFeed(ctx context.Context, feedID string) (int, error)
	ListComments(ctx context.Context, feedID string) ([]CommentItem, error)
	AddComment(ctx context.Context, feedID, userID, authorName, content string) (*CommentItem, error)
	ListSupporters(ctx context.Context, feedID string) ([]SupporterItem, error)
}

type service struct {
	repo Repository
}

func NewService(repo Repository) Service {
	return &service{repo: repo}
}

func (s *service) ListFeeds(ctx context.Context, userID, tab string) ([]FeedItem, error) {
	return s.repo.ListFeeds(ctx, userID, tab)
}

func (s *service) CreateFeed(ctx context.Context, req CreateFeedRequest, authorID, authorName, authorAvatar string) (*FeedItem, error) {
	trimmed := strings.TrimSpace(req.Content)
	if trimmed == "" {
		return nil, errors.New("isi postingan feed tidak boleh kosong")
	}
	if req.MediaType == "" {
		req.MediaType = MediaImage
	}
	item := &FeedItem{
		AuthorID:      authorID,
		AuthorName:    authorName,
		AuthorAvatar:  authorAvatar,
		ReportID:      req.ReportID,
		IssueID:       req.IssueID,
		Content:       trimmed,
		MediaType:     req.MediaType,
		MediaURL:      req.MediaURL,
		LikesCount:    0,
		SharesCount:   0,
		SupportCount:  0,
		CommentsCount: 0,
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

func (s *service) ToggleSupport(ctx context.Context, feedID, userID, userName string) (bool, int, error) {
	if userID == "" {
		return false, 0, errors.New("wajib masuk untuk mendukung laporan")
	}
	return s.repo.ToggleSupport(ctx, feedID, userID, userName)
}

func (s *service) ShareFeed(ctx context.Context, feedID string) (int, error) {
	return s.repo.IncrementShare(ctx, feedID)
}

func (s *service) ListComments(ctx context.Context, feedID string) ([]CommentItem, error) {
	return s.repo.ListComments(ctx, feedID)
}

func (s *service) AddComment(ctx context.Context, feedID, userID, authorName, content string) (*CommentItem, error) {
	trimmed := strings.TrimSpace(content)
	if trimmed == "" {
		return nil, errors.New("isi komentar tidak boleh kosong")
	}
	if len(trimmed) > 500 {
		return nil, errors.New("komentar maksimal 500 karakter")
	}
	if authorName == "" {
		authorName = "Warga Peduli"
	}
	item := &CommentItem{
		FeedID:     feedID,
		UserID:     userID,
		AuthorName: authorName,
		Content:    trimmed,
	}
	if err := s.repo.AddComment(ctx, item); err != nil {
		return nil, err
	}
	return item, nil
}

func (s *service) ListSupporters(ctx context.Context, feedID string) ([]SupporterItem, error) {
	return s.repo.ListSupporters(ctx, feedID)
}
