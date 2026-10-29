package feed

import (
	"context"
	"errors"
	"fmt"
	"net/url"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"govra/internal/platform/db"
)

type Repository interface {
	ListFeeds(ctx context.Context, userID, tab string) ([]FeedItem, error)
	CreateFeed(ctx context.Context, item *FeedItem) error
	ToggleLike(ctx context.Context, feedID, userID string) (bool, int, error)
	ToggleSupport(ctx context.Context, feedID, userID, userName string) (bool, int, error)
	IncrementShare(ctx context.Context, feedID string) (int, error)
	ListComments(ctx context.Context, feedID string) ([]CommentItem, error)
	AddComment(ctx context.Context, item *CommentItem) error
	ListSupporters(ctx context.Context, feedID string) ([]SupporterItem, error)
}

type repository struct {
	db       *db.Database
	mu       sync.RWMutex
	feeds    []*FeedItem
	likes    map[string]map[string]bool
	supports map[string]map[string]SupporterItem
	comments map[string][]CommentItem
	shares   map[string]int
}

func NewRepository(database *db.Database) Repository {
	return &repository{
		db:       database,
		feeds:    make([]*FeedItem, 0),
		likes:    make(map[string]map[string]bool),
		supports: make(map[string]map[string]SupporterItem),
		comments: make(map[string][]CommentItem),
		shares:   make(map[string]int),
	}
}

