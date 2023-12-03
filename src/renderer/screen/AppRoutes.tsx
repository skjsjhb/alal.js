import { Options } from "@/modules/data/Options";
import { AcceptMirrors } from "@/renderer/screen/intro/AcceptMirrors";
import { AddDefaultContainer } from "@/renderer/screen/intro/AddDefaultContainer";
import { Portal } from "@/renderer/screen/intro/Portal";
import { SelectMode } from "@/renderer/screen/intro/SelectMode";
import { SelectTheme } from "@/renderer/screen/intro/SelectTheme";
import { WelcomeToAlicornAgain } from "@/renderer/screen/intro/WelcomeToAlicornAgain";
import { css } from "@emotion/react";
import { classNames } from "primereact/utils";
import React, { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

/**
 * The main routing module for UI.
 */
export function AppRoutes(): React.ReactElement {
    const routeLocation = useLocation();
    const [displayLocation, setDisplayLocation] = useState(routeLocation);
    const [transitionStage, setTransitionStage] = useState<"fadeIn" | "fadeOut">("fadeIn");

    const animationTimeout = 190;

    useEffect(() => {
        let t: any;
        if (routeLocation !== displayLocation) {
            setTransitionStage("fadeOut");
            t = setTimeout(() => {
                setTransitionStage("fadeIn");
                setDisplayLocation(routeLocation);
            }, animationTimeout);
        }
        return () => {clearTimeout(t);};
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

    const startPage = Options.get().ui.playIntro ? "/Intro/Portal" : "/Home"; // TODO implement HOME

    return <span css={appTransitions}>
        <div className={classNames(transitionStage, "h-full p-0")}>
            <Routes location={displayLocation}>
                <Route index element={<Navigate to={startPage} replace/>}/>
                <Route path={"/Intro/Portal"} element={<Portal/>}/>
                <Route path={"/Intro/WelcomeToAlicornAgain"} element={<WelcomeToAlicornAgain/>}/>
                <Route path={"/Intro/SelectMode"} element={<SelectMode/>}/>
                <Route path={"/Intro/AcceptMirrors"} element={<AcceptMirrors/>}/>
                <Route path={"/Intro/SelectTheme"} element={<SelectTheme/>}/>
                <Route path={"/Intro/AddDefaultContainer"} element={<AddDefaultContainer/>}/>
            </Routes>
        </div>
    </span>;
}