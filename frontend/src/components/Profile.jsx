import React, { useState } from 'react'
import Navbar from './shared/Navbar'
import { Avatar, AvatarImage } from './ui/avatar'
import { Button } from './ui/button'
import { Contact, Mail, Pen } from 'lucide-react'
import { Badge } from './ui/badge'
import { Label } from './ui/label'
import AppliedJobTable from './AppliedJobTable'
import UpdateProfileDialog from './UpdateProfileDialog'
import TwoFactorSettings from './TwoFactorSettings'
import EducationSection from './profile/EducationSection'
import ExperienceSection from './profile/ExperienceSection'
import CertificationSection from './profile/CertificationSection'
import ResumeManager from './profile/ResumeManager'
import JobPreferences from './profile/JobPreferences'
import { useSelector } from 'react-redux'
import useGetAppliedJobs from '@/hooks/useGetAppliedJobs'

const isResume = true;

const Profile = () => {
    useGetAppliedJobs();
    const [open, setOpen] = useState(false);
    const {user} = useSelector(store=>store.auth);

    // Calculate profile completion
    const calculateProfileCompletion = () => {
        if (!user) return 0;
        let completed = 0;
        const total = 12;

        // Basic fields (always filled during registration)
        if (user.fullname) completed++;
        if (user.email) completed++;
        if (user.phoneNumber) completed++;

        // Profile fields
        if (user.profile?.bio) completed++;
        if (user.profile?.skills && user.profile.skills.length > 0) completed++;
        if (user.profile?.profilePhoto) completed++;
        if (user.profile?.resume || (user.resumes && user.resumes.length > 0)) completed++;

        // New profile sections
        if (user.education && user.education.length > 0) completed++;
        if (user.experience && user.experience.length > 0) completed++;
        if (user.certifications && user.certifications.length > 0) completed++;
        if (user.preferredJobLocations && user.preferredJobLocations.length > 0) completed++;
        if (user.expectedSalary && (user.expectedSalary.min || user.expectedSalary.max)) completed++;

        return Math.round((completed / total) * 100);
    };

    const profileCompletion = calculateProfileCompletion();

    const getCompletionColor = (percentage) => {
        if (percentage === 100) return 'bg-green-500';
        if (percentage >= 75) return 'bg-blue-500';
        if (percentage >= 50) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    return (
        <div>
            <Navbar />
            <div className='max-w-4xl mx-auto bg-white border border-gray-200 rounded-2xl my-5 p-8'>
                <div className='flex justify-between'>
                    <div className='flex items-center gap-4'>
                        <Avatar className="h-24 w-24">
                            <AvatarImage src={user?.profile?.profilePhoto || "https://www.shutterstock.com/image-vector/circle-line-simple-design-logo-600nw-2174926871.jpg"} alt="profile" />
                        </Avatar>
                        <div>
                            <h1 className='font-medium text-xl'>{user?.fullname}</h1>
                            <p>{user?.profile?.bio || "No bio added yet"}</p>
                        </div>
                    </div>
                    <Button onClick={() => setOpen(true)} className="text-right" variant="outline"><Pen /></Button>
                </div>

                {/* Profile Completion Indicator */}
                <div className='my-4 p-4 bg-gray-50 rounded-lg border border-gray-200'>
                    <div className='flex items-center justify-between mb-2'>
                        <span className='text-sm font-medium'>Profile Completion</span>
                        <span className='text-sm font-bold'>{profileCompletion}%</span>
                    </div>
                    <div className='w-full bg-gray-200 rounded-full h-2.5'>
                        <div 
                            className={`h-2.5 rounded-full transition-all ${getCompletionColor(profileCompletion)}`}
                            style={{ width: `${profileCompletion}%` }}
                        ></div>
                    </div>
                    {profileCompletion < 100 && (
                        <p className='text-xs text-gray-600 mt-2'>
                            Complete your profile to increase your chances of getting hired!
                            {!user?.profile?.bio && " Add a bio."}
                            {(!user?.profile?.skills || user?.profile?.skills.length === 0) && " Add your skills."}
                            {!user?.profile?.resume && " Upload your resume."}
                        </p>
                    )}
                </div>

                <div className='my-5'>
                    <div className='flex items-center gap-3 my-2'>
                        <Mail />
                        <span>{user?.email}</span>
                    </div>
                    <div className='flex items-center gap-3 my-2'>
                        <Contact />
                        <span>{user?.phoneNumber}</span>
                    </div>
                </div>
                <div className='my-5'>
                    <h1>Skills</h1>
                    <div className='flex items-center gap-1'>
                        {
                            user?.profile?.skills.length !== 0 ? user?.profile?.skills.map((item, index) => <Badge key={index}>{item}</Badge>) : <span>NA</span>
                        }
                    </div>
                </div>
            </div>

            {/* Resume Manager Section */}
            <div className='max-w-4xl mx-auto my-5'>
                <ResumeManager />
            </div>

            {/* Two-Factor Authentication Section */}
            <div className='max-w-4xl mx-auto bg-white border border-gray-200 rounded-2xl p-5 my-5'>
                <h1 className='font-bold text-lg mb-4'>Security Settings</h1>
                <TwoFactorSettings />
            </div>

            {/* Education Section */}
            <div className='max-w-4xl mx-auto my-5'>
                <EducationSection />
            </div>

            {/* Work Experience Section */}
            <div className='max-w-4xl mx-auto my-5'>
                <ExperienceSection />
            </div>

            {/* Certifications Section */}
            <div className='max-w-4xl mx-auto my-5'>
                <CertificationSection />
            </div>

            {/* Job Preferences Section */}
            <div className='max-w-4xl mx-auto my-5'>
                <JobPreferences />
            </div>

            <div className='max-w-4xl mx-auto bg-white rounded-2xl'>
                <h1 className='font-bold text-lg my-5'>Applied Jobs</h1>
                {/* Applied Job Table   */}
                <AppliedJobTable />
            </div>
            <UpdateProfileDialog open={open} setOpen={setOpen}/>
        </div>
    )
}

export default Profile