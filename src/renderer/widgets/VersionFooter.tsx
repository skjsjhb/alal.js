import { Typography } from "@mui/material";
import React from "react";
import pkg from "../../../package.json";

export function VersionFooter(): React.ReactElement {
    return <Typography
        sx={{
            pointerEvents: "none",
            position: "fixed",
            right: 2,
            bottom: 2
        }}
        color={"primary"}
    >
        {"Alicorn Again " + pkg.appVersion + " #" + pkg.updatorVersion}
    </Typography>;
}