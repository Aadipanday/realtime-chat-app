import React, { useEffect, useRef } from "react";
import { useChat } from "../context/ChatContext";
import { Sidebar } from "../components/Sidebar/Sidebar";
import { ChatHeader } from "../components/ChatArea/ChatHeader";
import { MessageList } from "../components/ChatArea/MessageList";
import { MessageInput } from "../components/ChatArea/MessageInput";
import { NoChatSelected } from "../components/ChatArea/NoChatSelected";

export const ChatPage = () => {
  const { selectedChat, setSelectedChat } = useChat();
  const selectedChatRef = useRef(selectedChat);

  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  // Handle mobile hardware/gesture back button: closes active chat instead of exiting app
  useEffect(() => {
    const handlePopState = () => {
      if (selectedChatRef.current) {
        setSelectedChat(null);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [setSelectedChat]);

  // Push history state whenever a chat is opened so back gesture goes to chat list
  useEffect(() => {
    if (selectedChat?._id) {
      if (!window.history.state?.chatOpen) {
        window.history.pushState({ chatOpen: true }, "");
      }
    }
  }, [selectedChat?._id]);

  return (
    <div className="flex h-full h-[100dvh] w-full overflow-hidden bg-[var(--bg-secondary)] fixed inset-0">
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
