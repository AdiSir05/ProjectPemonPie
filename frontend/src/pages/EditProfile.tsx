import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; 
import config from '../../config.json';

axios.defaults.withCredentials = true;

export default function Signup() {
    const navigate = useNavigate();

    const [user_id, setUserId] = useState('');
    const [username, setUsername] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [affiliation, setAffiliation] = useState('');
    const [email, setEmail] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [interests, setInterests] = useState(['']);
    const [bio, setBio] = useState('');
    const [image_url, setImageUrl] = useState('');

    const rootURL = config.serverRootURL;

    const handleUploadPhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            console.log("Uploading Photo");
            const formData = new FormData();
            formData.append('file', event.target.files[0]);
            const response = await axios.post(`${rootURL}/${username}/upload_image`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            if (response.status !== 200) {
                alert('Upload failed, ' + response.data.message);
                return;
            }
            setImageUrl(response.data.url);
        }
    }

    const handleSubmit = async () => {
        try {
            const interestsCollected = interests.length > 0 ? interests.join(', ') : '';
            const response = await axios.post(`${rootURL}/${username}/update`, {
                user_id: user_id,
                first_name: firstName,
                last_name: lastName,
                affiliation: affiliation,
                email: email,
                birth_date: birthDate,
                interests: interestsCollected,
                bio: bio,
                image_url: image_url    
            });
            if (response.status !== 200) {
                alert('Update failed, ' + response.data.message);
                return;
            }
            alert('Update Success');
            navigate(`/${username}/profile`, { state: { username: username } });
        } catch (error) {
            console.log('Error fetching data:', error);
            alert('Update failed.');
            return;
        }
    };

    const getUserProfile = async () => {
        try {
            const response = await axios.get(`${rootURL}/${username}/profile`);
            if (response.status === 200) {
                const user = response.data.user;
                setUserId(user.user_id);
                setFirstName(user.first_name);
                setLastName(user.last_name);
                setAffiliation(user.affiliation);
                setEmail(user.email);
                setBirthDate(user.birth_date.split('T')[0]);
                setInterests(user.interests);
                setBio(user.bio);
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

    const handleInterestChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        var options = e.target.options;
        var value = [];
        for (var i = 0, l = options.length; i < l; i++) {
            if (options[i].selected) {
                value.push(options[i].value);
            }
        }
        setInterests(value);
    }

    useEffect(() => {
        getUserProfile();
    }, [username]);

    useEffect(() => {
        getUserInfo();
    }, []);

    return (
        <div className='w-screen h-screen flex items-center justify-center'>
            {username ? (
                <form onSubmit={handleSubmit} className='border border-gray-400 w-full max-w-md'> {/* Increased max width */}
                    <div className='p-6 space-y-4'>
                        <div className='font-bold flex justify-center text-2xl mb-6 mt-4 italic'>
                            Edit Lemonstagram Profile
                        </div>
                        <p>First Name</p>
                        <input
                            id="firstName"
                            type="text"
                            placeholder="First Name"
                            className='w-full outline-none bg-slate-50 rounded-sm border border-slate-300 p-2'
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                        />
                        <p>Last Name</p>
                        <input
                            id="lastName"
                            type="text"
                            placeholder="Last Name"
                            className='w-full outline-none bg-slate-50 rounded-sm border border-slate-300 p-2'
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                        />
                        <p>Affiliation</p>
                        <input
                            id="affiliation"
                            type="text"
                            placeholder="Affiliation"
                            className='w-full outline-none bg-slate-50 rounded-sm border border-slate-300 p-2'
                            value={affiliation}
                            onChange={(e) => setAffiliation(e.target.value)}
                        />
                        <p>Email</p>
                        <input
                            id="email"
                            type="text"
                            placeholder="Email"
                            className='w-full outline-none bg-slate-50 rounded-sm border border-slate-300 p-2'
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <p>Birthdate</p>
                        <input
                            id="birthDate"
                            type="date"
                            placeholder="Birth Date"
                            className='w-full outline-none bg-slate-50 rounded-sm border border-slate-300 p-2'
                            value={birthDate}
                            onChange={(e) => setBirthDate(e.target.value)}
                        />
                        <p>Interests</p>
                        <select
                            id="interests"
                            multiple
                            className='w-full outline-none bg-slate-50 rounded-sm border border-slate-300 p-2'
                            value={interests}
                            onChange={(e) => handleInterestChange(e)}
                        >
                            <option value="Travel">Travel</option>
                            <option value="Food">Food</option>
                            <option value="Fitness">Fitness</option>
                            <option value="Fashion">Fashion</option>
                            <option value="Technology">Technology</option>
                            <option value="Art">Art</option>
                            <option value="Music">Music</option>
                            <option value="Photography">Photography</option>
                            <option value="Science">Science</option>
                            <option value="Pets">Pets</option>

                        </select>
                        <input
                            id="bio"
                            type="text"
                            placeholder="Bio"
                            className='w-full outline-none bg-slate-50 rounded-sm border border-slate-300 p-2'
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                        />
                        <input type="file" onChange={(event) => handleUploadPhoto(event)} />
                        <div className='w-full flex flex-col space-y-3 mt-4'>
                            <button
                                type="submit"
                                className='py-2 rounded-lg text-white px-6'
                                style={{ backgroundColor: '#61B9E4' }}
                            >
                                Submit
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate(`/${username}/profile`)}
                                className='py-2 rounded-lg text-white px-6'
                                style={{ backgroundColor: '#6C757D' }}  // Using a different color for visual distinction
                            >
                                Return to Profile
                            </button>
                        </div>
                    </div>
                </form>
            ) : (
                <div className='font-bold flex justify-center text-2xl mb-6 mt-4 italic'>
                    Please log in to edit your profile.
                </div>
            )}
        </div>
    );
}
