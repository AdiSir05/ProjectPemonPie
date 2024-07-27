import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Signup from "./pages/Signup";
import Friends from "./pages/Friends";
import Password from "./pages/Password";
import Chat from "./pages/Chat";
import ChatHome from "./pages/ChatHome";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import CreatePost from "./pages/CreatePost";
import Search from "./pages/Search";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path='/signup' element={<Signup />} />
        <Route path="/:username/password" element={<Password />} />
        <Route path='/:username/home' element={<Home />} />
        <Route path='/:username/friends' element={<Friends />} />
        <Route path="/:username/chathome" element={<ChatHome  />} />
        <Route path="/:chat_id/chat" element={<Chat />} />
        <Route path="/:username/profile" element={<Profile />} />
        <Route path="/edit" element={<EditProfile />} />
        <Route path="/:username/create" element={<CreatePost />} />
        <Route path="/:username/search" element={<Search />} />
      </Routes>
    </BrowserRouter>
  )
}


export default App
