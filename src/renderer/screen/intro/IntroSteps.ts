import { useNavigate } from 'react-router-dom';

const steps = [
    'Portal',
    'WelcomeToAlicornAgain',
    'SelectMode',
    'SelectTheme',
    'AddAccount',
    'AcceptMirrors',
    'AddContainer',
    'PostSetup'
];

/**
 * Wrapped `useNavigate()` method for intros.
 */
export function useIntroNav(now: string) {
    const nav = useNavigate();
    return () => {
        nav('/Intro/' + getNextIntroPage(now));
    };
}

function getNextIntroPage(now: string): string {
    return steps[steps.indexOf(now) + 1];
}
