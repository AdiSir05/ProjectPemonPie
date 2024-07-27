import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; 
import config from '../../config.json';
import { Link } from 'react-router-dom';

axios.defaults.withCredentials = true;

export default function Signup() {
    const navigate = useNavigate(); 
    
    // TODO: set appropriate state variables 
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');

    const rootURL = config.serverRootURL;

    const handleSubmit = async () => {
        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }

        try {
            const response = await axios.post(`${rootURL}/register`, {
                username: username,
                password: password,
                first_name: firstName,
                last_name: lastName,
                email: email
            });
            if (response.status !== 200) {
                alert('Registration failed.');
                return;
            }
            alert('Registration Success');
            navigate(`/${username}/home`, { state: { username: username } });

        } catch (error) {
            alert('Registration failed.');
            console.log('Error fetching data:', error);
            return;
        }
    };

    return (
        <div className='w-screen h-screen flex items-center justify-center'>
            <form onSubmit={handleSubmit} className='border border-gray-400 w-full max-w-md'> {/* Increased max width */}
                <div className='p-6 space-y-4'>
                    <div className='font-bold flex justify-center text-2xl mb-6 mt-4 italic'>
                        Sign Up for Lemonstagram
                    </div>
                    <input
                        id="username"
                        type="text"
                        placeholder="Username"
                        className='w-full outline-none bg-slate-50 rounded-sm border border-slate-300 p-2'
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <input
                        id="firstName"
                        type="text"
                        placeholder="First Name"
                        className='w-full outline-none bg-slate-50 rounded-sm border border-slate-300 p-2'
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                    />
                    <input
                        id="lastName"
                        type="text"
                        placeholder="Last Name"
                        className='w-full outline-none bg-slate-50 rounded-sm border border-slate-300 p-2'
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                    />
                    <input
                        id="email"
                        type="text"
                        placeholder="Email"
                        className='w-full outline-none bg-slate-50 rounded-sm border border-slate-300 p-2'
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <input
                        id="password"
                        type="password"
                        placeholder="Password"
                        className='w-full outline-none bg-slate-50 rounded-sm border border-slate-300 p-2'
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm Password"
                        className='w-full outline-none bg-slate-50 rounded-sm border border-slate-300 p-2'
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <div className='w-full flex justify-center mt-4'>
                        <button
                            type="submit"
                            className='w-full py-2 rounded-lg text-white px-6'
                            style={{ backgroundColor: '#61B9E4' }}  // Matching the login button color
                        >
                            Sign up
                        </button>
                    </div>
                    <div className='w-full flex justify-center text-sm mt-4'>
                        <Link to="/" className='text-[#232330] hover:text-opacity-80 no-underline'>Already have an account? Log in</Link>
                    </div>
                </div>
            </form>
        </div>
    );
}
