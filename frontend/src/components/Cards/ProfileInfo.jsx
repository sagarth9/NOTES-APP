import React from 'react'
import { getInitials } from '../../utils/helper';
import { useNavigate } from 'react-router-dom';

const ProfileInfo = ({ userInfo, onLogout }) => {
  const navigate = useNavigate();

  return (
    <div className='flex items-center gap-3'>
      <div className='w-12 h-12 flex items-center justify-center rounded-full text-slate-950 font-medium bg-slate-100'>
        {getInitials(userInfo?.fullName || 'John Doe')}
        </div>

      <div>
        <p className='text-sm font-medium'>{userInfo?.fullName || 'John Doe'}</p>
        <button className='text-sm text-red-500 hover:text-red-700 underline' onClick={onLogout}>
          Logout
        </button>
      </div>
    </div>
  )
}

export default ProfileInfo;
