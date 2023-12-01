import { css } from "@emotion/react";
import { Dock } from "primereact/dock";
import { MenuItem } from "primereact/menuitem";
import React from "react";

/**
 * Displays a bar of icons on the left.
 */
export function MenuBar(): React.ReactElement {
    const style = css`
      & .p-dock-container, & .p-dock-list {
        border-radius: 0 6px 6px 0;
        background-color: var(--surface-ground);
        opacity: 80%
      }

      .p-dock, .p-dock-action {
        width: 3rem;
        height: 3rem;
      }

      .pi:before {
        font-size: 1.5rem;
      }

      a {
        text-decoration: none;
      }
    `;

    const model: MenuItem[] = [];

    return <Dock css={style} model={model} position={"left"} magnification={false}/>;
}