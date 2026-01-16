import { FcGoogle } from 'react-icons/fc';
import { FaLinkedin, FaGithub } from 'react-icons/fa';
import { Button } from '../ui/button';

// Remove /api/v1 suffix for OAuth routes
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace('/api/v1', '');

const OAuthButtons = () => {
    const handleGoogleLogin = () => {
        window.location.href = `${API_BASE_URL}/api/v1/auth/google`;
    };

    const handleLinkedInLogin = () => {
        window.location.href = `${API_BASE_URL}/api/v1/auth/linkedin`;
    };

    const handleGitHubLogin = () => {
        window.location.href = `${API_BASE_URL}/api/v1/auth/github`;
    };

    return (
        <div className="space-y-3">
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-muted-foreground">
                        Or continue with
                    </span>
                </div>
            </div>

            <div className="grid gap-2">
                <Button
                    variant="outline"
                    type="button"
                    onClick={handleGoogleLogin}
                    className="w-full"
                >
                    <FcGoogle className="mr-2 h-5 w-5" />
                    Continue with Google
                </Button>

                <Button
                    variant="outline"
                    type="button"
                    onClick={handleLinkedInLogin}
                    className="w-full"
                >
                    <FaLinkedin className="mr-2 h-5 w-5 text-[#0077B5]" />
                    Continue with LinkedIn
                </Button>

                <Button
                    variant="outline"
                    type="button"
                    onClick={handleGitHubLogin}
                    className="w-full"
                >
                    <FaGithub className="mr-2 h-5 w-5" />
                    Continue with GitHub
                </Button>
            </div>
        </div>
    );
};

export default OAuthButtons;
