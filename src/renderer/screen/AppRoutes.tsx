import { About } from '@/renderer/screen/About';
import { AcceptMirrors } from '@/renderer/screen/intro/AcceptMirrors';
import { AddAccount } from '@/renderer/screen/intro/AddAccount';
import { AddContainer } from '@/renderer/screen/intro/AddContainer';
import { Portal } from '@/renderer/screen/intro/Portal';
import { PostSetup } from '@/renderer/screen/intro/PostSetup';
import { SelectMode } from '@/renderer/screen/intro/SelectMode';
import { SelectTheme } from '@/renderer/screen/intro/SelectTheme';
import { WelcomeToAlicornAgain } from '@/renderer/screen/intro/WelcomeToAlicornAgain';
import { LaunchPad } from '@/renderer/screen/launchpad/LaunchPad';
import { Options } from '@/renderer/screen/options/Options';
import { TaskList } from '@/renderer/screen/TaskList';
import { useSafeState } from '@/renderer/util/Hooks';
import { css } from '@emotion/react';
import { classNames } from 'primereact/utils';
import React, { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';

/**
 * The main routing module for UI.
 */
export function AppRoutes(): React.ReactElement {
    const routeLocation = useLocation();
    const [displayLocation, setDisplayLocation] = useSafeState(routeLocation);
    const [transitionStage, setTransitionStage] = useSafeState<'fadeIn' | 'fadeOut'>('fadeIn');

    const animationTimeout = 190;

    useEffect(() => {
        let t: any;
        if (routeLocation !== displayLocation) {
            setTransitionStage('fadeOut');
            t = setTimeout(() => {
                setTransitionStage('fadeIn');
                setDisplayLocation(routeLocation);
            }, animationTimeout);
        }
        return () => {
            clearTimeout(t);
        };
    }, [routeLocation, displayLocation]);

    const appTransitions = css`
        @keyframes enter {
            from {
                opacity: 0;
                transform: translateX(10%);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }

        @keyframes leave {
            from {
                opacity: 1;
                transform: translateX(0);
            }
            to {
                opacity: 0;
                transform: translateX(-10%);
            }
        }

        & .fadeIn {
            animation: enter 200ms;
        }

        & .fadeOut {
            animation: leave 200ms;
        }
    `;

    const startPage = '/Intro/Portal'; // TODO test code
    // const startPage = opt().ui.playIntro ? "/Intro/Portal" : "/TaskList";

    return (
        <span css={appTransitions} className={'h-full p-0 m-0'}>
            <div className={classNames(transitionStage, 'h-full p-0 m-0 overflow-y-auto')}>
                <Routes location={displayLocation}>
                    {/* Intro setup */}
                    <Route index element={<Navigate to={startPage} replace />} />
                    <Route path={'/Intro/Portal'} element={<Portal />} />
                    <Route path={'/Intro/WelcomeToAlicornAgain'} element={<WelcomeToAlicornAgain />} />
                    <Route path={'/Intro/SelectMode'} element={<SelectMode />} />
                    <Route path={'/Intro/AcceptMirrors'} element={<AcceptMirrors />} />
                    <Route path={'/Intro/SelectTheme'} element={<SelectTheme />} />
                    <Route path={'/Intro/AddAccount'} element={<AddAccount />} />
                    <Route path={'/Intro/AddContainer'} element={<AddContainer />} />
                    <Route path={'/Intro/PostSetup'} element={<PostSetup />} />

                    {/* System pages */}
                    <Route path={'/TaskList'} element={<TaskList />} />
                    <Route path={'/Options'} element={<Options />} />
                    <Route path={'/About'} element={<About />} />
                    <Route path={'/LaunchPad'} element={<LaunchPad />} />
                </Routes>
            </div>
        </span>
    );
}
