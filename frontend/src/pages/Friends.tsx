import {useState, useEffect} from 'react';
import axios from 'axios'; 
import config from '../../config.json';
import { useNavigate } from 'react-router-dom';
import { FaHome, FaUser, FaUserFriends, FaComments, FaPlusSquare, FaSearch, FaSignOutAlt } from 'react-icons/fa';

axios.defaults.withCredentials = true;

export default function Friends() {

    const navigate = useNavigate(); 
    const rootURL = config.serverRootURL;

    // TODO: add state variables for friends and recommendations
    const [username, setUsername] = useState('');
    const [requests, setRequests] = useState([{username: '', firstName: '', lastName: '', image_url: ''}]);
    const [mutual_recommendations, setMutualRecommendations] = useState([{username: '', firstName: '', lastName: '', image_url: ''}]);
    const [interest_recommendations, setInterestRecommendations] = useState([{username: '', firstName: '', lastName: '', image_url: ''}]);
    const [friends, setFriends] = useState([{username: '', firstName: '', lastName: '', image_url: ''}]);

    useEffect(() => {
        fetchData();
    }, [username]);

    useEffect(() => {
        getUserInfo();
    }, []);

    const getUserInfo = async () => {
        const response = await axios.get(`${rootURL}/get_user`);
        if (response.status === 200) {
            console.log("Username: " + response.data.username);
            setUsername(response.data.username);
        } else {
            alert('Failed to get username.');
        }
    }

    const fetchData = async () => {
        try {
            // TODO: fetch the friends and recommendations data and set the appropriate state variables 
            const response = await axios.post(`${rootURL}/get_follow_requests`, {
                cur_username: username
            });
            if (response.status == 200) {
                setRequests(response.data.requests);
            }
            const response1 = await axios.post(`${rootURL}/get_friends`);
            if (response1.status == 200) {
                setFriends(response1.data.friends);
            }
            const response2 = await axios.post(`${rootURL}/${username}/get_mutual_recommendations`);
            if (response2.status == 200) {
                setMutualRecommendations(response2.data.recommendations);
            }
            console.log(response2.data.recommendations);
            const response3 = await axios.post(`${rootURL}/${username}/get_interest_recommendations`);
            if (response3.status == 200) {
                setInterestRecommendations(response3.data.recommendations);
            }
            console.log(response3.data.recommendations);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const handleAccept = async (request: any) => {
        try {
            const response = await axios.post(`${rootURL}/${username}/accept_follow`, {
                friend_name: request.username
            });
            if (response.status === 200) {
                fetchData();
            } else {
                alert('Failed to accept follow request.');
            }
        } catch (error) {
            console.error('Error accepting follow request: ', error);
        }
    };

    const handleReject = async (request: any) => {
        try {
            const response = await axios.post(`${rootURL}/${username}/decline_follow`, {
                friend_name: request.username
            });
            if (response.status === 200) {
                fetchData();
            } else {
                alert('Failed to reject follow request.');
            }
        } catch (error) {
            console.error('Error rejecting follow request: ', error);
        }
    }


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
                <button className='flex items-center mb-4 w-full' onClick={() => navigate(`/${username}/profile`)}>
                    <FaUser size={20} />
                    <span className='ml-2'>Profile</span>
                </button>
            </div>
            <div className='flex-grow bg-slate-50 p-5 flex'>
                <div className='flex-1 overflow-auto p-3 flex flex-col items-center'>
                    <h2 className='font-bold text-xl mb-4'>{`Friends`}</h2>
                    <div className='w-full flex flex-col items-center justify-center'>
                        {friends.length > 0 ? (friends.map(request => (
                            <div key={request.username} className='flex items-center justify-between border-b py-2 w-full max-w-md'>
                                <img src={request.image_url} alt={request.username} className='w-12 h-12 rounded-full' />
                                <div>
                                    <p>{request.username}</p>
                                    <p>{request.firstName} {request.lastName}</p>
                                </div>
                            </div>
                        ))) : <p>No Friends</p>}
                    </div>
                </div>
                <div className='flex-1 overflow-auto p-3 flex flex-col items-center'>
                    <h2 className='font-bold text-xl mb-4'>{`Follow Requests`}</h2>
                    <div className='w-full flex flex-col items-center justify-center'>
                        {requests.length > 0 ? (requests.map(request => (
                            <div key={request.username} className='flex items-center justify-between border-b py-2 w-full max-w-md'>
                                <img src={request.image_url} alt={request.username} className='w-12 h-12 rounded-full' />
                                <div>
                                    <p>{request.username}</p>
                                    <p>{request.firstName} {request.lastName}</p>
                                </div>
                                <div>
                                    <button className='mr-2 bg-green-500 text-white px-3 py-1 rounded' onClick={() => handleAccept(request)}>Confirm</button>
                                    <button className='bg-red-500 text-white px-3 py-1 rounded' onClick={() => handleReject(request)}>Delete</button>
                                </div>
                            </div>
                        ))) : <p>No follow requests</p>}
                    </div>
                </div>
                <div className='flex-1 overflow-auto p-3 flex flex-col items-center'>
                    <h2 className='font-bold text-xl mb-4'>You might know:</h2>
                    <div className='w-full flex flex-col items-center justify-center'>
                        {mutual_recommendations && mutual_recommendations.length > 0 ? (mutual_recommendations.map(rec => (
                            <div key={rec.username} className='flex items-center justify-between border-b py-2 w-full max-w-md'>
                                <img src={rec.image_url} alt={rec.username} className='w-12 h-12 rounded-full' />
                                <div>
                                    <p>{rec.username}</p>
                                    <p>{rec.firstName} {rec.lastName}</p>
                                </div>
                            </div>
                        ))) : <p>No mutual friend suggestions</p>}
                    </div>
                    <h2 className='font-bold text-xl mb-4'>Users Sharing Your Interests:</h2>
                    <div className='w-full flex flex-col items-center justify-center'>
                        {interest_recommendations && interest_recommendations.length > 0 ? (interest_recommendations.map(rec => (
                            <div key={rec.username} className='flex items-center justify-between border-b py-2 w-full max-w-md'>
                                <img src={rec.image_url} alt={rec.username} className='w-12 h-12 rounded-full' />
                                <div>
                                    <p>{rec.username}</p>
                                    <p>{rec.firstName} {rec.lastName}</p>
                                </div>
                            </div>
                        ))) : <p>No mutual friend suggestions</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}
