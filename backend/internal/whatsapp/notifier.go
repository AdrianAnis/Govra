package whatsapp

import (
	"context"
	"log"
	"time"

	"govra/internal/platform/phone"
)

const deliveryTimeout = 30 * time.Second

type Notifier struct {
	sender  Sender
	finder  RecipientFinder
	webURL  string
	enabled func() bool
}

func NewNotifier(client *Client, finder RecipientFinder, webURL string) *Notifier {
	return &Notifier{
		sender:  client,
		finder:  finder,
		webURL:  webURL,
		enabled: client.Enabled,
	}
}

func (n *Notifier) active() bool {
	return n != nil && n.sender != nil && n.finder != nil && n.enabled != nil && n.enabled()
}

func (n *Notifier) NotifyIssueStatus(_ context.Context, issueID, status, note string) {
	if !n.active() {
		return
	}
	go n.deliverIssueStatus(issueID, status, note)
}

func (n *Notifier) NotifyReportReceived(_ context.Context, reporterID, code, title string) {
	if !n.active() {
		return
	}
	go n.deliverReportReceived(reporterID, code, title)
}

func (n *Notifier) deliverIssueStatus(issueID, status, note string) {
	ctx, cancel := context.WithTimeout(context.Background(), deliveryTimeout)
	defer cancel()
	defer recoverDelivery()

	recipients, err := n.finder.ByIssue(ctx, issueID)
	if err != nil {
		log.Printf("whatsapp: gagal mencari penerima notifikasi: %v", err)
		return
	}
	for _, rec := range recipients {
		message := ProgressMessage(n.webURL, rec.Code, rec.Title, status, note)
		if err := n.sender.Send(ctx, rec.Phone, message); err != nil {
			log.Printf("whatsapp: gagal mengirim ke %s (%s): %v", phone.Mask(rec.Phone), rec.Code, err)
		}
	}
}

func (n *Notifier) deliverReportReceived(reporterID, code, title string) {
	ctx, cancel := context.WithTimeout(context.Background(), deliveryTimeout)
	defer cancel()
	defer recoverDelivery()

	target, err := n.finder.PhoneByUser(ctx, reporterID)
	if err != nil {
		log.Printf("whatsapp: gagal mengambil nomor pelapor: %v", err)
		return
	}
	if target == "" {
		return
	}
	if err := n.sender.Send(ctx, target, ReceivedMessage(n.webURL, code, title)); err != nil {
		log.Printf("whatsapp: gagal mengirim konfirmasi ke %s (%s): %v", phone.Mask(target), code, err)
	}
}

func recoverDelivery() {
	if r := recover(); r != nil {
		log.Printf("whatsapp: pengiriman notifikasi terhenti: %v", r)
	}
}
