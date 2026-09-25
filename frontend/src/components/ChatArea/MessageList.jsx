import React, { useEffect, useRef, useState } from "react";
import { useChat } from "../../context/ChatContext";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import {
  Check,
  CheckCheck,
  Loader2,
  Trash2,
  Play,
  Pause,
  Smile,
  X,
  Download,
} from "lucide-react";

const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

// Sleek audio player for voice notes
const VoiceNotePlayer = ({ audioUrl, isSender }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(console.error);
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatAudioTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="flex items-center gap-2.5 py-1 min-w-[200px] sm:min-w-[240px]">
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />
      <button
        type="button"
        onClick={togglePlay}
        className={`p-2 rounded-full cursor-pointer transition-colors shrink-0 shadow-xs ${
          isSender
            ? "bg-[var(--accent-color)] text-[var(--accent-text)] hover:opacity-90"
            : "bg-[var(--bg-active)] text-[var(--text-primary)] hover:opacity-80"
        }`}
        title={isPlaying ? "Pause" : "Play voice note"}
      >
        {isPlaying ? <Pause size={15} /> : <Play size={15} className="ml-0.5" />}
      </button>

      <div className="flex-1 flex flex-col justify-center">
        <input
          type="range"
          min="0"
          max={duration || 100}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[var(--accent-color)]"
        />
        <div className="flex justify-between text-[10px] text-[var(--text-secondary)] mt-1 select-none">
          <span>{formatAudioTime(currentTime)}</span>
          <span>{formatAudioTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};

export const MessageList = () => {
  const {
    messages,
    loadingMessages,
    selectedChat,
    typingInChat,
    deleteMessage,
    reactToMessage,
  } = useChat();
  const { authUser } = useAuth();
  const { onlineUsers } = useSocket();
  const messagesEndRef = useRef(null);

  // Lightbox modal state for full-sized image inspection
  const [previewImage, setPreviewImage] = useState(null);
  const [activeReactionMessageId, setActiveReactionMessageId] = useState(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingInChat]);

  const formatMessageTime = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getDateLabel = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();
    if (isToday) return "Today";

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();
    if (isYesterday) return "Yesterday";

    return date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Helper to reliably extract the other user in a 1-to-1 conversation
  const getOtherUser = (chat) => {
    if (!chat || chat.isGroupChat) return null;
    return (
      chat.users?.find(
        (u) => (u._id || u).toString() !== authUser?._id?.toString()
      ) || null
    );
  };

  // WhatsApp checkmark logic
  const renderCheckmark = (message) => {
    const isGroup = selectedChat?.isGroupChat;
    const otherUser = !isGroup ? getOtherUser(selectedChat) : null;
    const otherUserId = (otherUser?._id || otherUser)?.toString();
    const readByList = message.readBy || [];

    if (isGroup) {
      const otherMembers =
        selectedChat?.users?.filter(
          (u) => (u._id || u).toString() !== authUser?._id?.toString()
        ) || [];
      const isAllRead =
        otherMembers.length > 0 &&
        otherMembers.every((member) => {
          const mid = (member._id || member).toString();
          return readByList.some((id) => (id?._id || id).toString() === mid);
        });
      if (isAllRead) {
        return (
          <CheckCheck
            size={14}
            className="text-[var(--tick-color)] shrink-0"
            title="Read by all"
          />
        );
      }
      return (
        <CheckCheck
          size={14}
          className="text-white/60 shrink-0"
          title="Delivered"
        />
      );
    }

    // 1-to-1 Chat:
    const isReadByRecipient =
      otherUserId &&
      readByList.some((id) => (id?._id || id).toString() === otherUserId);

    if (isReadByRecipient) {
      return (
        <CheckCheck
          size={14}
          className="text-[var(--tick-color)] shrink-0"
          title="Read"
        />
      );
    }

    const isRecipientOnline = otherUserId
      ? onlineUsers.some((id) => id.toString() === otherUserId)
      : false;
    if (isRecipientOnline) {
      return (
        <CheckCheck
          size={14}
          className="text-white/60 shrink-0"
          title="Delivered"
        />
      );
    }

    return (
      <Check size={14} className="text-white/60 shrink-0" title="Sent" />
    );
  };

  const isTyping = selectedChat?._id && typingInChat[selectedChat._id];

  if (loadingMessages) {
    return (
      <div className="flex-1 flex items-center justify-center whatsapp-chat-wallpaper text-[var(--text-secondary)]">
        <Loader2 className="animate-spin" size={28} />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3 whatsapp-chat-wallpaper">
      {/* Lightbox Modal for Full Image View */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4 animate-in fade-in"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-2 right-2 flex items-center gap-2 z-10">
              <a
                href={previewImage}
                target="_blank"
                rel="noreferrer"
                download
                className="p-2 rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors"
                title="Open original"
              >
                <Download size={18} />
              </a>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="p-2 rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors cursor-pointer"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>
            <img
              src={previewImage}
              alt="Full preview"
              className="max-h-[85vh] max-w-full rounded-xl object-contain shadow-2xl"
            />
          </div>
        </div>
      )}

      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center text-[var(--text-secondary)] select-none">
          <div className="bg-[var(--bg-header)]/80 backdrop-blur-xs px-4 py-2 rounded-lg border border-[var(--border-color)]/60 text-xs shadow-xs max-w-xs">
            🔒 Messages are encrypted in transit over secure connection.
          </div>
          <p className="text-xs mt-3 text-[var(--text-secondary)]">
            Say hi to start the conversation! 👋
          </p>
        </div>
      ) : (
        messages.map((message, index) => {
          const senderId = (message.sender?._id || message.sender)?.toString();
          const myId = authUser?._id?.toString();
          const isSender = senderId === myId;
          const isGroup = selectedChat?.isGroupChat;

          // Check if date divider should be shown
          const prevMessage = index > 0 ? messages[index - 1] : null;
          const showDateHeader =
            !prevMessage ||
            getDateLabel(message.createdAt) !== getDateLabel(prevMessage.createdAt);

          // Aggregate reactions by emoji
          const reactions = message.reactions || [];
          const groupedReactions = reactions.reduce((acc, r) => {
            acc[r.emoji] = (acc[r.emoji] || 0) + 1;
            return acc;
          }, {});

          const hasReactions = Object.keys(groupedReactions).length > 0;
          const userReactedEmojis = reactions
            .filter((r) => (r.user?._id || r.user)?.toString() === myId)
            .map((r) => r.emoji);

          return (
            <React.Fragment key={message._id}>
              {/* WhatsApp Date Divider Pill */}
              {showDateHeader && (
                <div className="flex justify-center my-2 select-none">
                  <span className="bg-[var(--bg-header)] text-[var(--text-secondary)] text-[11px] font-medium px-3 py-1 rounded-md shadow-xs border border-[var(--border-color)]/40 uppercase tracking-wider">
                    {getDateLabel(message.createdAt)}
                  </span>
                </div>
              )}

              {/* Message Row */}
              <div
                className={`flex flex-col group/msg relative ${
                  isSender ? "items-end" : "items-start"
                }`}
              >
                {/* Bubble Container */}
                <div
                  className={`flex items-end gap-1.5 max-w-[85%] sm:max-w-[70%] relative ${
                    isSender ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  {/* WhatsApp Message Bubble */}
                  <div
                    className={`relative px-3 py-1.5 text-[13px] shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] break-words ${
                      hasReactions ? "mb-3" : ""
                    } ${
                      isSender
                        ? "bg-[var(--bubble-sent)] text-[var(--bubble-sent-text)] rounded-lg rounded-tr-none"
                        : "bg-[var(--bubble-received)] text-[var(--bubble-received-text)] rounded-lg rounded-tl-none"
                    }`}
                  >
                    {/* Group chat sender username */}
                    {!isSender && isGroup && (
                      <p className="text-[11px] font-medium text-[var(--accent-color)] mb-1 select-none">
                        {message.sender?.username}
                      </p>
                    )}

                    {/* Media Type 1: Image */}
                    {message.mediaUrl && message.mediaType === "image" && (
                      <div className="mb-1 rounded-lg overflow-hidden">
                        <img
                          src={message.mediaUrl}
                          alt="Attachment"
                          onClick={() => setPreviewImage(message.mediaUrl)}
                          className="max-h-72 w-auto object-cover rounded-md cursor-pointer hover:opacity-95 transition-opacity"
                        />
                      </div>
                    )}

                    {/* Media Type 2: Audio Voice Note */}
                    {message.mediaUrl && message.mediaType === "audio" && (
                      <VoiceNotePlayer
                        audioUrl={message.mediaUrl}
                        isSender={isSender}
                      />
                    )}

                    {/* Text content / Caption */}
                    {message.content && (
                      <span className="leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </span>
                    )}

                    {/* Timestamp & Status Checkmark */}
                    <span className="inline-flex items-center gap-1 float-right mt-1 ml-2.5 text-[10px] text-[var(--text-secondary)] select-none">
                      <span>{formatMessageTime(message.createdAt)}</span>
                      {isSender && renderCheckmark(message)}
                    </span>

                    {/* Reaction Display Badges at bottom edge */}
                    {hasReactions && (
                      <div
                        className={`absolute -bottom-2.5 ${
                          isSender ? "right-2" : "left-2"
                        } flex items-center gap-1 z-10 select-none`}
                      >
                        {Object.entries(groupedReactions).map(
                          ([emoji, count]) => {
                            const isUserReacted = userReactedEmojis.includes(emoji);
                            return (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() =>
                                  reactToMessage(message._id, emoji)
                                }
                                className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[11px] shadow-sm border border-[var(--border-color)]/60 cursor-pointer transition-transform hover:scale-110 ${
                                  isUserReacted
                                    ? "bg-[var(--accent-color)]/25 border-[var(--accent-color)] text-[var(--accent-color)] font-semibold"
                                    : "bg-[var(--bg-header)] text-[var(--text-primary)]"
                                }`}
                                title={`${count} reaction${
                                  count > 1 ? "s" : ""
                                }`}
                              >
                                <span>{emoji}</span>
                                {count > 1 && (
                                  <span className="text-[10px]">{count}</span>
                                )}
                              </button>
                            );
                          }
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions Drawer (visible on hover) */}
                  <div className="opacity-0 group-hover/msg:opacity-100 flex items-center gap-1 transition-opacity shrink-0 select-none">
                    {/* Reaction trigger button & popup */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setActiveReactionMessageId(
                            activeReactionMessageId === message._id
                              ? null
                              : message._id
                          )
                        }
                        className="p-1 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-header)] transition-colors cursor-pointer"
                        title="React"
                      >
                        <Smile size={14} />
                      </button>

                      {/* Emoji reaction picker popup */}
                      {activeReactionMessageId === message._id && (
                        <div
                          className={`absolute bottom-full mb-1 ${
                            isSender ? "right-0" : "left-0"
                          } p-1.5 rounded-full bg-[var(--bg-header)] border border-[var(--border-color)] shadow-xl flex items-center gap-1 z-30 animate-in fade-in`}
                        >
                          {REACTION_EMOJIS.map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => {
                                reactToMessage(message._id, emoji);
                                setActiveReactionMessageId(null);
                              }}
                              className="p-1 text-base hover:scale-130 transition-transform cursor-pointer"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Delete button (sender only) */}
                    {isSender && (
                      <button
                        type="button"
                        onClick={() => deleteMessage(message._id)}
                        className="p-1 rounded-md text-[var(--text-secondary)] hover:text-red-400 hover:bg-[var(--bg-header)] transition-colors cursor-pointer"
                        title="Delete message"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })
      )}

      {/* Typing indicator bubble */}
      {isTyping && (
        <div className="flex items-center gap-1 px-3 py-2 rounded-lg rounded-tl-none bg-[var(--bubble-received)] w-16 text-[var(--accent-color)] shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-color)] animate-bounce [animation-delay:-0.3s]" />
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-color)] animate-bounce [animation-delay:-0.15s]" />
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-color)] animate-bounce" />
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};
