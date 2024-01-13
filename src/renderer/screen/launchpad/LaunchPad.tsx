import { getContainerList } from '@/modules/container/ContainerManager';
import { getLocaleSection } from '@/modules/i18n/Locale';
import { getProfileLoader } from '@/modules/profile/ProfileDetector';
import { VersionProfile } from '@/modules/profile/VersionProfile';
import { useAsyncEffect, useState } from '@/renderer/util/Hooks';
import { CenterSpinner } from '@/renderer/widgets/CenterSpinner';
import { ProfileImage } from '@/renderer/widgets/ProfileImage';
import { css } from '@emotion/react';
import { DataView } from 'primereact/dataview';
import React from 'react';

/**
 * Display game versions found for launching.
 */
export function LaunchPad(): React.ReactElement {
    return (
        <div
            className={'flex ml-5 mr-5 mt-2 gap-3 absolute h-full'}
            style={{
                inset: '1rem'
            }}
        >
            <div className={'col-8'}>
                <ProfileDisplay />
            </div>
            <div className={'col-4'}>
                <ActionsDisplay />
            </div>
        </div>
    );
}

interface DisplayProfile {
    container: string; // Container path
    profile: VersionProfile;
}

function ActionsDisplay(): React.ReactElement {
    const tr = getLocaleSection('launchpad');
    return (
        <>
            <div className={'text-4xl ml-3'}>{tr('actions.title')}</div>
        </>
    );
}

function ProfileDisplay(): React.ReactElement {
    const [profiles, setProfiles] = useState<DisplayProfile[] | null>(null);
    const tr = getLocaleSection('launchpad');

    useAsyncEffect(async () => {
        const pf: DisplayProfile[] = [];
        for (const c of getContainerList()) {
            for (const f of await c.scanProfiles()) {
                pf.push({ container: c.rootDir, profile: f });
            }
        }
        setProfiles(pf);
    }, []);

    if (profiles == null) {
        return <CenterSpinner />;
    }

    const itemStyles = css`
        &:hover {
            background: color-mix(in srgb, var(--primary-color) 40%, transparent);
        }

        &:active {
            background: color-mix(in srgb, var(--primary-color) 60%, transparent);
        }

        & {
            transition: 200ms;
            border-radius: 5px;
            cursor: pointer;
            border: none !important;
        }
    `;

    const itemTemplate = (p: DisplayProfile) => (
        <div css={itemStyles} className={'launchpad-profile flex align-items-center col-12 mt-2 gap-3 h-4rem'}>
            <div className={'ml-2'}>
                <ProfileImage profileType={'Mojang'} style={{ height: '3rem', marginTop: '10%' }} />
            </div>
            <div className={'flex-1'}>
                <div className={'flex flex-column justify-content-center'}>
                    <div className={'text-xl font-bold'}>{p.profile.id + ' ' + getProfileLoader(p.profile)}</div>
                    <div className={'p-text-secondary text-base'}>
                        <code> {p.profile.origin || p.profile.id}</code>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className={'flex flex-column'} style={{ maxHeight: '90%' }}>
            <div className={'text-4xl ml-2'}>{tr('profiles.title')}</div>
            <div className={'overflow-y-scroll mt-2'}>
                <DataView className={'flex-1 mt-3 mr-2'} rows={5} value={profiles} itemTemplate={itemTemplate} />
            </div>
        </div>
    );
}
