import { AuthenticateWithRedirectCallback, useUser } from '@clerk/clerk-react';
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function SSOCallback() {
    const navigate = useNavigate();
    const location = useLocation();
    const { isSignedIn, isLoaded } = useUser();

    useEffect(() => {
        // Check for error or cancellation in URL hash/params
        const hash = location.hash;
        const searchParams = new URLSearchParams(location.search);
        
        // Facebook often appends #_=_ on cancel, or there might be an error param
        const hasError = searchParams.get('error') || hash === '#_=_' || hash.includes('error');
        
        if (hasError) {
            // User cancelled or there was an error, redirect back to login
            navigate('/auth/login', { replace: true });
            return;
        }

        // If Clerk has loaded and user is signed in, redirect to home
        if (isLoaded && isSignedIn) {
            navigate('/', { replace: true });
        } else if (isLoaded && !isSignedIn) {
            // Clerk loaded but user not signed in (auth failed/cancelled)
            // Wait a bit for Clerk to potentially complete, then redirect
            const timeout = setTimeout(() => {
                navigate('/auth/login', { replace: true });
            }, 2000);
            return () => clearTimeout(timeout);
        }
    }, [navigate, location, isLoaded, isSignedIn]);

    return <AuthenticateWithRedirectCallback />;
}
