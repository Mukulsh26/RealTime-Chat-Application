import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import io from "socket.io-client";
import Chat from "./components/Chat";

const App = () => {
  const socket = useRef();
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("chat-user");
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [users, setUsers] = useState([]);
  const [email, setEmail] = useState("");

  useEffect(() => {
    socket.current = io("http://localhost:5000");

    socket.current.on("connect", () => {
      console.log("Socket connected");
    });

    if (user) {
      socket.current.emit("addUser", user._id);
    }

    axios.get("http://localhost:5000/api/users").then((res) => setUsers(res.data));

    return () => {
      socket.current?.disconnect();
    };
  }, [user]);

  const handleLogin = () => {
    if (!email.trim()) return;

    axios
      .post("http://localhost:5000/api/users/login", { email })
      .then((res) => {
        setUser(res.data);
        localStorage.setItem("chat-user", JSON.stringify(res.data)); // Use localStorage here
        socket.current.emit("addUser", res.data._id);
      })
      .catch((err) => console.log(err));
  };

  const handleLogout = () => {
    localStorage.removeItem("chat-user"); // Clear the session from localStorage
    window.location.reload(); // Refresh the page
  };

  return (
    <div className="bg-gray-900 text-white h-screen flex flex-col">
      {!user ? (
        <div className="bg-gray-800 p-6 rounded-md shadow-lg w-96 mx-auto mt-12">
          <h2 className="text-2xl text-center mb-4">Enter Chat</h2>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 mb-4 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleLogin}
            className="w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-500"
          >
            Enter Chat
          </button>
        </div>
      ) : (
        <div className="flex-grow">
          <Chat user={user} users={users} socket={socket} handleLogout={handleLogout} />
        </div>
      )}
    </div>
  );
};

export default App;
