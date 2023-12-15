import { opt } from '@/modules/data/Options';
import { useNavigate } from 'react-router-dom';

const steps = {
    easy: ['Portal', 'WelcomeToAlicornAgain', 'SelectMode', 'SelectTheme', 'AddAccount', 'PostSetup'],
    advanced: [
        'Portal',
        'WelcomeToAlicornAgain',
        'SelectMode',
        'SelectTheme',
        'AcceptMirrors',
        'AddAccount',
        'AddContainer',
        'SetupContainerSharing',
        'PostSetup'
    ]
};

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
    const host = opt().ui.easyMode ? steps.easy : steps.advanced;
    return host[host.indexOf(now) + 1];
}
