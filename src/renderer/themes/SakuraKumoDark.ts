const themeOptions = {
    palette: {
        mode: "dark",
        primary: {
            main: "#ffb6d4"
        },
        secondary: {
            main: "#ffefb4"
        }
    },
    typography: {
        fontFamily: "Noto Sans SC"
    },
    components: {
        MuiButtonBase: {
            defaultProps: {
                disableRipple: true
            }
        }
    }
};

export default themeOptions;