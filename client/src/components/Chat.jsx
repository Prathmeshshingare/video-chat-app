import React, { useState, useEffect, useRef } from "react";
import "./Chat.css";
import { IoSend } from "react-icons/io5";

const Chat = ({ socket, role, messages, setMessages }) => {
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef(null);

  // ✅ Auto Scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!message.trim() || !socket) return;

    const chatData = {
      type: "chat",
      message: message,
      sender: role,
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      status: "sent",
    };

    socket.send(JSON.stringify(chatData));

    setMessages((prev) => [...prev, chatData]);

    setMessage("");
  };

  return (
    <div className="chat-container">
      <div className="messages-area">
        {messages.map((msg) => {
          const isMine = msg.sender === role;

          return (
            <div
              key={msg.id}
              className={`message ${isMine ? "sent" : "received"}`}
            >
              {/* ✅ Sender Name */}
              {!isMine && (
                <div className="sender-name">{msg.sender}</div>
              )}

              {/* ✅ Message Text */}
              <div>{msg.message}</div>

              {/* ✅ Timestamp + Read */}
              <div className="meta">
                <span className="time">{msg.timestamp}</span>
                {isMine && (
                  <span className="status">
                    {msg.status === "read" ? "✓✓" : "✓"}
                  </span>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="send-m-area">
        <input
          type="text"
          placeholder="Type message here..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <IoSend className="send-icon" onClick={sendMessage} />
      </div>
    </div>
  );
};

export default Chat;