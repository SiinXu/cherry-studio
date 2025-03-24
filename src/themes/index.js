import { createTheme } from 'react-bits';

// Cherry Studio 品牌色彩
const colors = {
  primary: {
    main: '#4a86e8',
    light: '#6b9cec',
    dark: '#3266c0',
    contrastText: '#ffffff'
  },
  secondary: {
    main: '#f5a623',
    light: '#f7b84d',
    dark: '#d18a1e',
    contrastText: '#ffffff'
  },
  success: {
    main: '#00c853',
    light: '#33d375',
    dark: '#00a046',
    contrastText: '#ffffff'
  },
  error: {
    main: '#ff3b30',
    light: '#ff6259',
    dark: '#cc2f27',
    contrastText: '#ffffff'
  },
  warning: {
    main: '#ffcc00',
    light: '#ffd633',
    dark: '#cca300',
    contrastText: '#000000'
  },
  info: {
    main: '#0088cc',
    light: '#33a0d6',
    dark: '#006da3',
    contrastText: '#ffffff'
  },
  grey: {
    50: '#f8f9fa',
    100: '#e9ecef',
    200: '#dee2e6',
    300: '#ced4da',
    400: '#adb5bd',
    500: '#6c757d',
    600: '#495057',
    700: '#343a40',
    800: '#212529',
    900: '#000000'
  }
};

// 创建主题
const theme = createTheme({
  palette: {
    ...colors,
    background: {
      default: '#f8f9fa',
      paper: '#ffffff'
    },
    text: {
      primary: colors.grey[800],
      secondary: colors.grey[600],
      disabled: colors.grey[400]
    }
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
      lineHeight: 1.2
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.3
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.4
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5
    },
    button: {
      fontSize: '0.875rem',
      fontWeight: 500,
      textTransform: 'none'
    }
  },
  shape: {
    borderRadius: 8
  },
  shadows: [
    'none',
    '0px 2px 4px rgba(0, 0, 0, 0.05)',
    '0px 4px 8px rgba(0, 0, 0, 0.05)',
    '0px 8px 16px rgba(0, 0, 0, 0.05)',
    '0px 16px 24px rgba(0, 0, 0, 0.05)',
    '0px 24px 32px rgba(0, 0, 0, 0.05)'
  ],
  transitions: {
    duration: {
      shortest: 150,
      shorter: 200,
      short: 250,
      standard: 300,
      complex: 375,
      enteringScreen: 225,
      leavingScreen: 195
    }
  },
  components: {
    // 组件特定的样式覆盖
    Button: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)'
          }
        }
      }
    },
    Input: {
      styleOverrides: {
        root: {
          transition: 'all 0.2s ease-in-out',
          '&:focus-within': {
            transform: 'translateY(-1px)'
          }
        }
      }
    },
    Modal: {
      styleOverrides: {
        paper: {
          boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.1)'
        }
      }
    }
  }
});

export default theme; 