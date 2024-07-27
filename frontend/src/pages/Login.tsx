import { useState } from 'react';
import axios from 'axios'; // Import Axios
import config from '../../config.json';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';

axios.defaults.withCredentials = true;

export default function Login() {
  const navigate = useNavigate(); 

  // TODO: set appropriate state variables for username and password 
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const rootURL = config.serverRootURL;

  const handleLogin = async () => {
    try {
      const response = await axios.post(`${rootURL}/login`, {
        username: username,
        password: password
      });
      if (response.status == 200) {
        navigate(`/${username}/home`);
      } else {
        alert('Log in failed.');
      }
    } catch (error) {
      console.error('Error fetching data: ', error);
      return;
    }
  };

  const signup = () => {
    navigate("/signup");
  };

  return (
    <div className='w-screen h-screen flex flex-col items-center justify-center space-y-4'>
      <form className='border border-gray-400 w-full max-w-xs'>
        <div className='p-6 space-y-2'>
          <div className='font-bold flex justify-center text-2xl mb-6 mt-4 italic'>
            Lemonstagram
          </div>
          <div className='w-full'>
            <input id="username" type="text" placeholder="Username"
              className='w-full outline-none bg-slate-50 rounded-sm border border-slate-300 p-2 text-gray-500'
              value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div className='w-full'>
            <input id="password" type="password" placeholder="Password"
              className='w-full outline-none bg-slate-50 rounded-sm border border-slate-300 p-2 text-gray-500'
              value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className='w-full flex justify-center mt-4'>
            <button type="button" className='w-full py-2 rounded-lg text-white px-6'
              style={{ backgroundColor: '#61B9E4' }}
              onClick={handleLogin}>Log in</button>
          </div>
          <div className='w-full flex justify-center text-sm mt-8'>  {/* Increased margin-top to add more space */}
            <Link to="/password" className='text-[#232330] hover:text-opacity-80 no-underline'>Forgot password?</Link>
          </div>
        </div>
      </form>
      <div className='text-center border border-gray-400 w-full max-w-xs rounded p-4'>
        <span className='text-gray-700'>Don't have an account? </span>
        <button onClick={signup} className='text-blue-500 hover:text-blue-700'>Sign up</button>
      </div>
    </div>
  )

}
