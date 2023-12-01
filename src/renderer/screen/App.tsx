import { AppRoutes } from "@/renderer/screen/AppRoutes";
import "@/renderer/themes/theme.css";
import { Board } from "@/renderer/widgets/Board";
import { css } from "@emotion/react";
import "primeflex/primeflex.css";
import "primeicons/primeicons.css";
import { PrimeReactProvider } from "primereact/api";
import { Card } from "primereact/card";
import React, { CSSProperties } from "react";
import { HashRouter } from "react-router-dom";

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

    const menuCardStyle: CSSProperties = {
        position: "fixed",
        left: 0, width: "5em", top: "1em", bottom: "1em",
        borderRadius: "0 6px 6px 0",
        opacity: "80%"
    };

    return (
        <PrimeReactProvider>
            <Board colorMode={"dark"}/>
            <Card style={menuCardStyle}></Card>
            <Card css={appCardStyle}>
                <HashRouter>
                    <AppRoutes/>
                </HashRouter>
            </Card>
        </PrimeReactProvider>
    );
}