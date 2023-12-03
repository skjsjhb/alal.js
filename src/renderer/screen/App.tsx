import { Locale } from "@/modules/i18n/Locale";
import { AppRoutes } from "@/renderer/screen/AppRoutes";
import "@/renderer/themes/theme.css";
import { Board } from "@/renderer/widgets/Board";
import { MenuBar } from "@/renderer/widgets/MenuBar";
import { VersionFooter } from "@/renderer/widgets/VersionFooter";
import { css } from "@emotion/react";
import "primeflex/primeflex.css";
import "primeicons/primeicons.css";
import { PrimeReactProvider } from "primereact/api";
import { Card } from "primereact/card";
import React from "react";
import { HashRouter } from "react-router-dom";

const cjkIconCorrectionList = ["zh-CN"];

export function App(): React.ReactElement {
    const appCardStyle = css`
      position: fixed;
      left: 8em;
      right: 3em;
      top: 3em;
      bottom: 3em;

      & .p-card-body, & .p-card-content {
        height: 100%;
      }
    `;

    const needCJKIconCorrection = cjkIconCorrectionList.includes(Locale.getLocale());

    return (
        <PrimeReactProvider>
            <Board colorMode={"dark"}/>
            <MenuBar/>
            <Card css={appCardStyle} className={needCJKIconCorrection ? "cjk-icon-correction" : ""}>
                <HashRouter>
                    <AppRoutes/>
                </HashRouter>
                <VersionFooter/>
            </Card>
        </PrimeReactProvider>
    );
}