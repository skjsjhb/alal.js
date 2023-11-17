import { ThemeOptions } from '@mui/material/styles';

const themeOptions: ThemeOptions = {
    palette: {
        mode: 'light',
        primary: {
            main: '#f99bc2'
        },
        secondary: {
            main: '#fff5ce'
        }
    },
    typography: {
        fontFamily: 'Noto Sans SC'
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