import { ThemeOptions } from '@mui/material/styles';

const themeOptions: ThemeOptions = {
    palette: {
        mode: 'dark',
        primary: {
            main: '#ffb6d4'
        },
        secondary: {
            main: '#ffefb4'
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