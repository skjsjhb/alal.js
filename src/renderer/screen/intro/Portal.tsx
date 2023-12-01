import { Locale } from "@/modules/i18n/Locale";
import { css } from "@emotion/react";
import React from "react";
import { useNavigate } from "react-router-dom";

/**
 * Portal with a title and subtitle.
 */
export function Portal(): React.ReactElement {
    const blinkClazz = css`
      @keyframes blink {
        0% {
          opacity: 0;
        }
        50% {
          opacity: 1;
        }
        100% {
          opacity: 0;
        }
      }
      animation: blink 3s infinite;
    `;
    const nav = useNavigate();
    const tr = Locale.getSection("portal");
    return <div className={"flex flex-column justify-content-center h-full mb-8"}>
        <div className={"flex justify-content-center text-primary"}>
            <div className={"text-6xl"}>{tr("title")}</div>
        </div>
        <div className={"flex justify-content-center mt-4 text-color-secondary cursor-pointer"}>
            <div css={blinkClazz} className={"text-lg"} onClick={() => nav("/Intro/WelcomeToAlicornAgain")}>
                {tr("start")}
            </div>
        </div>
    </div>;
}