import { Portal } from "@/renderer/screen/intro/Portal";
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

    const animationTimeout = 200;

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

    return <span css={appTransitions}>
        <div className={classNames(transitionStage, "h-full p-0")}>
            <Routes location={displayLocation}>
                <Route index element={<Navigate to={"/Intro/Portal"} replace/>}/>
                <Route path={"/Intro/Portal"} element={<Portal/>}/>
                <Route path={"/Intro/WelcomeToAlicornAgain"} element={<WelcomeToAlicornAgain/>}/>
            </Routes>
        </div>
    </span>;
}