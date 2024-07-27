import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import config from '../../config.json';
import { useLocation } from 'react-router-dom';
import { FaHome, FaUser, FaUserFriends, FaComments, FaPlusSquare, FaSearch, FaSignOutAlt } from 'react-icons/fa';

axios.defaults.withCredentials = true;

export default function Profile() {
    const navigate = useNavigate();

    const [userProfile, setUserProfile] = useState({
        user_id: '',
        hashed_password: '',
        username: '',
        first_name: '',
        last_name: '',
        affiliation: '',
        email: '',
        birth_date: '',
        interests: '',
        bio: '',
        image_url: ''
    });
    const [username, setUsername] = useState('');
    const [cur_username, setCurUsername] = useState('');
    const [requested, setRequested] = useState(false);
    const [following, setFollowing] = useState(false);
    const [followedBy, setFollowedBy] = useState(false);
    const [actor, setActor] = useState('');
    const [actor_recs, setActorRecs] = useState([{ id: 0, name: 'Tom Cruise', image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Tom_Cruise_by_Gage_Skidmore_2.jpg/330px-Tom_Cruise_by_Gage_Skidmore_2.jpg'}]);

    const location = useLocation();

    const rootURL = config.serverRootURL;

    const getUserProfile = async () => {
        try {
            console.log('Getting user profile');
            const response = await axios.get(`${rootURL}/${cur_username}/profile`);
            if (response.status === 200) {
                setUserProfile(response.data.user);
            } else {
                alert('Failed to get user profile.');
            }
        } catch (error) {
            console.error('Error fetching data: ', error);
            return;
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

    const getLinkedActor = async () => {
        try {
            const response = await axios.post(`${rootURL}/${username}/get_linked_actor`);
            if (response.status === 200) {
                setActor(response.data.actor);
            } else {
                alert('Failed to get linked actor.');
            }
        } catch (error) {
            console.error('Error fetching data: ', error);
            return;
        }
    }

    const getActorRecommendations = async () => {
        try {
            const response = await axios.post(`${rootURL}/${username}/actor_recommendations`);
            if (response.status === 200) {
                setActorRecs(response.data);
            } else {
                alert('Failed to get actor recommendations.');
            }
        } catch (error) {
            console.error('Error fetching data: ', error);
            return;
        }
    }

    const handleLinkActor = async (actor_id: number) => {
        try {
            const response = await axios.post(`${rootURL}/${username}/link_actor`, {
                actor_id: actor_id
            });
            if (response.status === 200) {
                alert('Actor linked successfully.');
                getLinkedActor();
            } else {
                alert('Failed to link actor.');
            }
        } catch (error) {
            console.error('Error fetching data: ', error);
            return;
        }
    }

    const checkFollowRequests = async() => {
        try {
            const response1 = await axios.post(`${rootURL}/get_follow_requests`, { 
                cur_username: cur_username,
                friend_name: username
            });
            const response2 = await axios.post(`${rootURL}/get_follow_requests`, {
                cur_username: username,
                friend_name: cur_username
            });
            if (response1.status === 200) {
                setFollowedBy(response1.data.following);
            } else {
                alert('Failed to get follow requests.');
            }
            if (response2.status === 200) {
                setRequested(response2.data.requested);
                setFollowing(response2.data.following);
            } else {
                alert('Failed to get follow requests.');
            }
        } catch (error) {
            console.error('Error fetching data: ', error);
            return;
        }
    }

    const sendFollowRequest = async () => {
        try {
            const response = await axios.post(`${rootURL}/${username}/send_follow_request`, {
                friend_name: cur_username
            });
            if (response.status === 200) {
                setRequested(true);
            } else {
                alert('Failed to send follow request.');
            }
        } catch (error) {
            console.error('Error fetching data: ', error);
            return;
        }
    }

    const unFollow = async () => {
        try {
            const response = await axios.post(`${rootURL}/${username}/unfollow`, {
                friend_name: cur_username
            });
            if (response.status === 200) {
                setRequested(false);
                setFollowing(false);
            } else {
                alert('Failed to unfollow.');
            }
        } catch (error) {
            console.error('Error fetching data: ', error);
            return;
        }
    }

    useEffect(() => {
        if (cur_username) {
            console.log("Cur_username: "+cur_username);
            getUserProfile();
            if (username) {
                checkFollowRequests();
                getLinkedActor();
                getActorRecommendations();
            }
        }
    }, [cur_username]);

    useEffect(() => {
        if (cur_username && username) {
            checkFollowRequests();
            getLinkedActor();
            getActorRecommendations();
        }}, [username]);


    useEffect(() => {
        console.log('USE EFFECT CALLED');
        getUserInfo();
        setCurUsername(location.pathname.split('/')[1]);
    }, []);

    return (
        <div className='flex w-screen h-screen'>
            <div className='min-w-max h-full bg-white border-r border-black flex flex-col items-center pl-4 pt-4 pr-4'>
                <div className='font-bold text-xl italic mb-6'>
                    Lemonstagram   
                </div>
                <button className='flex items-center mb-4 w-full' onClick={() => navigate(`/${username}/home`)}>
                    <FaHome size={20} />
                    <span className='ml-2'>Home</span>
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
            </div>
            <div className='flex-grow bg-slate-50 p-5'>
                <div className='flex flex-row justify-between'>
                    <div className='w-1/3 flex justify-center'>
                        {userProfile.image_url && <img className='rounded-full w-32 h-32' src={userProfile.image_url} alt='Profile' />}
                    </div>
                    <div className='w-2/3'>
                        <div className='flex justify-between items-center'>
                            <h1 className='text-2xl font-bold'>{userProfile.first_name} {userProfile.last_name}</h1>
                            {cur_username === username && (<button className='text-sm bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ml-4' onClick={() => navigate('/edit')}>
                                Edit Profile
                            </button>)}
                        </div>
                        <p>{userProfile.affiliation}</p>
                        <p>{userProfile.bio}</p>
                        <p>{userProfile.interests}</p>
                        <p>{userProfile.email}</p>
                        {userProfile.birth_date && <p>{userProfile.birth_date.split('T')[0]}</p>}
                        {actor && <p>Linked actor: {actor}</p>}
                    </div>
                </div>
                {following && (<button className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded' onClick={unFollow}>Unfollow </button>)}
                {!following && requested && (<button className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded' onClick={unFollow}>Follow Requested </button>)}
                {!following && !requested && followedBy && (<button className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded' onClick={sendFollowRequest}>Follow Back </button>)}
                {(cur_username !== username) && !following && !requested && !followedBy && (<button className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded' onClick={sendFollowRequest}>Follow </button>)}
                {/* Display actor recommendations horizontally */}
                <div className='flex flex-wrap'>
                    {actor_recs.map((actor, index) => (
                        <div key={index} className='m-2 p-2 border rounded'>
                            {actor.image_url && <img className='rounded-full w-32 h-32' src={actor.image_url} alt='Actor' />}
                            <p>{actor.name}</p>
                            <button onClick={() => handleLinkActor(actor.id)} className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-2'>
                                Link Actor
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    
}
