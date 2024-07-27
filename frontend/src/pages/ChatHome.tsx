import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import config from '../../config.json';
import { useLocation } from 'react-router-dom';
import { FaHome, FaUser, FaUserFriends, FaComments, FaPlusSquare, FaSearch, FaSignOutAlt } from 'react-icons/fa';


axios.defaults.withCredentials = true;

export default function ChatHome() {
    const navigate = useNavigate();

    const [chats, setChats] = useState([{chat_id: -1, chat_name: '', is_member: false}]);
    const [username, setUsername] = useState('');
    const [chatName, setChatName] = useState('');

    const rootURL = config.serverRootURL;

    const getUserInfo = async () => {
        const response = await axios.get(`${rootURL}/get_user`);
        if (response.status === 200) {
            console.log("Username: " + response.data.username);
            setUsername(response.data.username);
        } else {
            alert('Failed to get username.');
        }
    }

    const handleCreateChat = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            const response = await axios.post(`${rootURL}/${username}/create_chat`, {
                chat_name: chatName,
            });
            if (response.status === 200) {
                setChatName('');
                const response = await axios.post(`${rootURL}/${username}/get_chats`);
                if (response.status === 200) {
                    setChats(response.data.chats);
                } else {
                    alert('Failed to get chats.');
                }
            } else {
                alert('Failed to create chat.');
            }
        } catch (error) {
            console.error('Error fetching data: ', error);
            return;
        }
    }

    const handleAcceptInvite = async (chatId: number) => {
        try {
            const response = await axios.post(`${rootURL}/${username}/accept_invite`, {
                chat_id: chatId,
            });
            if (response.status === 200) {
                const response = await axios.post(`${rootURL}/${username}/get_chats`);
                if (response.status === 200) {
                    setChats(response.data.chats);
                } else {
                    alert('Failed to get chats.');
                }
            } else {
                alert('Failed to accept invite.');
            }
        } catch (error) {
            console.error('Error fetching data: ', error);
            return;
        }
    }

    const handleDeclineInvite = async (chatId: number) => {
        try {
            const response = await axios.post(`${rootURL}/${username}/decline_invite`, {
                chat_id: chatId,
            });
            if (response.status === 200) {
                const response = await axios.post(`${rootURL}/${username}/get_chats`);
                if (response.status === 200) {
                    setChats(response.data.chats);
                } else {
                    alert('Failed to get chats.');
                }
            } else {
                alert('Failed to decline invite.');
            }
        } catch (error) {
            console.error('Error fetching data: ', error);
            return;
        }
    }

    useEffect(() => {
        if (username) {
            const getChats = async () => {
                try {
                    const response = await axios.post(`${rootURL}/${username}/get_chats`);
                    if (response.status === 200) {
                        setChats(response.data.chats);
                    } else {
                        alert('Failed to get chats.');
                    }
                } catch (error) {
                    console.error('Error fetching data: ', error);
                    return;
                }
            };
            getChats();
        }
    }, [username]);


    useEffect(() => {
        getUserInfo();
    }, []);

    return (
        <div style={{ display: 'flex' }}>
            <div className='h-screen flex'>
                <div className='min-w-max h-full bg-white border-r border-black flex flex-col items-center pl-4 pt-4 pr-4'>
                    <div className='font-bold text-xl italic mb-6'>
                        Lemonstagram   
                    </div>
                    <button className='flex items-center mb-4 w-full' onClick={() => navigate(`/${username}/home`)}>
                        <FaHome size={20} />
                        <span className='ml-2'>Home</span>
                    </button>
                    <button className='flex items-center mb-4 w-full' onClick={() => navigate(`/${username}/friends`)}>
                        <FaUserFriends size={20} />
                        <span className='ml-2'>Friends</span>
                    </button>
                    <button className='flex items-center mb-4 w-full' onClick={() => navigate(`/${username}/search`)}>
                        <FaSearch size={20} />
                        <span className='ml-2'>Search</span>
                    </button>
                    <button className='flex items-center mb-4 w-full' onClick={() => navigate(`/${username}/create`)}>
                        <FaPlusSquare size={20} />
                        <span className='ml-2'>Create Post</span>
                    </button>
                    <button className='flex items-center mb-4 w-full' onClick={() => navigate(`/${username}/profile`)}>
                        <FaUser size={20} />
                        <span className='ml-2'>Profile</span>
                    </button>
                </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <h2 className='text-2xl font-semibold mb-4 py-6'>Chat Home</h2>
                <form
                    style={{
                        width: '600px',
                        height: '75px',
                        border: '1px solid grey',
                        margin: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                    onSubmit={handleCreateChat}
                >
                    <input
                        type="text"
                        placeholder="enter chat name"
                        value={chatName}
                        onChange={(e) => setChatName(e.target.value)}
                        style={{ marginRight: '10px' }}
                    />
                    <button type="submit">Create Chat</button>
                </form>
                <h2 className='self-start ml-10 text-xl font-semibold mb-2 py-4'>Active Chats</h2>
                <div style={{ marginTop: '20px' }}>
                    {chats.map((chat) => ( chat.is_member ? (
                        <div
                            key={chat.chat_id}
                            style={{
                                width: '600px',
                                height: '50px',
                                border: '1px grey solid',
                                margin: '0px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                            }}
                            onClick={() => navigate(`/${chat.chat_id}/chat`)}
                        >
                            {chat.chat_name}
                        </div> ) : (
                        <div
                        key={chat.chat_id}
                        className='flex justify-center items-center justify-between w-full'
                        style={{
                            width: '500px',
                            height: '50px',
                            border: '1px solid black',
                            margin: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingLeft: '100px',
                            paddingRight: '100px',
                        }}
                    >
                        {chat.chat_name}
                        <button className='mr-2 bg-green-500 text-white px-3 py-1 rounded' onClick={() => handleAcceptInvite(chat.chat_id)}>Confirm</button>
                        <button className='bg-red-500 text-white px-3 py-1 rounded' onClick={() => handleDeclineInvite(chat.chat_id)}>Delete</button>
                    </div>
                    )
                    ))}
                </div>
            </div>
        </div>
    );
}