import { useState, useEffect } from 'react';
import axios from 'axios'; // Import Axios
import config from '../../config.json';
import { useParams, useNavigate } from 'react-router-dom';

axios.defaults.withCredentials = true;

export default function Chat() {
  const navigate = useNavigate();

  const rootURL = config.serverRootURL;
  const [username, setUsername] = useState('');
  const [messages, setMessages] = useState([{ username: '', message: '', message_date: '', message_time: ''}]);
  const [newMessage, setNewMessage] = useState('');
  const chatId = useParams().chat_id;
  const [invitedUsername, setInvitedUsername] = useState('');
  const [validChat, setValidChat] = useState(false);

  useEffect(() => {
    // Fetch chat messages every second
    getChatMessages();
    const interval = setInterval(() => {
      getChatMessages();
    }, 1000);

    return () => clearInterval(interval);
  }, [username]);

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    handleInviteUser();
  }, [invitedUsername]);

  useEffect(() => {
    console.log(messages);
  }, [messages]);

  const getCurrentUser = async () => {
    try {
      const response = await axios.get(`${rootURL}/get_user`);
      setUsername(response.data.username);
    } catch (error) {
      console.error('Error fetching current user: ', error);
    }
  };

const getChatMessages = async () => {
    try {
        console.log(validChat); 
        const response = await axios.post(`${rootURL}/${username}/chat_messages`, { chat_id: chatId } );
        if (response.status === 200) {
            setValidChat(true);
            setMessages(response.data.messages.map((msg: { username: string; message_text: string; }) => ({ username: msg.username, message: msg.message_text })));
        } else {
            setValidChat(false);
            setMessages([]);
        }
    } catch (error) {
        console.error('Error fetching chat messages: ', error);
    }
};

  const sendMessage = async () => {
    try {
      await axios.post(`${rootURL}/${username}/send_message`, {
        chat_id: chatId,
        message: newMessage,
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message: ', error);
    }
  };

const handleInviteUser = async () => {
    if (invitedUsername) {
        try {
            const response = await axios.post(`${rootURL}/${username}/invite_user`, {
                invited_username: invitedUsername,
                chat_id: chatId,
            });
            if (response.status === 200) {
                console.log('User invited.');
            } else {
                console.error('Error inviting user.');
            }
        } catch (error) {
            console.error('Error inviting user: ', error);
        }
    }
};

const handleLeaveChat = async () => {
    try {
        await axios.post(`${rootURL}/${username}/leave_chat`, { chat_id: chatId });
        navigate(`/${username}/chathome`);
    } catch (error) {
        console.error('Error leaving chat: ', error);
    }
}


if (validChat) {
  return (
    <div key={messages.length} className='w-screen h-screen flex flex-col items-center justify-center space-y-4'>
        <div className='flex justify-between w-full px-4 py-2 bg-gray-200'>
            <button onClick={() => navigate(`/${username}/chathome`)}>Back to Chat Home</button>
            <button onClick={handleLeaveChat}>Leave Chat</button>
        </div>
        <div className='flex flex-col items-center justify-center w-2/3 h-full'>
            <div className='overflow-auto w-full h-4/5'>
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`flex flex-col items-${msg.username === username ? 'end' : 'start'} my-2`}
                    >
                        <p style={{ fontSize: '1em' }}>{msg.username}</p>
                        <div style={{ fontSize: '1.5em', borderRadius: '20px', padding: '10px', backgroundColor: 'lightblue', width: 'fit-content' }}>
                            {msg.message}
                        </div>
                    </div>
                ))}
            </div>
            <form onSubmit={(e) => {
                e.preventDefault();
                const inputElement = (e.target as HTMLFormElement).elements[0] as HTMLInputElement;
                setInvitedUsername(inputElement.value);
            }}>
                <input type='text' placeholder='Enter username' />
                <button type='submit'>Invite</button>
            </form>
            <div>
                <input
                    type='text'
                    placeholder='Type your message...'
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                />
                <button onClick={sendMessage}>Send</button>
            </div>
        </div>
    </div>
);
} else {
  return(
    <div className='w-screen h-screen flex flex-col items-center justify-center space-y-4'>
        <div className='flex justify-between w-full px-4 py-2 bg-gray-200'>
            <button onClick={() => navigate(`/${username}/chathome`)}>Back to Chat Home</button>
        </div>
        <div className='w-2/3 h-full flex flex-col items-center justify-center'>
            <h1>Chat not found.</h1>
        </div>
    </div>
  );
}


}
