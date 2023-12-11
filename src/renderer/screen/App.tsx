import { Locale } from '@/modules/i18n/Locale';
import { AppRoutes } from '@/renderer/screen/AppRoutes';
import { ThemeManager } from '@/renderer/themes/ThemeManager';
import { Board } from '@/renderer/widgets/Board';
import { MenuBar } from '@/renderer/widgets/MenuBar';
import { VersionFooter } from '@/renderer/widgets/VersionFooter';
import { css } from '@emotion/react';
import primeflex from 'primeflex/primeflex.css';
import primeicons from 'primeicons/primeicons.css';
import { PrimeReactProvider } from 'primereact/api';
import { Card } from 'primereact/card';
import React, { useEffect } from 'react';
import { HashRouter } from 'react-router-dom';

const cjkIconCorrectionList = ['zh-CN'];

export function App(): React.ReactElement {
    const appCardStyle = css`
        position: fixed;
        left: 8em;
        right: 2em;
        top: 2.5em;
        bottom: 2.5em;

        & .p-card-body, & .p-card-content {
            height: 100%;
        }

        & > .p-card-body {
            padding: 1rem !important;
        }

        & > .p-card-body > .p-card-content {
            padding: 0 !important;
        }

        & code {
            font-family: "JetBrains Mono", monospace;
        }
    `;

    useEffect(() => {
        ThemeManager.setDefaultColorMode();
        primeflex.use();
        primeicons.use();
        return () => {
            primeflex.unuse();
            primeicons.unuse();
        };
    }, []);

    const needCJKIconCorrection = cjkIconCorrectionList.includes(Locale.getLocale());

    return (
        <PrimeReactProvider>
            <Board />
            <MenuBar />
            <Card css={appCardStyle} className={needCJKIconCorrection ? 'cjk-icon-correction' : ''}>
                <HashRouter>
                    <AppRoutes />
                </HashRouter>
                <VersionFooter />
            </Card>
        </PrimeReactProvider>
    );
}