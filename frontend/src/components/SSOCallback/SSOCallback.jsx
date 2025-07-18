import { AuthenticateWithRedirectCallback } from '@clerk/clerk-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SSOCallback() {
    const navigate = useNavigate();
    useEffect(() => {
        // Clerk sẽ tự động xử lý callback, sau đó chuyển hướng về Home
        // Đợi 1 chút để Clerk hoàn tất xác thực
        const timeout = setTimeout(() => {
            navigate('/');
        }, 1000);
        return () => clearTimeout(timeout);
    }, [navigate]);
    return <AuthenticateWithRedirectCallback />;
}
