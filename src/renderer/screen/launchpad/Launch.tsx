import { Account } from '@/modules/auth/Account';
import { activateAccount } from '@/modules/auth/AccountTools';
import { getContainer } from '@/modules/container/ContainerManager';
import { getLocaleSection } from '@/modules/i18n/Locale';
import { launch } from '@/modules/launch/Launcher';
import { getProfileLoader, isMojangProfile } from '@/modules/profile/ProfileDetector';
import { loadProfile } from '@/modules/profile/ProfileTools';
import { VersionProfile } from '@/modules/profile/VersionProfile';
import { useAsyncEffect, useState } from '@/renderer/util/Hooks';
import { AccountSelector } from '@/renderer/widgets/AccountSelector';
import { CenterSpinner } from '@/renderer/widgets/CenterSpinner';
import { ProfileImage } from '@/renderer/widgets/ProfileImage';
import { TipText } from '@/renderer/widgets/TipText';
import { css } from '@emotion/react';
import { ProgressSpinner } from 'primereact/progressspinner';
import React from 'react';
import { useParams } from 'react-router-dom';

/**
 * The main launch page.
 */
export function Launch(): React.ReactElement {
    const { container: containerId, profile: profileId } = useParams<{ container: string; profile: string }>();
    if (!containerId || !profileId) {
        throw 'Invalid route params. Container ID and profile ID are mandatory.';
    }

    const [profile, setProfile] = useState<VersionProfile | null>(null);
    const [account, setAccount] = useState<Account | null>(null);
    const [startLaunch, setStartLaunch] = useState<boolean>(false);

    useAsyncEffect(async () => {
        if (startLaunch && account) {
            console.log('Loading profile ' + profileId + ' at ' + containerId);
            const c = getContainer(containerId);
            if (!c) {
                throw 'Unable to find container: ' + containerId;
            }
            const prof = await loadProfile(c, profileId);
            if (!prof) {
                throw 'Unable to load profile: ' + profileId;
            }
            console.log('Profile loaded: ' + profileId);
            setProfile(prof);

            const authedAccount = await activateAccount(account); // TODO catch errors
            await launch(c, profileId, authedAccount);
        }
    }, [startLaunch]);

    const tr = getLocaleSection('launch');
    let iconType: string = 'Unknown';
    if (profile != null) {
        iconType = isMojangProfile(profile) ? 'Mojang' : getProfileLoader(profile) || 'Unknown';
    }
    const spinnerStyles = css`
        width: 3rem;
        height: 3rem;
    `;

    const iconStyles = css`
        height: 6rem;
    `;

    return (
        <div className={'flex flex-column justify-content-center h-full'}>
            <AccountSelector
                open={!startLaunch}
                onSelect={(a) => {
                    setAccount(a);
                    setStartLaunch(true);
                }}
            />
            {profile == null ? (
                <CenterSpinner />
            ) : (
                <div className={'ml-4 mr-4 text-center'}>
                    <div className={'flex justify-content-center align-items-center mt-4'} css={iconStyles}>
                        <ProfileImage css={iconStyles} profileType={iconType} />
                    </div>

                    <div className={'text-3xl font-bold mt-4'}>
                        {tr('title', {
                            profile: profileId
                        })}
                    </div>

                    <div className={'flex justify-content-center text-primary mt-5'}>
                        <ProgressSpinner css={spinnerStyles} strokeWidth={'5'} />
                    </div>

                    <div className={'mt-4 text-color-secondary'}>
                        <i>
                            <TipText />
                        </i>
                    </div>
                </div>
            )}
        </div>
    );
}
