import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Navbar from './components/shared/Navbar'
import Login from './components/auth/Login'
import Signup from './components/auth/Signup'
import OAuthCallback from './components/auth/OAuthCallback'
import VerifyEmail from './components/auth/VerifyEmail'
import CheckEmail from './components/auth/CheckEmail'
import ForgotPassword from './components/auth/ForgotPassword'
import ResetPassword from './components/auth/ResetPassword'
import Home from './components/Home'
import DynamicHomePage from './components/DynamicHomePage'
import Jobs from './components/Jobs'
import Browse from './components/Browse'
import Profile from './components/Profile'
import JobDescription from './components/JobDescription'
import SavedJobs from './components/SavedJobs'
import NotificationSettings from './components/NotificationSettings'
import Companies from './components/admin/Companies'
import CompanyCreate from './components/admin/CompanyCreate'
import CompanySetup from './components/admin/CompanySetup'
import AdminJobs from "./components/admin/AdminJobs";
import PostJob from './components/admin/PostJob'
import EditJob from './components/admin/EditJob'
import Applicants from './components/admin/Applicants'
import ProtectedRoute from './components/admin/ProtectedRoute'
import AnalyticsDashboard from './components/admin/AnalyticsDashboard'
import RecruiterAnalytics from './components/admin/RecruiterAnalytics'
import Monitoring from './components/admin/Monitoring'
import AdminDashboard from './components/admin/AdminDashboard'
import SubAdminManagement from './components/admin/SubAdminManagement'
import ReduxDebugger from './components/ReduxDebugger'
import TwoFactorSetup from './components/TwoFactorSetup'
import TwoFactorSettings from './components/TwoFactorSettings'
import MessageCenter from './components/MessageCenter'
import AIRecommendations from './components/AIRecommendations'
import CareerDevelopment from './components/CareerDevelopment'
import NLPTools from './components/NLPTools'
import PrivacyCenter from './components/PrivacyCenter'
import PricingPlans from './components/PricingPlans'
import PaymentHistory from './components/PaymentHistory'
import FAQPage from './components/FAQPage'
import ReportingDashboard from './components/ReportingDashboard'
import AdvancedFeaturesPage from './components/AdvancedFeaturesPage'


const appRouter = createBrowserRouter([
  {
    path: '/',
    element: <Home />
  },
  {
    path: '/advanced-features',
    element: <AdvancedFeaturesPage />
  },
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/signup',
    element: <Signup />
  },
  {
    path: '/auth/callback',
    element: <OAuthCallback />
  },
  {
    path: '/check-email',
    element: <CheckEmail />
  },
  {
    path: '/verify-email',
    element: <VerifyEmail />
  },
  {
    path: '/forgot-password',
    element: <ForgotPassword />
  },
  {
    path: '/reset-password',
    element: <ResetPassword />
  },
  {
    path: "/jobs",
    element: <Jobs />
  },
  {
    path: "/saved-jobs",
    element: <SavedJobs />
  },
  {
    path: "/description/:id",
    element: <JobDescription />
  },
  {
    path: "/browse",
    element: <Browse />
  },
  {
    path: "/profile",
    element: <Profile />
  },
  {
    path: "/notification-settings",
    element: <NotificationSettings />
  },
  // Admin only routes
  {
    path:"/admin/dashboard",
    element:<ProtectedRoute allowedRoles={['admin']}><AdminDashboard/></ProtectedRoute>
  },
  // admin ke liye yha se start hoga (Recruiter and Admin)
  {
    path:"/admin/companies",
    element: <ProtectedRoute><Companies/></ProtectedRoute>
  },
  {
    path:"/admin/companies/create",
    element: <ProtectedRoute><CompanyCreate/></ProtectedRoute> 
  },
  {
    path:"/admin/companies/:id",
    element:<ProtectedRoute><CompanySetup/></ProtectedRoute> 
  },
  {
    path:"/admin/jobs",
    element:<ProtectedRoute><AdminJobs/></ProtectedRoute> 
  },
  {
    path:"/admin/jobs/create",
    element:<ProtectedRoute><PostJob/></ProtectedRoute> 
  },
  {
    path:"/admin/jobs/edit/:id",
    element:<ProtectedRoute><EditJob/></ProtectedRoute> 
  },
  {
    path:"/admin/jobs/:id/applicants",
    element:<ProtectedRoute><Applicants/></ProtectedRoute> 
  },
  {
    path:"/admin/analytics",
    element:<ProtectedRoute allowedRoles={['admin']}><AnalyticsDashboard/></ProtectedRoute>
  },
  {
    path:"/recruiter/analytics",
    element:<ProtectedRoute allowedRoles={['recruiter']}><RecruiterAnalytics/></ProtectedRoute>
  },
  {
    path:"/admin/monitoring",
    element:<ProtectedRoute><Monitoring/></ProtectedRoute>
  },
  {
    path:"/admin/sub-admins",
    element:<ProtectedRoute allowedRoles={['admin']}><SubAdminManagement/></ProtectedRoute>
  },
  {
    path:"/2fa/setup",
    element:<ProtectedRoute><TwoFactorSetup/></ProtectedRoute>
  },
  {
    path:"/2fa/settings",
    element:<ProtectedRoute><TwoFactorSettings/></ProtectedRoute>
  },
  {
    path:"/messages",
    element:<ProtectedRoute><MessageCenter/></ProtectedRoute>
  },
  {
    path:"/ai-recommendations",
    element:<ProtectedRoute><AIRecommendations/></ProtectedRoute>
  },
  {
    path:"/career-development",
    element:<ProtectedRoute><CareerDevelopment/></ProtectedRoute>
  },
  {
    path:"/nlp-tools",
    element:<ProtectedRoute><NLPTools/></ProtectedRoute>
  },
  {
    path:"/privacy-center",
    element:<ProtectedRoute><PrivacyCenter/></ProtectedRoute>
  },
  {
    path:"/pricing",
    element:<PricingPlans/>
  },
  {
    path:"/payment-history",
    element:<ProtectedRoute><PaymentHistory/></ProtectedRoute>
  },
  {
    path:"/faq",
    element:<FAQPage/>
  },
  {
    path:"/reporting",
    element:<ProtectedRoute allowedRoles={['admin', 'recruiter']}><ReportingDashboard/></ProtectedRoute>
  },

])
function App() {

  return (
    <div>
      <ReduxDebugger />
      <RouterProvider router={appRouter} />
    </div>
  )
}

export default App