func (r *repository) ListFeeds(ctx context.Context, userID, tab string) ([]FeedItem, error) {
	if r.db != nil && r.db.HasREST() {
		var repList []struct {
			ID            string    `json:"id"`
			Code          string    `json:"code"`
			ReporterID    *string   `json:"reporter_id"`
			Title         *string   `json:"title"`
			Description   string    `json:"description"`
			Status        string    `json:"status"`
			HideReason    *string   `json:"hide_reason"`
			AddressDetail *string   `json:"address_detail"`
			DistrictID    *string   `json:"district_id"`
			VillageID     *string   `json:"village_id"`
			CreatedAt     time.Time `json:"created_at"`
		}

		endpoint := "reports?is_hidden=eq.false&order=created_at.desc"
		if err := r.db.PostgRESTGet(ctx, endpoint, &repList); err == nil && len(repList) > 0 {
			var attList []struct {
				ReportID string `json:"report_id"`
				FileURL  string `json:"file_url"`
			}
			_ = r.db.PostgRESTGet(ctx, "report_attachments?select=report_id,file_url&order=created_at.asc", &attList)
			attMap := make(map[string][]string)
			for _, a := range attList {
				attMap[a.ReportID] = append(attMap[a.ReportID], a.FileURL)
			}

			var profList []struct {
				ID          string `json:"id"`
				DisplayName string `json:"display_name"`
			}
			_ = r.db.PostgRESTGet(ctx, "profiles?select=id,display_name", &profList)
			profMap := make(map[string]string)
			for _, p := range profList {
				profMap[p.ID] = p.DisplayName
			}

			var distList []struct {
				ID   string `json:"id"`
				Name string `json:"name"`
			}
			_ = r.db.PostgRESTGet(ctx, "districts?select=id,name", &distList)
			distMap := make(map[string]string)
			for _, d := range distList {
				distMap[d.ID] = d.Name
			}

			var villList []struct {
				ID   string `json:"id"`
				Name string `json:"name"`
			}
			_ = r.db.PostgRESTGet(ctx, "villages?select=id,name", &villList)
			villMap := make(map[string]string)
			for _, v := range villList {
				villMap[v.ID] = v.Name
			}

			var dbLikes []struct {
				FeedID string `json:"feed_id"`
				UserID string `json:"user_id"`
			}
			_ = r.db.PostgRESTGet(ctx, "feed_likes?select=feed_id,user_id", &dbLikes)
			dbLikesMap := make(map[string]map[string]bool)
			for _, l := range dbLikes {
				if dbLikesMap[l.FeedID] == nil {
					dbLikesMap[l.FeedID] = make(map[string]bool)
				}
				dbLikesMap[l.FeedID][l.UserID] = true
			}

			var dbSupports []struct {
				FeedID string `json:"feed_id"`
				UserID string `json:"user_id"`
			}
			_ = r.db.PostgRESTGet(ctx, "feed_supports?select=feed_id,user_id", &dbSupports)
			dbSupportsMap := make(map[string]map[string]bool)
			for _, s := range dbSupports {
				if dbSupportsMap[s.FeedID] == nil {
					dbSupportsMap[s.FeedID] = make(map[string]bool)
				}
				dbSupportsMap[s.FeedID][s.UserID] = true
			}

			var dbComments []struct {
				FeedID string `json:"feed_id"`
			}
			_ = r.db.PostgRESTGet(ctx, "feed_comments?select=feed_id", &dbComments)
			dbCommentsCount := make(map[string]int)
			for _, c := range dbComments {
				dbCommentsCount[c.FeedID]++
			}

			r.mu.RLock()
			items := make([]FeedItem, 0, len(repList))
			for _, rep := range repList {
				author := "Warga Bandung"
				if rep.ReporterID != nil && profMap[*rep.ReporterID] != "" {
					author = profMap[*rep.ReporterID]
				}

				locParts := []string{}
				if rep.VillageID != nil && villMap[*rep.VillageID] != "" {
					vName := villMap[*rep.VillageID]
					if !strings.HasPrefix(strings.ToLower(vName), "kelurahan") && !strings.HasPrefix(strings.ToLower(vName), "desa") {
						vName = "Kelurahan " + vName
					}
					locParts = append(locParts, vName)
				}
				if rep.DistrictID != nil && distMap[*rep.DistrictID] != "" {
					dName := distMap[*rep.DistrictID]
					if !strings.HasPrefix(strings.ToLower(dName), "kecamatan") {
						dName = "Kecamatan " + dName
					}
					locParts = append(locParts, dName)
				}
				if len(locParts) == 0 && rep.AddressDetail != nil && *rep.AddressDetail != "" {
					locParts = append(locParts, *rep.AddressDetail)
				}
				if len(locParts) == 0 {
					locParts = append(locParts, "Kota Bandung")
				}
				location := strings.Join(locParts, ", ")

				photos := attMap[rep.ID]
				if photos == nil {
					photos = []string{}
				}
				primaryPhoto := ""
				if len(photos) > 0 {
					primaryPhoto = photos[0]
				}

				title := "Laporan Warga"
				if rep.Title != nil && *rep.Title != "" {
					title = *rep.Title
				}

				lCount := len(dbLikesMap[rep.ID])
				if lCount == 0 && r.likes[rep.ID] != nil {
					lCount = len(r.likes[rep.ID])
				}
				isLiked := false
				if userID != "" {
					if len(dbLikesMap) > 0 {
						isLiked = dbLikesMap[rep.ID][userID]
					} else if r.likes[rep.ID] != nil {
						isLiked = r.likes[rep.ID][userID]
					}
				}

				sCount := len(dbSupportsMap[rep.ID])
				if sCount == 0 && r.supports[rep.ID] != nil {
					sCount = len(r.supports[rep.ID])
				}
				isSupported := false
				if userID != "" {
					if len(dbSupportsMap) > 0 {
						isSupported = dbSupportsMap[rep.ID][userID]
					} else if r.supports[rep.ID] != nil {
						_, isSupported = r.supports[rep.ID][userID]
					}
				}

				cCount := max(dbCommentsCount[rep.ID], len(r.comments[rep.ID]))
				shCount := r.shares[rep.ID]

				hrStr := ""
				if rep.HideReason != nil {
					hrStr = *rep.HideReason
				}

				items = append(items, FeedItem{
					ID:            rep.ID,
					AuthorID:      "",
					AuthorName:    author,
					ReportID:      rep.ID,
					ReportCode:    rep.Code,
					IssueTitle:    title,
					Content:       rep.Description,
					Status:        rep.Status,
					HideReason:    hrStr,
					Location:      location,
					MediaType:     MediaImage,
					MediaURL:      primaryPhoto,
					MediaURLs:     photos,
					LikesCount:    lCount,
					SupportCount:  sCount,
					CommentsCount: cCount,
					SharesCount:   shCount,
					IsLiked:       isLiked,
					IsSupported:   isSupported,
					CreatedAt:     rep.CreatedAt,
				})
			}
			r.mu.RUnlock()
			return items, nil
		}
	}

	r.mu.RLock()
	defer r.mu.RUnlock()
	res := make([]FeedItem, 0, len(r.feeds))
	for _, f := range r.feeds {
		item := *f
		if userID != "" && r.likes[f.ID] != nil {
			item.IsLiked = r.likes[f.ID][userID]
		}
		if userID != "" && r.supports[f.ID] != nil {
			_, item.IsSupported = r.supports[f.ID][userID]
		}
		if r.supports[f.ID] != nil {
			item.SupportCount = len(r.supports[f.ID])
		}
		if r.comments[f.ID] != nil {
			item.CommentsCount = len(r.comments[f.ID])
		}
		if r.shares[f.ID] > 0 {
			item.SharesCount = r.shares[f.ID]
		}
		res = append(res, item)
	}
	return res, nil
}

