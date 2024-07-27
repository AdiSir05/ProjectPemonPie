import { useState } from 'react';
import axios from 'axios'; 
import config from '../../config.json';

axios.defaults.withCredentials = true;

export default function PasswordChange() {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');

    const rootURL = config.serverRootURL;

    const handlePasswordChange = async () => {
        if (newPassword !== confirmNewPassword) {
            alert('New passwords do not match');
            return;
        }
        try {
            const response = await axios.post(`${rootURL}/password`, {
                oldPassword: oldPassword,
                newPassword: newPassword
            });
            if (response.status === 200) {
                alert('Password successfully updated');
            } else {
                alert('Password update failed.');
            }
        } catch (error) {
            console.error('Error updating password:', error);
            alert('Password update failed.');
        }
    };

    return (
        <div className='w-screen h-screen flex items-center justify-center'>
            <form onSubmit={handlePasswordChange} className='border border-gray-400 w-full max-w-md'>
                <div className='p-6 space-y-4'>
                    <div className='font-bold flex justify-center text-2xl mb-6 mt-4 italic'>
                        Change Password
                    </div>
                    <input
                        id="oldPassword"
                        type="password"
                        placeholder="Old Password"
                        className='w-full outline-none bg-slate-50 rounded-sm border border-slate-300 p-2'
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                    />
                    <input
                        id="newPassword"
                        type="password"
                        placeholder="New Password"
                        className='w-full outline-none bg-slate-50 rounded-sm border border-slate-300 p-2'
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <input
                        id="confirmNewPassword"
                        type="password"
                        placeholder="Confirm New Password"
                        className='w-full outline-none bg-slate-50 rounded-sm border border-slate-300 p-2'
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                    />
                    <div className='w-full flex justify-center mt-4'>
                        <button
                            type="submit"
                            className='w-full py-2 rounded-lg text-white px-6'
                            style={{ backgroundColor: '#61B9E4' }}  // Light blue button
                        >
                            Reset Password
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}