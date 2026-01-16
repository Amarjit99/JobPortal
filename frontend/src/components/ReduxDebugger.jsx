// Redux State Debugger Component
// Add this to your app temporarily to debug Redux state issues

import { useEffect } from 'react';
import { useSelector } from 'react-redux';

const ReduxDebugger = () => {
    const auth = useSelector(store => store.auth);
    
    useEffect(() => {
        console.log('=== REDUX STATE DEBUG ===');
        console.log('Auth State:', auth);
        console.log('User:', auth?.user);
        console.log('User Profile:', auth?.user?.profile);
        console.log('========================');
        
        // Check localStorage
        const persistedState = localStorage.getItem('persist:root');
        if (persistedState) {
            try {
                const parsed = JSON.parse(persistedState);
                console.log('LocalStorage persist:root:', parsed);
                if (parsed.auth) {
                    console.log('Persisted auth:', JSON.parse(parsed.auth));
                }
            } catch (e) {
                console.error('Error parsing persisted state:', e);
            }
        }
    }, [auth]);
    
    return null; // This component doesn't render anything
};

export default ReduxDebugger;