func (r *repository) CreateFeed(ctx context.Context, item *FeedItem) error {
	if item.ID == "" {
		item.ID = uuid.New().String()
	}
	item.CreatedAt = time.Now()

	r.mu.Lock()
	defer r.mu.Unlock()
	r.feeds = append([]*FeedItem{item}, r.feeds...)
	return nil
}

func (r *repository) ToggleLike(ctx context.Context, feedID, userID string) (bool, int, error) {
	if userID == "" {
		return false, 0, errors.New("wajib masuk terlebih dahulu")
	}

	r.mu.Lock()
	defer r.mu.Unlock()

	if r.likes[feedID] == nil {
		r.likes[feedID] = make(map[string]bool)
	}

	currentlyLiked := r.likes[feedID][userID]
	if currentlyLiked {
		delete(r.likes[feedID], userID)
		if r.db != nil && r.db.HasREST() {
			endpoint := fmt.Sprintf("feed_likes?feed_id=eq.%s&user_id=eq.%s", url.QueryEscape(feedID), url.QueryEscape(userID))
			_ = r.db.PostgRESTDelete(ctx, endpoint)
		}
	} else {
		r.likes[feedID][userID] = true
		if r.db != nil && r.db.HasREST() {
			payload := map[string]any{
				"feed_id": feedID,
				"user_id": userID,
			}
			_ = r.db.PostgRESTPost(ctx, "feed_likes", payload, nil)
		}
	}

	newCount := len(r.likes[feedID])
	for _, f := range r.feeds {
		if f.ID == feedID {
			f.LikesCount = newCount
			break
		}
	}
	return !currentlyLiked, newCount, nil
}

func (r *repository) ToggleSupport(ctx context.Context, feedID, userID, userName string) (bool, int, error) {
	if userID == "" {
		return false, 0, errors.New("wajib masuk terlebih dahulu")
	}

	if userName == "" {
		userName = "Warga Peduli"
	}

	r.mu.Lock()
	defer r.mu.Unlock()

	if r.supports[feedID] == nil {
		r.supports[feedID] = make(map[string]SupporterItem)
	}

	_, exists := r.supports[feedID][userID]
	if exists {
		delete(r.supports[feedID], userID)
		if r.db != nil && r.db.HasREST() {
			endpoint := fmt.Sprintf("feed_supports?feed_id=eq.%s&user_id=eq.%s", url.QueryEscape(feedID), url.QueryEscape(userID))
			_ = r.db.PostgRESTDelete(ctx, endpoint)
		}
	} else {
		r.supports[feedID][userID] = SupporterItem{
			ID:            uuid.New().String(),
			FeedID:        feedID,
			UserID:        userID,
			SupporterName: userName,
			CreatedAt:     time.Now(),
		}
		if r.db != nil && r.db.HasREST() {
			payload := map[string]any{
				"feed_id":        feedID,
				"user_id":        userID,
				"supporter_name": userName,
			}
			_ = r.db.PostgRESTPost(ctx, "feed_supports", payload, nil)
		}
	}

	newCount := len(r.supports[feedID])
	for _, f := range r.feeds {
		if f.ID == feedID {
			f.SupportCount = newCount
			break
		}
	}
	return !exists, newCount, nil
}

