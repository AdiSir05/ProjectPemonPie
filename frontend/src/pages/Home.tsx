import { useState, useEffect } from 'react';
import axios from 'axios'; 
import config from '../../config.json';
import { useNavigate } from 'react-router-dom';
import { FaHome, FaUser, FaUserFriends, FaComments, FaPlusSquare, FaSearch, FaSignOutAlt, FaHeart, FaComment } from 'react-icons/fa';
import '../index.css';

axios.defaults.withCredentials = true;

export default function Home() {

  const [username, setUsername] = useState('');
  const rootURL = config.serverRootURL;
  const navigate = useNavigate(); 

  // State variables for posts, comments, and likes
  const [posts, setPosts] = useState([{ post_id: 0, username: '', post_date: '', image_url: '', post_text: '', post_interests: ''}]);
  const [comments, setComments] = useState({});
  const [likes, setLikes] = useState({});

  const fetchLikesAndComments = async () => {
    try {
        for (const post of posts) {
            const commentResponse = await axios.post(`${rootURL}/${username}/get_comments`, {post_id: post.post_id});
            setComments((prevComments: { [key: number]: { username: string; comment: string }[] }) => {
                const updatedComments = { ...prevComments };
                updatedComments[post.post_id] = commentResponse.data.comments;
                return updatedComments;
            });
            const likeResponse = await axios.post(`${rootURL}/${username}/get_likes`, {post_id: post.post_id});
            setLikes((prevLikes: { [key: number]: boolean }) => {
                const updatedLikes = { ...prevLikes };
                updatedLikes[post.post_id] = likeResponse.data.liked;
                return updatedLikes;
            });
        }
    } catch (error) {
      console.error('Error fetching likes and comments:', error);
    }
  }

  // Fetch posts, comments, and likes data
  const fetchData = async () => {
    try {
      const postResponse = await axios.get(`${rootURL}/feed`);
      setPosts(postResponse.data.posts);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const getUserInfo = async () => {
    const response = await axios.get(`${rootURL}/get_user`);
    if (response.status === 200) {
        console.log("Username: " + response.data.username);
        setUsername(response.data.username);
    } else {
        alert('Failed to get username.');
    }
  }

  useEffect(() => {
    fetchLikesAndComments();
    }, [posts]);

  useEffect(() => {
    fetchData();
  }, [username]);

  useEffect(() => {
    getUserInfo();
  }, []);

  // Function to handle like button click
const handleLike = async (postId: number) => {
    try {
        const response = await axios.post(`${rootURL}/${username}/update_like`, {
            post_id: postId
        });
        if (response.status === 200) {
            // Flip the value of the original entry in the likes state
            setLikes((prevLikes: { [key: number]: boolean }) => {
                const updatedLikes = { ...prevLikes };
                updatedLikes[postId] = !updatedLikes[postId];
                return updatedLikes;
            });
        } else {
            console.error('Failed to like post');
        }
    } catch (error) {
        console.error('Error liking post:', error);
    }
};

  // Function to handle comment submission
const handleComment = async (postId: number, commentText: string) => {
    try {
      const response = await axios.post(`${rootURL}/${username}/comment`, {
        post_id: postId,
        text: commentText
      });
      if (response.status === 200) {
        // Fetch updated comments
        fetchLikesAndComments();
      } else {
        console.error('Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  // Function to handle logout
  const logout = async () => {
    try {
      const response = await axios.get(`${rootURL}/${username}/logout`);
      if (response.status === 200) {
        navigate('/');
      } else {
        alert('Failed to logout.');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

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
        <button className='flex items-center mb-4 w-full' onClick={() => navigate(`/${username}/search`)}>
          <FaSearch size={20} />
          <span className='ml-2'>Search</span>
        </button>
        <button className='flex items-center mb-4 w-full' onClick={() => navigate(`/${username}/create`)}>
          <FaPlusSquare size={20} />
          <span className='ml-2'>Create Post</span>
        </button>
        <button className='flex items-center mb-4 w-full' onClick={logout}>
          <FaSignOutAlt size={20} />
          <span className='ml-2'>Logout</span>
        </button>
      </div>
      {/* Display posts */}
      <div className='flex-grow bg-slate-50 p-5 overflow-auto'>
        {posts.map((post, index) => (
          <div key={index} className='my-4 p-4 bg-white rounded-lg shadow-sm' style={{ maxWidth: '640px', minHeight: '300px' }}>
            <h3 className='text-lg font-bold'>{post.username}</h3>
            <p className='text-sm text-gray-600'>{post.post_date.split('T')[0]}</p>
            {post.image_url && <img src={post.image_url} alt="Post" className='mt-2 max-h-60 w-full object-cover rounded' style={{ maxHeight: '100%', width: 'auto' }} />}
            <p>{post.post_text}</p>
            <p className='text-sm text-gray-600'>{post.post_interests}</p>
            <button onClick={() => handleLike(post.post_id)} className='flex items-center mb-2'>
                <FaHeart size={20} color={(likes as any)[post.post_id] ? 'red' : 'black'} />
            </button>
            {/* Comment section */}
            <div>
                <input
                    type='text'
                    placeholder='Add a comment...'
                    className='border rounded border-gray-400 p-1 mr-2'
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            const inputElement = e.target as HTMLInputElement;
                            handleComment(post.post_id, inputElement.value);
                            inputElement.value = '';
                        }
                    }}
                />
                <p className='text-m font-bold'>Comments</p>
            </div>
            {/* Display comments */}
            {(comments as any)[post.post_id] && (comments as any)[post.post_id].map((comment: any, index: number) => (
                <div key={index} className='ml-4'>
                    <p className='text-sm font-bold'>{comment.username}</p>
                    <p className='text-sm'>{comment.comment_text}</p>
                </div>
            ))}
            {/* <p>{(comments as any)[post.post_id][0].username}</p> */}
          </div>
        ))}
      </div>
    </div>
  );
}
``
