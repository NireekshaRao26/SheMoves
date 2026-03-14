import React, { useState, useEffect } from 'react';
import { User, Mail, Calendar, MapPin, CreditCard, Save } from 'lucide-react';

const Profile = () => {
    const [profileData, setProfileData] = useState({
        name: '',
        email: '',
        profile: {
            dob: '',
            gender: '',
            address: '',
            fatherName: '',
            aadhaarNumber: '',
            panNumber: ''
        }
    });
    
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saveStatus, setSaveStatus] = useState({ type: '', message: '' });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/user/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            
            if (response.ok) {
                // Ensure profile object exists even if empty from DB
                if (!data.profile) data.profile = {};
                setProfileData(data);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e, section) => {
        const { name, value } = e.target;
        if (section === 'main') {
            setProfileData(prev => ({ ...prev, [name]: value }));
        } else if (section === 'profile') {
            setProfileData(prev => ({
                ...prev,
                profile: { ...prev.profile, [name]: value }
            }));
        }
    };

    const handleSave = async () => {
        setSaveStatus({ type: 'info', message: 'Saving...' });
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/user/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: profileData.name,
                    profile: profileData.profile
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                setSaveStatus({ type: 'success', message: 'Profile updated successfully!' });
                setIsEditing(false);
                
                // Update local storage user name
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                user.name = data.user.name;
                localStorage.setItem('user', JSON.stringify(user));
                
                // Clear success message after 3 seconds
                setTimeout(() => setSaveStatus({ type: '', message: '' }), 3000);
            } else {
                setSaveStatus({ type: 'error', message: data.message || 'Failed to update profile' });
            }
        } catch (error) {
            console.error('Error saving profile:', error);
            setSaveStatus({ type: 'error', message: 'Network error occurred' });
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden animate-fade-in fade-in-up">
            <div className="bg-gradient-to-r from-pink-500 to-rose-500 px-8 py-10 text-white relative">
                <div className="flex justify-between items-start relative z-10">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">My Profile</h1>
                        <p className="text-pink-100">Manage your personal information and uploaded details</p>
                    </div>
                    <button
                        onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                        className={`px-6 py-2.5 rounded-full font-medium shadow-md transition-all flex items-center gap-2 ${
                            isEditing 
                            ? 'bg-green-500 hover:bg-green-600 text-white shadow-green-500/30' 
                            : 'bg-white text-pink-600 hover:bg-gray-50'
                        }`}
                    >
                        {isEditing ? <><Save className="h-4 w-4" /> Save Details</> : 'Edit Profile'}
                    </button>
                </div>
                
                {/* Decorative background circle */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
            </div>

            <div className="p-8">
                {saveStatus.message && (
                    <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
                        saveStatus.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
                        saveStatus.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
                        'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                        <p className="font-medium">{saveStatus.message}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Basic Info Section */}
                    <div className="space-y-6">
                        <h3 className="text-xl font-semibold text-gray-800 border-b pb-2 flex items-center gap-2">
                            <User className="h-5 w-5 text-pink-500" /> Basic Information
                        </h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={profileData.name}
                                    onChange={(e) => handleInputChange(e, 'main')}
                                    disabled={!isEditing}
                                    className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-pink-500 focus:outline-none transition-colors ${
                                        !isEditing ? 'bg-gray-50 border-gray-200 text-gray-600' : 'bg-white border-gray-300'
                                    }`}
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                                    <Mail className="h-4 w-4 text-gray-400" /> Email Address
                                </label>
                                <input
                                    type="email"
                                    value={profileData.email}
                                    disabled={true} // Email typically not editable here
                                    className="w-full px-4 py-2 rounded-lg border bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed"
                                />
                                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                                    <Calendar className="h-4 w-4 text-gray-400" /> Date of Birth
                                </label>
                                <input
                                    type="text"
                                    name="dob"
                                    placeholder="DD/MM/YYYY"
                                    value={profileData.profile?.dob || ''}
                                    onChange={(e) => handleInputChange(e, 'profile')}
                                    disabled={!isEditing}
                                    className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-pink-500 focus:outline-none transition-colors ${
                                        !isEditing ? 'bg-gray-50 border-gray-200 text-gray-600' : 'bg-white border-gray-300'
                                    }`}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                                <select
                                    name="gender"
                                    value={profileData.profile?.gender || ''}
                                    onChange={(e) => handleInputChange(e, 'profile')}
                                    disabled={!isEditing}
                                    className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-pink-500 focus:outline-none transition-colors ${
                                        !isEditing ? 'bg-gray-50 border-gray-200 text-gray-600 appearance-none' : 'bg-white border-gray-300'
                                    }`}
                                >
                                    <option value="">Select Gender</option>
                                    <option value="Female">Female</option>
                                    <option value="Male">Male</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Government Details Section */}
                    <div className="space-y-6">
                        <h3 className="text-xl font-semibold text-gray-800 border-b pb-2 flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-pink-500" /> Document Details
                        </h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Father's / Husband's Name</label>
                                <input
                                    type="text"
                                    name="fatherName"
                                    value={profileData.profile?.fatherName || ''}
                                    onChange={(e) => handleInputChange(e, 'profile')}
                                    disabled={!isEditing}
                                    className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-pink-500 focus:outline-none transition-colors ${
                                        !isEditing ? 'bg-gray-50 border-gray-200 text-gray-600' : 'bg-white border-gray-300'
                                    }`}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 text-pink-600">Aadhaar Number</label>
                                <input
                                    type="text"
                                    name="aadhaarNumber"
                                    placeholder="XXXX XXXX XXXX"
                                    value={profileData.profile?.aadhaarNumber || ''}
                                    onChange={(e) => handleInputChange(e, 'profile')}
                                    disabled={!isEditing}
                                    className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-pink-500 focus:outline-none transition-colors font-mono tracking-wider ${
                                        !isEditing ? 'bg-gray-50 border-gray-200 text-gray-600' : 'bg-white border-gray-300'
                                    }`}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 text-blue-600">PAN Number</label>
                                <input
                                    type="text"
                                    name="panNumber"
                                    placeholder="ABCDE1234F"
                                    value={profileData.profile?.panNumber || ''}
                                    onChange={(e) => handleInputChange(e, 'profile')}
                                    disabled={!isEditing}
                                    className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-pink-500 focus:outline-none transition-colors font-mono tracking-wider uppercase ${
                                        !isEditing ? 'bg-gray-50 border-gray-200 text-gray-600' : 'bg-white border-gray-300'
                                    }`}
                                />
                            </div>

                            <div className="pt-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                                    <MapPin className="h-4 w-4 text-gray-400" /> Full Address
                                </label>
                                <textarea
                                    name="address"
                                    rows="4"
                                    placeholder="Extracted address will appear here..."
                                    value={profileData.profile?.address || ''}
                                    onChange={(e) => handleInputChange(e, 'profile')}
                                    disabled={!isEditing}
                                    className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-pink-500 focus:outline-none transition-colors resize-none ${
                                        !isEditing ? 'bg-gray-50 border-gray-200 text-gray-600' : 'bg-white border-gray-300'
                                    }`}
                                ></textarea>
                                {!isEditing && !profileData.profile?.address && (
                                    <p className="text-xs text-orange-500 mt-1 italic">Tip: Upload an Aadhaar card to auto-fill this.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
