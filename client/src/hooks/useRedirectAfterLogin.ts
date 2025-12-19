import { useEffect } from 'react';
import { useLocation } from 'wouter';

export function useRedirectAfterLogin() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const redirectPath = localStorage.getItem('redirectAfterLogin');
    if (redirectPath) {
      localStorage.removeItem('redirectAfterLogin');
      setLocation(redirectPath);
    }
  }, [setLocation]);
}
