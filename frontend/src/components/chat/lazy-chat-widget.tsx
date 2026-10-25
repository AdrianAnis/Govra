"use client";

import dynamic from "next/dynamic";

const ChatWidget = dynamic(() => import("@/components/chat/chat-widget").then((module) => module.ChatWidget), {
  ssr: false,
});

function LazyChatWidget({ signedIn }: { signedIn: boolean }) {
  return <ChatWidget signedIn={signedIn} />;
}

export { LazyChatWidget };
