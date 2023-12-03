import { Locale } from "@/modules/i18n/Locale";
import { ThemeManager } from "@/renderer/themes/ThemeManager";
import { Button } from "primereact/button";
import { SelectButton } from "primereact/selectbutton";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export function SelectTheme(): React.ReactElement {
    const tr = Locale.getSection("select-theme");

    const colorNameDark = tr("choices.dark");
    const colorNameLight = tr("choices.light");

    const [colorMode, setColorMode] = useState(ThemeManager.getColorMode() == "dark" ? colorNameDark : colorNameLight);
    const nav = useNavigate();

    useEffect(() => {
        ThemeManager.applyColorMode(colorMode == colorNameDark ? "dark" : "light");
    }, [colorMode]);

    return <div className={"ml-4 mr-4"}>
        <div className={"text-5xl font-bold"}>{tr("title")}</div>
        <p dangerouslySetInnerHTML={{__html: tr("body")}}/>

        {/* Select Button */}
        <div className="card flex justify-content-center">
            <SelectButton value={colorMode}
                          onChange={(e) => setColorMode(e.value)}
                          options={[colorNameDark, colorNameLight]}/>
        </div>

        {/* Hint */}
        <p className={"text-color-secondary flex align-items-center"}>
            <i className={"pi pi-info-circle mr-2"}/>
            {tr("hint")}
        </p>

        {/* Next page */}
        <div className={"flex justify-content-end mt-5"}>
            <Button icon={"pi pi-arrow-right"} label={tr("next")}
                    onClick={() => nav("") /* TODO */}
            />
        </div>
    </div>;
}