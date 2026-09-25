import React, { useState, useRef, useEffect } from "react";
import { useChat } from "../../context/ChatContext";
import { useSocket } from "../../context/SocketContext";
import { Send, Smile, Paperclip, Mic, Trash2, X, Image as ImageIcon, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const COMMON_EMOJIS = ["😀", "😂", "🔥", "👍", "❤️", "🎉", "🙌", "✨", "💯", "🚀", "🙏", "😎", "🥳", "👏"];

export const MessageInput = () => {
  const [content, setContent] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Image attachment states
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Audio voice note recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const { selectedChat, sendMessage } = useChat();
  const { socket } = useSocket();

  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  // Focus input and reset temporary inputs when chat changes
  useEffect(() => {
    inputRef.current?.focus();
    setContent("");
    setShowEmoji(false);
    setSelectedImage(null);
    setImagePreview(null);
    cancelRecording();
  }, [selectedChat?._id]);

  // Clean up recording stream on unmount
  useEffect(() => {
    return () => {
      cancelRecording();
    };
  }, []);

  const handleTyping = (e) => {
    setContent(e.target.value);

    if (!socket || !selectedChat?._id) return;

    socket.emit("typing", selectedChat._id);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stopTyping", selectedChat._id);
    }, 1500);
  };

  // Image selection handler
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be smaller than 10MB");
      return;
    }

    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
    // Reset file input value so same file can be re-selected if removed
    e.target.value = "";
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
  };

  // Start voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone access error:", err);
      toast.error("Unable to access microphone. Please grant permission.");
    }
  };

  // Cancel and discard recording
  const cancelRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    audioChunksRef.current = [];
    setIsRecording(false);
    setRecordingDuration(0);
  };

  // Stop recording and send audio message
  const stopAndSendRecording = () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") return;

    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    const duration = recordingDuration;

    mediaRecorderRef.current.onstop = async () => {
      if (audioChunksRef.current.length === 0 || duration < 1) {
        toast.error("Recording was too short");
        cancelRecording();
        return;
      }

      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      const audioFile = new File([audioBlob], `voice_${Date.now()}.webm`, {
        type: "audio/webm",
      });

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
      setIsRecording(false);
      setRecordingDuration(0);

      setIsSending(true);
      const toastId = toast.loading("Sending voice note...");
      const success = await sendMessage("", audioFile);
      toast.dismiss(toastId);
      setIsSending(false);

      if (success) {
        toast.success("Voice note sent!");
      }
    };

    mediaRecorderRef.current.stop();
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if ((!content.trim() && !selectedImage) || isSending) return;

    if (socket && selectedChat?._id) {
      socket.emit("stopTyping", selectedChat._id);
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    setIsSending(true);
    const success = await sendMessage(content, selectedImage);
    setIsSending(false);

    if (success) {
      setContent("");
      removeSelectedImage();
      setShowEmoji(false);
      inputRef.current?.focus();
    }
  };

  const addEmoji = (emoji) => {
    setContent((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  return (
    <div className="relative px-4 py-2.5 bg-[var(--bg-header)] border-t border-[var(--border-color)]">
      {/* Hidden file input for image uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={handleImageSelect}
        className="hidden"
      />

      {/* Quick emoji drawer */}
      {showEmoji && (
        <div className="absolute bottom-full mb-3 left-4 p-2.5 rounded-2xl bg-[var(--bg-header)] border border-[var(--border-color)] shadow-2xl flex items-center gap-2 z-20 animate-in fade-in select-none">
          {COMMON_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => addEmoji(emoji)}
              className="p-1 text-lg hover:scale-125 transition-transform cursor-pointer"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Image attachment preview banner */}
      {imagePreview && (
        <div className="mb-2 p-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-3">
            <img
              src={imagePreview}
              alt="Attachment preview"
              className="w-12 h-12 object-cover rounded-lg border border-[var(--border-color)]"
            />
            <div>
              <p className="text-xs font-medium text-[var(--text-primary)] truncate max-w-[200px] sm:max-w-xs">
                {selectedImage?.name || "Selected image"}
              </p>
              <p className="text-[11px] text-[var(--text-secondary)]">
                {selectedImage ? `${(selectedImage.size / 1024).toFixed(1)} KB` : ""}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={removeSelectedImage}
            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-red-400 hover:bg-[var(--bg-active)] transition-colors cursor-pointer"
            title="Remove image"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Voice note active recording UI */}
      {isRecording ? (
        <div className="flex items-center justify-between py-1 px-2 animate-in fade-in">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-mono font-medium text-[var(--text-primary)]">
              {formatTimer(recordingDuration)}
            </span>
            <span className="text-xs text-[var(--text-secondary)] italic">
              Recording voice note...
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={cancelRecording}
              className="p-2 rounded-full text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
              title="Discard recording"
            >
              <Trash2 size={20} />
            </button>

            <button
              type="button"
              onClick={stopAndSendRecording}
              className="p-2.5 rounded-full bg-[var(--accent-color)] text-[var(--accent-text)] hover:opacity-90 transition-all cursor-pointer shadow-xs flex items-center justify-center"
              title="Send voice note"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      ) : (
        /* Regular input row */
        <form onSubmit={handleSend} className="flex items-center gap-2">
          {/* Emoji Button */}
          <button
            type="button"
            onClick={() => setShowEmoji((prev) => !prev)}
            className={`p-2 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-active)] transition-colors cursor-pointer ${
              showEmoji ? "text-[var(--accent-color)]" : ""
            }`}
            title="Emojis"
          >
            <Smile size={21} />
          </button>

          {/* Attachment Clip Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`p-2 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-active)] transition-colors cursor-pointer ${
              selectedImage ? "text-[var(--accent-color)]" : ""
            }`}
            title="Attach image"
          >
            <Paperclip size={21} />
          </button>

          {/* Input Bar */}
          <input
            ref={inputRef}
            type="text"
            placeholder={selectedImage ? "Add a caption..." : "Type a message"}
            value={content}
            onChange={handleTyping}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            className="flex-1 rounded-lg bg-[var(--bg-input)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none border border-transparent focus:border-[var(--border-color)] transition-colors"
          />

          {/* Send / Mic Button */}
          {content.trim() || selectedImage ? (
            <button
              type="submit"
              disabled={isSending}
              className="p-2.5 rounded-full bg-[var(--accent-color)] text-[var(--accent-text)] hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer shadow-xs shrink-0 flex items-center justify-center"
              title="Send"
            >
              {isSending ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <Send size={17} />
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={startRecording}
              className="p-2 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-active)] transition-colors cursor-pointer"
              title="Record voice note"
            >
              <Mic size={21} />
            </button>
          )}
        </form>
      )}
    </div>
  );
};
