import React from "react";
import { useChat } from "../context/ChatContext";
import { Sidebar } from "../components/Sidebar/Sidebar";
import { ChatHeader } from "../components/ChatArea/ChatHeader";
import { MessageList } from "../components/ChatArea/MessageList";
import { MessageInput } from "../components/ChatArea/MessageInput";
import { NoChatSelected } from "../components/ChatArea/NoChatSelected";

export const ChatPage = () => {
  const { selectedChat } = useChat();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--bg-secondary)]">
      {/* Sidebar: Visible on desktop, or on mobile when no chat is open */}
      <div
        className={`w-full md:w-auto h-full ${
          selectedChat ? "hidden md:flex" : "flex"
        }`}
      >
        <Sidebar />
      </div>

      {/* Main Chat Area: Visible on desktop, or on mobile when chat is open */}
      <main
        className={`flex-1 flex flex-col h-full overflow-hidden ${
          !selectedChat ? "hidden md:flex" : "flex"
        }`}
      >
        {selectedChat ? (
          <>
            <ChatHeader />
            <MessageList />
            <MessageInput />
          </>
        ) : (
          <NoChatSelected />
        )}
      </main>
    </div>
  );
};
