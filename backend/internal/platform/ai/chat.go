package ai

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"sync"
	"time"
)

type ChatRole string

const (
	RoleUser      ChatRole = "USER"
	RoleAssistant ChatRole = "ASSISTANT"
)

type ChatTurn struct {
	Role    ChatRole
	Content string
}

type ChatToolDeclaration struct {
	Name        string
	Description string
	Parameters  ChatToolParameters
}

type ChatToolParameters struct {
	Type       string
	Properties map[string]ChatToolProperty
	Required   []string
}

type ChatToolProperty struct {
	Type        string
	Description string
}

type ChatToolCall struct {
	Name string
	Args map[string]string
}

type ChatToolResponse struct {
	Name    string
	Content string
}

type ChatToolExecutor func(ctx context.Context, call ChatToolCall) (ChatToolResponse, error)

var fallbackModels = []string{"gemini-3.5-flash", "gemini-3-flash-preview", "gemini-3.1-flash-lite"}

const quotaCooldown = 15 * time.Minute

type AssistantClient struct {
	apiKey     string
	model      string
	httpClient *http.Client
	mu         sync.Mutex
	exhausted  map[string]time.Time
}

type geminiChatReq struct {
	SystemInstruction *geminiSystemInstruction `json:"system_instruction,omitempty"`
	Contents          []geminiChatContent      `json:"contents"`
	Tools             []geminiToolsContainer   `json:"tools,omitempty"`
	GenerationConfig  geminiGenConfig          `json:"generationConfig"`
}

type geminiSystemInstruction struct {
	Parts []geminiTextPart `json:"parts"`
}

type geminiTextPart struct {
	Text string `json:"text"`
}

type geminiChatContent struct {
	Role  string           `json:"role"`
	Parts []geminiChatPart `json:"parts"`
}

type geminiChatPart struct {
	Text             string                    `json:"text,omitempty"`
	ThoughtSignature string                    `json:"thoughtSignature,omitempty"`
	FunctionCall     *geminiFunctionCallPart   `json:"functionCall,omitempty"`
	FunctionResponse *geminiFunctionReturnPart `json:"functionResponse,omitempty"`
}

type geminiFunctionCallPart struct {
	Name string            `json:"name"`
	Args map[string]string `json:"args,omitempty"`
}

type geminiFunctionReturnPart struct {
	Name     string                 `json:"name"`
	Response map[string]interface{} `json:"response"`
}

type geminiToolsContainer struct {
	FunctionDeclarations []geminiFuncDecl `json:"function_declarations"`
}

type geminiFuncDecl struct {
	Name        string              `json:"name"`
	Description string              `json:"description"`
	Parameters  geminiFuncDeclParam `json:"parameters"`
}

type geminiFuncDeclParam struct {
	Type       string                        `json:"type"`
	Properties map[string]geminiFuncDeclProp `json:"properties,omitempty"`
	Required   []string                      `json:"required,omitempty"`
}

type geminiFuncDeclProp struct {
	Type        string `json:"type"`
	Description string `json:"description"`
}

type geminiGenConfig struct {
	Temperature     float64 `json:"temperature"`
	MaxOutputTokens int     `json:"maxOutputTokens"`
}

type geminiChatResp struct {
	Candidates []struct {
		Content struct {
			Role  string           `json:"role"`
			Parts []geminiChatPart `json:"parts"`
		} `json:"content"`
	} `json:"candidates"`
}

func NewAssistantClient(apiKey, model string) *AssistantClient {
	if model == "" {
		model = "gemini-2.5-flash"
	}
	return &AssistantClient{
		apiKey: apiKey,
		model:  model,
		httpClient: &http.Client{
			Timeout: 45 * time.Second,
		},
		exhausted: make(map[string]time.Time),
	}
}

func (c *AssistantClient) candidateModels() []string {
	c.mu.Lock()
	defer c.mu.Unlock()
	now := time.Now()
	seen := make(map[string]bool)
	var models []string
	for _, m := range append([]string{c.model}, fallbackModels...) {
		if m == "" || seen[m] {
			continue
		}
		seen[m] = true
		if until, blocked := c.exhausted[m]; blocked && now.Before(until) {
			continue
		}
		models = append(models, m)
	}
	return models
}

func (c *AssistantClient) markExhausted(model string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.exhausted[model] = time.Now().Add(quotaCooldown)
}

func (c *AssistantClient) HasKey() bool {
	return c.apiKey != "" && !strings.HasPrefix(c.apiKey, "mock") && c.apiKey != "test-gemini-key"
}

func buildGeminiTools(tools []ChatToolDeclaration) []geminiToolsContainer {
	if len(tools) == 0 {
		return nil
	}
	var decls []geminiFuncDecl
	for _, t := range tools {
		props := make(map[string]geminiFuncDeclProp)
		for pk, pv := range t.Parameters.Properties {
			props[pk] = geminiFuncDeclProp{Type: pv.Type, Description: pv.Description}
		}
		decls = append(decls, geminiFuncDecl{
			Name:        t.Name,
			Description: t.Description,
			Parameters: geminiFuncDeclParam{
				Type:       t.Parameters.Type,
				Properties: props,
				Required:   t.Parameters.Required,
			},
		})
	}
	return []geminiToolsContainer{{FunctionDeclarations: decls}}
}

func buildInitialContents(messages []ChatTurn) []geminiChatContent {
	var contents []geminiChatContent
	for _, m := range messages {
		role := "user"
		if m.Role == RoleAssistant {
			role = "model"
		}
		contents = append(contents, geminiChatContent{
			Role:  role,
			Parts: []geminiChatPart{{Text: m.Content}},
		})
	}
	return contents
}

