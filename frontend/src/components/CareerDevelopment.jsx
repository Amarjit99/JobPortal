import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner';
import { BookOpen, Award, Users, Calendar, Target, Trophy } from 'lucide-react';

const CareerDevelopment = () => {
    const [courses, setCourses] = useState([]);
    const [assessments, setAssessments] = useState([]);
    const [mentorships, setMentorships] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [coursesRes, assessmentsRes, mentorshipsRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/career-development/courses`, { withCredentials: true }),
                axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/career-development/assessments`, { withCredentials: true }),
                axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/career-development/mentorships`, { withCredentials: true })
            ]);
            setCourses(coursesRes.data.courses || []);
            setAssessments(assessmentsRes.data.assessments || []);
            setMentorships(mentorshipsRes.data.mentorships || []);
        } catch (error) {
            toast.error('Failed to load data');
            setCourses([]);
            setAssessments([]);
            setMentorships([]);
        } finally {
            setLoading(false);
        }
    };

    const startAssessment = (assessmentId) => {
        toast.info('Assessment feature coming soon!');
    };

    return (
        <div className="container mx-auto p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">Career Development</h1>
                <p className="text-gray-600">Enhance your skills and advance your career</p>
            </div>

            <Tabs defaultValue="courses" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="courses">
                        <BookOpen className="w-4 h-4 mr-2" />
                        Courses
                    </TabsTrigger>
                    <TabsTrigger value="assessments">
                        <Award className="w-4 h-4 mr-2" />
                        Assessments
                    </TabsTrigger>
                    <TabsTrigger value="mentorship">
                        <Users className="w-4 h-4 mr-2" />
                        Mentorship
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="courses">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {!courses || courses.length === 0 ? (
                            <div className="col-span-full text-center py-12 text-gray-500">
                                No courses available yet
                            </div>
                        ) : (
                            courses.map((course) => (
                                <Card key={course._id} className="hover:shadow-lg transition-shadow">
                                    <CardHeader>
                                        <CardTitle className="text-lg">{course.title}</CardTitle>
                                        <CardDescription>{course.provider}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <p className="text-sm text-gray-600 line-clamp-2">{course.description}</p>
                                        <div className="flex items-center justify-between">
                                            <Badge>{course.level}</Badge>
                                            <span className="text-sm font-semibold">
                                                {course.price === 0 ? 'Free' : `$${course.price}`}
                                            </span>
                                        </div>
                                        {course.skills && (
                                            <div className="flex flex-wrap gap-1">
                                                {course.skills.slice(0, 3).map((skill, idx) => (
                                                    <Badge key={idx} variant="secondary" className="text-xs">
                                                        {skill}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                        <Button className="w-full" onClick={() => window.open(course.url, '_blank')}>
                                            Enroll Now
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="assessments">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {!assessments || assessments.length === 0 ? (
                            <div className="col-span-full text-center py-12 text-gray-500">
                                No assessments available yet
                            </div>
                        ) : (
                            assessments.map((assessment) => (
                                <Card key={assessment._id}>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Trophy className="w-5 h-5" />
                                            {assessment.title}
                                        </CardTitle>
                                        <CardDescription>{assessment.skillArea}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <p className="text-sm text-gray-600">{assessment.description}</p>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="text-gray-600">Duration:</span>
                                                <p className="font-semibold">{assessment.duration} min</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Passing Score:</span>
                                                <p className="font-semibold">{assessment.passingScore}%</p>
                                            </div>
                                        </div>
                                        <Button className="w-full" onClick={() => startAssessment(assessment._id)}>
                                            Start Assessment
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="mentorship">
                    <Card>
                        <CardHeader>
                            <CardTitle>Your Mentorship Connections</CardTitle>
                            <CardDescription>Connect with experienced professionals</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {!mentorships || mentorships.length === 0 ? (
                                <div className="text-center py-12">
                                    <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                                    <p className="text-gray-500 mb-4">No mentorship connections yet</p>
                                    <Button>Find a Mentor</Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {mentorships.map((mentorship) => (
                                        <Card key={mentorship._id}>
                                            <CardContent className="p-4">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h3 className="font-semibold">
                                                            {mentorship.mentor?.fullname || mentorship.mentee?.fullname}
                                                        </h3>
                                                        <p className="text-sm text-gray-600">
                                                            {mentorship.skillAreas?.join(', ')}
                                                        </p>
                                                    </div>
                                                    <Badge>{mentorship.status}</Badge>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default CareerDevelopment;
