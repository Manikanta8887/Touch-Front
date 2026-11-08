import { theme } from "antd";

export const antThemeConfig = {
  algorithm: theme.defaultAlgorithm,
  token: {
    colorPrimary: "#A34BD0",
    colorSecondary: "#AD49E1",
    colorBgBase: "#F0F2F5",
    colorBgContainer: "#FFFFFF",
    colorBorder: "#D9D9D9",
    colorText: "#6B7280",
    colorTextHeading: "#2D0A45",
    borderRadius: 12,
    fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  components: {
    Card: {
      colorBgContainer: "#FFFFFF",
      colorBorderSecondary: "#D9D9D9",
      borderRadiusLG: 16,
    },
    Button: {
      borderRadius: 12,
      fontWeight: 600,
    },
    Input: {
      colorBgContainer: "#FFFFFF",
      colorBorder: "#D9D9D9",
      borderRadius: 12,
    },
    Modal: {
      borderRadiusLG: 20,
    },
  },
};

export default antThemeConfig;