func (c *AssistantClient) GenerateChatCompletion(ctx context.Context, systemPrompt string, messages []ChatTurn, tools []ChatToolDeclaration, executor ChatToolExecutor) (string, error) {
	if !c.HasKey() {
		return "", errors.New("gemini assistant key not configured")
	}
	req := geminiChatReq{
		SystemInstruction: &geminiSystemInstruction{Parts: []geminiTextPart{{Text: systemPrompt}}},
		Contents:          buildInitialContents(messages),
		Tools:             buildGeminiTools(tools),
		GenerationConfig:  geminiGenConfig{Temperature: 0.3, MaxOutputTokens: 2048},
	}
	models := c.candidateModels()
	if len(models) == 0 {
		models = []string{c.model}
	}
	var lastErr error
	for _, model := range models {
		attempt := req
		attempt.Contents = append([]geminiChatContent(nil), req.Contents...)
		text, err := c.executeChatLoop(ctx, model, attempt, executor)
		if err == nil && strings.TrimSpace(text) != "" {
			return text, nil
		}
		if err == nil {
			err = errors.New("balasan kosong dari model " + model)
		}
		lastErr = err
		if ctx.Err() != nil {
			return "", ctx.Err()
		}
		var httpErr *geminiHTTPError
		if errors.As(err, &httpErr) && httpErr.status == http.StatusTooManyRequests {
			c.markExhausted(model)
		}
	}
	return "", lastErr
}

func (c *AssistantClient) executeChatLoop(ctx context.Context, model string, req geminiChatReq, executor ChatToolExecutor) (string, error) {
	const maxIterations = 5
	for iter := 0; iter < maxIterations; iter++ {
		resp, err := c.postGeminiChat(ctx, model, req)
		if err != nil {
			return "", err
		}
		if len(resp.Candidates) == 0 || len(resp.Candidates[0].Content.Parts) == 0 {
			return "", errors.New("empty response from gemini assistant")
		}
		candidate := resp.Candidates[0].Content
		fnCall := extractFunctionCall(candidate.Parts)
		if fnCall == nil {
			return extractText(candidate.Parts), nil
		}
		req.Contents = append(req.Contents, geminiChatContent{
			Role:  "model",
			Parts: candidate.Parts,
		})
		toolRes, err := executor(ctx, ChatToolCall{Name: fnCall.Name, Args: fnCall.Args})
		if err != nil {
			toolRes = ChatToolResponse{Name: fnCall.Name, Content: fmt.Sprintf(`{"error":"%s"}`, err.Error())}
		}
		req.Contents = append(req.Contents, geminiChatContent{
			Role: "function",
			Parts: []geminiChatPart{
				{
					FunctionResponse: &geminiFunctionReturnPart{
						Name:     fnCall.Name,
						Response: map[string]interface{}{"result": toolRes.Content},
					},
				},
			},
		})
	}
	return "", errors.New("exceeded maximum tool execution iterations")
}

func extractFunctionCall(parts []geminiChatPart) *geminiFunctionCallPart {
	for _, p := range parts {
		if p.FunctionCall != nil {
			return p.FunctionCall
		}
	}
	return nil
}

func extractText(parts []geminiChatPart) string {
	var sb strings.Builder
	for _, p := range parts {
		if p.Text != "" {
			sb.WriteString(p.Text)
		}
	}
	return sb.String()
}

type geminiHTTPError struct {
	status int
	body   string
}

func (e *geminiHTTPError) Error() string {
	return fmt.Sprintf("gemini api error %d: %s", e.status, e.body)
}

func isRetryableGeminiError(err error) bool {
	var httpErr *geminiHTTPError
	if errors.As(err, &httpErr) {
		switch httpErr.status {
		case http.StatusInternalServerError, http.StatusBadGateway, http.StatusServiceUnavailable, http.StatusGatewayTimeout:
			return true
		}
		return false
	}
	return !errors.Is(err, context.Canceled) && !errors.Is(err, context.DeadlineExceeded)
}

func (c *AssistantClient) postGeminiChat(ctx context.Context, model string, req geminiChatReq) (*geminiChatResp, error) {
	backoffs := []time.Duration{700 * time.Millisecond, 1800 * time.Millisecond}
	var lastErr error
	for attempt := 0; attempt <= len(backoffs); attempt++ {
		resp, err := c.postGeminiChatOnce(ctx, model, req)
		if err == nil {
			return resp, nil
		}
		lastErr = err
		if !isRetryableGeminiError(err) || attempt == len(backoffs) {
			break
		}
		select {
		case <-ctx.Done():
			return nil, ctx.Err()
		case <-time.After(backoffs[attempt]):
		}
	}
	return nil, lastErr
}

func (c *AssistantClient) postGeminiChatOnce(ctx context.Context, model string, req geminiChatReq) (*geminiChatResp, error) {
	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s", model, c.apiKey)
	data, err := json.Marshal(req)
	if err != nil {
		return nil, err
	}
	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(data))
	if err != nil {
		return nil, err
	}
	httpReq.Header.Set("Content-Type", "application/json")
	resp, err := c.httpClient.Do(httpReq)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode >= 400 {
		return nil, &geminiHTTPError{status: resp.StatusCode, body: string(bodyBytes)}
	}
	var gResp geminiChatResp
	if err := json.Unmarshal(bodyBytes, &gResp); err != nil {
		return nil, err
	}
	return &gResp, nil
}
