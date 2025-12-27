import { useEffect } from 'react';

export const useBeforeUnload = (shouldPrevent: boolean) => {
    useEffect(() => {
        if (!shouldPrevent) return;

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = ''; // Required for some browsers
            return '';
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [shouldPrevent]);
};
