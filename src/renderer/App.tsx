import { getLocale } from '@/modules/i18n/Locale';
import { AppRoutes } from '@/renderer/screen/AppRoutes';
import { setDefaultColorMode } from '@/renderer/themes/ThemeManager';
import { Board } from '@/renderer/widgets/Board';
import { VersionFooter } from '@/renderer/widgets/VersionFooter';
import { css } from '@emotion/react';
import primeicons from 'primeicons/primeicons.css';
import { PrimeReactProvider } from 'primereact/api';
import { Card } from 'primereact/card';
import React, { useEffect } from 'react';
import { HashRouter } from 'react-router-dom';

const cjkIconCorrectionList = ['zh-CN'];

export function App(): React.ReactElement {
    const appCardStyle = css`
        position: fixed;
        left: 2em;
        right: 2em;
        top: 2em;
        bottom: 2em;
        opacity: 0.9;

        & .p-card-body,
        & .p-card-content {
            height: 100%;
        }

        & > .p-card-body {
            padding: 1rem !important;
        }

        & > .p-card-body > .p-card-content {
            padding-top: 0.5rem !important;
            padding-left: 0 !important;
        }

        & code {
            font-family: 'JetBrains Mono', monospace;
        }
    `;

    useEffect(() => {
        void setDefaultColorMode();
        primeicons.use();
        return () => {
            primeicons.unuse();
        };
    }, []);

    const needCJKIconCorrection = cjkIconCorrectionList.includes(getLocale());

    return (
        <PrimeReactProvider>
            <Board />
            <HashRouter>
                <Card css={appCardStyle} className={needCJKIconCorrection ? 'cjk-icon-correction' : ''}>
                    <AppRoutes />
                </Card>
            </HashRouter>
            <VersionFooter />
        </PrimeReactProvider>
    );
}