func (r *repository) IncrementShare(ctx context.Context, feedID string) (int, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.shares[feedID]++
	return r.shares[feedID], nil
}

func (r *repository) ListComments(ctx context.Context, feedID string) ([]CommentItem, error) {
	if r.db != nil && r.db.HasREST() {
		var dbComments []struct {
			ID         string    `json:"id"`
			FeedID     string    `json:"feed_id"`
			UserID     string    `json:"user_id"`
			AuthorName string    `json:"author_name"`
			Content    string    `json:"content"`
			CreatedAt  time.Time `json:"created_at"`
		}
		endpoint := fmt.Sprintf("feed_comments?feed_id=eq.%s&order=created_at.asc", url.QueryEscape(feedID))
		if err := r.db.PostgRESTGet(ctx, endpoint, &dbComments); err == nil && len(dbComments) > 0 {
			res := make([]CommentItem, len(dbComments))
			for i, c := range dbComments {
				res[i] = CommentItem{
					ID:         c.ID,
					FeedID:     c.FeedID,
					UserID:     c.UserID,
					AuthorName: c.AuthorName,
					Content:    c.Content,
					CreatedAt:  c.CreatedAt,
				}
			}
			return res, nil
		}
	}

	r.mu.RLock()
	defer r.mu.RUnlock()
	items := r.comments[feedID]
	if items == nil {
		return []CommentItem{}, nil
	}
	res := make([]CommentItem, len(items))
	copy(res, items)
	return res, nil
}

func (r *repository) AddComment(ctx context.Context, item *CommentItem) error {
	if item.ID == "" {
		item.ID = uuid.New().String()
	}
	item.CreatedAt = time.Now()

	if r.db != nil && r.db.HasREST() {
		payload := map[string]any{
			"id":          item.ID,
			"feed_id":     item.FeedID,
			"user_id":     item.UserID,
			"author_name": item.AuthorName,
			"content":     item.Content,
			"created_at":  item.CreatedAt,
		}
		_ = r.db.PostgRESTPost(ctx, "feed_comments", payload, nil)
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	r.comments[item.FeedID] = append(r.comments[item.FeedID], *item)
	for _, f := range r.feeds {
		if f.ID == item.FeedID {
			f.CommentsCount = len(r.comments[item.FeedID])
			break
		}
	}
	return nil
}

func (r *repository) ListSupporters(ctx context.Context, feedID string) ([]SupporterItem, error) {
	if r.db != nil && r.db.HasREST() {
		var dbSupports []struct {
			ID            string    `json:"id"`
			FeedID        string    `json:"feed_id"`
			UserID        string    `json:"user_id"`
			SupporterName string    `json:"supporter_name"`
			CreatedAt     time.Time `json:"created_at"`
		}
		endpoint := fmt.Sprintf("feed_supports?feed_id=eq.%s&order=created_at.desc", url.QueryEscape(feedID))
		if err := r.db.PostgRESTGet(ctx, endpoint, &dbSupports); err == nil && len(dbSupports) > 0 {
			res := make([]SupporterItem, len(dbSupports))
			for i, s := range dbSupports {
				res[i] = SupporterItem{
					ID:            s.ID,
					FeedID:        s.FeedID,
					UserID:        s.UserID,
					SupporterName: s.SupporterName,
					CreatedAt:     s.CreatedAt,
				}
			}
			return res, nil
		}
	}

	r.mu.RLock()
	defer r.mu.RUnlock()
	suppMap := r.supports[feedID]
	if suppMap == nil {
		return []SupporterItem{}, nil
	}
	res := make([]SupporterItem, 0, len(suppMap))
	for _, s := range suppMap {
		res = append(res, s)
	}
	sort.SliceStable(res, func(i, j int) bool {
		return res[i].CreatedAt.After(res[j].CreatedAt)
	})
	return res, nil
}
