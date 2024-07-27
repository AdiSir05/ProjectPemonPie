import React, { useEffect, useState } from 'react';
import axios from 'axios'; // Import Axios
import config from '../../config.json';
import { useNavigate } from 'react-router-dom';

axios.defaults.withCredentials = true;

export default function CreatePost() {
  const navigate = useNavigate();

  const rootURL = config.serverRootURL;
  const [caption, setCaption] = useState('');
  const [interests, setInterests] = useState(['']);
  const [image, setImage] = useState<File | null>(null);
  const [username, setUsername] = useState('');
  

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
        const file = e.target.files[0];
        setImage(file);
    }
  };

  const handlePostSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    console.log(username);
    e.preventDefault();
    try {
      // First, upload the image
    const formData = new FormData();
    if (image) {
        formData.append('file', image);
    }

    const imageResponse = await axios.post(
        `${rootURL}/${username}/upload_image`,
        formData,
        {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        }
    );

    const imageUrl = imageResponse.data.url;

      // Then, create the post
    const postResponse = await axios.post(
        `${rootURL}/${username}/post`,
        {
          text: caption,
          interests: interests,
          image_url: imageUrl,
        }
      );

      if (postResponse.status === 200) {
        // Post created successfully
        // Redirect user to home page or wherever appropriate
        navigate(`/${username}/home`);
      } else {
        // Handle error
        alert('Failed to create post.');
      }
    } catch (error) {
      console.error('Error creating post: ', error);
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
    getUserInfo();
  }, []);

return (
    <div className='w-screen h-screen flex flex-col items-center justify-center space-y-4'>
        <form
            className='border border-gray-400 w-full max-w-2xl' // Increase the max width of the form
            onSubmit={handlePostSubmit}
        >
            <div className='p-6 space-y-2'>
                <div className='font-bold flex justify-center text-2xl mb-6 mt-4 italic'>
                    Create Post
                </div>
                <div className='w-full'>
                    <input
                        type='file'
                        accept='image/*'
                        onChange={handleImageChange}
                    />
                </div>
                {image && (
                    <div className='w-full'>
                        <img src={URL.createObjectURL(image)} alt='Preview' />
                    </div>
                )}
                <div className='w-full'>
                    <input
                        type='text'
                        placeholder='Caption'
                        className='w-full outline-none bg-slate-50 rounded-sm border border-slate-300 p-2 text-gray-500'
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        style={{ height: '40px' }} 
                    />
                </div>
                <div className='w-full'>
                    <p>Interests:</p>
                        <select
                        id="interests"
                        multiple
                        className='w-full outline-none bg-slate-50 rounded-sm border border-slate-300 p-2'
                        value={interests}
                        onChange={(e) => handleInterestChange(e)}
                        style={{height: '250px'}}
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
                </div>
                <div className='w-full flex justify-center mt-4'>
                    <button
                        type='submit'
                        className='w-full py-2 rounded-lg text-white px-6'
                        style={{ backgroundColor: '#61B9E4' }}
                    >
                        Post
                    </button>
                </div>
            </div>
        </form>
    </div>
);
}
