import { useState, useEffect } from 'react';
import axios from 'axios'; 
import config from '../../config.json';
import { useNavigate } from 'react-router-dom';
import { FaHome, FaUser, FaUserFriends, FaComments, FaPlusSquare, FaSearch, FaSignOutAlt, FaHeart, FaComment } from 'react-icons/fa';
import '../index.css';

axios.defaults.withCredentials = true;

export default function Search() {

  const [username, setUsername] = useState('');
  const rootURL = config.serverRootURL;
  const navigate = useNavigate(); 

  return (
    <div className='flex w-screen h-screen'>
      <div className='min-w-max h-full bg-white border-r border-black flex flex-col items-center pl-4 pt-4 pr-4'>
        <div className='font-bold text-xl italic mb-6'>
          Lemonstagram   
        </div>
        {/* Navigation buttons */}
        <button className='flex items-center mb-4 w-full' onClick={() => navigate(`/${username}/home`)}>
          <FaHome size={20} />
          <span className='ml-2'>Home</span>
        </button>
        <button className='flex items-center mb-4 w-full' onClick={() => navigate(`/${username}/profile`)}>
          <FaUserFriends size={20} />
          <span className='ml-2'>Profile</span>
        </button>
        <button className='flex items-center mb-4 w-full' onClick={() => navigate(`/${username}/chathome`)}>
          <FaComments size={20} />
          <span className='ml-2'>Chat</span>
        </button>
        <button className='flex items-center mb-4 w-full' onClick={() => navigate(`/${username}/friends`)}>
          <FaUserFriends size={20} />
          <span className='ml-2'>Friends</span>
        </button>
        <button className='flex items-center mb-4 w-full' onClick={() => navigate(`/${username}/create`)}>
          <FaPlusSquare size={20} />
          <span className='ml-2'>Create Post</span>
        </button>
      </div>
      <div>
        <form className='flex items-center justify-between w-600'>
            <input type='text' className='w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500' placeholder='Search...' />
            <button type='submit' className='px-4 py-2 ml-4 text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500'>Enter</button>
        </form>
      </div>

      
    </div>
  );
}
``
