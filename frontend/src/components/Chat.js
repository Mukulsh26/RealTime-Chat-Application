import React, { useEffect, useRef, useState } from "react";
import axios from "axios";

const Chat = ({ user, users, socket, handleLogout }) => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [onlineUsers, setOnlineUsers] = useState({});
  const scrollRef = useRef();
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!socket.current) return;

    socket.current.on("getMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.current.on("typing", ({ from }) => {
      if (from === selectedUser?._id) {
        setTypingUsers((prev) => new Set(prev).add(from));
      }
    });

    socket.current.on("stopTyping", ({ from }) => {
      if (from === selectedUser?._id) {
        setTypingUsers((prev) => {
          const copy = new Set(prev);
          copy.delete(from);
          return copy;
        });
      }
    });

    socket.current.on("updateUsers", (users) => {
      setOnlineUsers(users);
    });

    return () => {
      socket.current.off("getMessage");
      socket.current.off("typing");
      socket.current.off("stopTyping");
      socket.current.off("updateUsers");
    };
  }, [selectedUser, socket]);

  useEffect(() => {
    if (selectedUser) {
      axios
        .get(`${process.env.REACT_APP_BACKEND_URL}api/users/messages/${user._id}/${selectedUser._id}`)
        .then((res) => setMessages(res.data));
    }
    setTypingUsers(new Set());
  }, [selectedUser, user]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const emitTyping = () => {
    if (!selectedUser) return;
    socket.current.emit("typing", { to: selectedUser._id });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.current.emit("stopTyping", { to: selectedUser._id });
    }, 1000);
  };

  const handleTyping = (e) => {
    setNewMsg(e.target.value);
    emitTyping();
  };

  const sendMessage = async () => {
    if (!newMsg.trim() || !selectedUser) return;

    const msg = {
      senderId: user._id,
      receiverId: selectedUser._id,
      text: newMsg,
    };

    await axios.post(`${process.env.REACT_APP_BACKEND_URL}api/users/messages`, msg);
    socket.current.emit("sendMessage", msg);

    setMessages((prev) => [...prev, { ...msg, createdAt: new Date() }]);
    setNewMsg("");


    socket.current.emit("stopTyping", { to: selectedUser._id });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  };

  return (
    <div className="bg-gray-900 text-white h-screen flex flex-col">

      <div className="flex justify-between items-center p-4 bg-gray-800 border-b border-gray-700">
        <h2 className="text-xl">You are: {user.username}</h2>
        <button
          onClick={handleLogout}
          className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-500"
        >
          Logout
        </button>
      </div>

      <div className="flex flex-grow">

        <ul className="w-1/3 bg-gray-800 border-r border-gray-700 overflow-y-auto p-4">
          <h3 className="text-xl mb-4">Users</h3>
          {users
            .filter((u) => u._id !== user._id)
            .map((u) => (
              <li
                key={u._id}
                onClick={() => setSelectedUser(u)}
                className={`cursor-pointer p-3 mb-2 rounded-md hover:bg-gray-700 ${
                  selectedUser?._id === u._id ? "bg-gray-700" : ""
                }`}
              >
                <div className="flex justify-between">
                  <strong>{u.username}</strong>
                  <span
                    className={`text-sm ${
                      onlineUsers[u._id] ? "text-green-400" : "text-gray-500"
                    }`}
                  >
                    ({onlineUsers[u._id] ? "Online" : "Offline"})
                  </span>
                </div>
              </li>
            ))}
        </ul>

        <div className="w-2/3 p-6 flex flex-col">
          {selectedUser ? (
            <>
              <h3 className="text-2xl mb-4">Chat with {selectedUser.username}</h3>
              <div className="h-80 overflow-y-auto border border-gray-700 bg-gray-800 p-4 rounded-md mb-4 flex-grow">
                {messages.map((m, i) => (
                  <div
                    key={i}
                    ref={i === messages.length - 1 ? scrollRef : null}
                    className={`mb-2 text-sm ${m.senderId === user._id ? "text-right" : "text-left"}`}
                  >
                    <strong>{m.senderId === user._id ? "Me" : selectedUser.username}:</strong>
                    <p>{m.text}</p>
                  </div>
                ))}
                {typingUsers.has(selectedUser._id) && (
                  <div className="text-gray-400 text-xs italic">User is typing...</div>
                )}
              </div>

          
             {/* Message Input with Send Button */}
<div className="flex mt-2">
  <input
    type="text"
    value={newMsg}
    onChange={handleTyping}
    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
    placeholder="Type a message..."
    className="flex-grow p-3 bg-gray-700 text-white rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
  />
  <button
    onClick={sendMessage}
    className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-r-md"
  >
    Send
  </button>
</div>

            </>
          ) : (
            <div className="text-center text-lg text-gray-500 mt-10">Select a user to start chat</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;
