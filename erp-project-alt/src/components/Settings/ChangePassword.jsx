import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiLock, FiKey, FiEye, FiEyeOff, FiCheckCircle } from 'react-icons/fi';

const ChangePassword = () => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setSuccessMessage('Passwords do not match.');
      return;
    }

    // Just a mock success (frontend only)
    setSuccessMessage('Password changed successfully!');
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 max-w-md mx-auto mt-10 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 flex items-center space-x-4">
        <Link to="/dashboard" className="text-gray-500 hover:text-gray-700">
          <FiArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-semibold text-gray-800">Change Password</h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Current Password
          </label>
          <div className="relative">
            <FiLock className="absolute left-3 top-3.5 text-gray-400 h-4 w-4" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter current password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full pl-9 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-sm"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            New Password
          </label>
          <div className="relative">
            <FiKey className="absolute left-3 top-3.5 text-gray-400 h-4 w-4" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full pl-9 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-sm"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Confirm New Password
          </label>
          <div className="relative">
            <FiKey className="absolute left-3 top-3.5 text-gray-400 h-4 w-4" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full pl-9 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-sm"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
        </div>

        {successMessage && (
          <div
            className={`flex items-center text-sm ${
              successMessage.includes('success')
                ? 'text-green-600'
                : 'text-red-500'
            }`}
          >
            <FiCheckCircle className="mr-2 h-4 w-4" />
            {successMessage}
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-primary hover:bg-[#1e5369e4] text-white py-2 rounded-lg font-medium text-sm transition-colors"
        >
          Update Password
        </button>
      </form>
    </div>
  );
};

export default ChangePassword;
