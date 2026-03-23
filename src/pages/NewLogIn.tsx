import { useEffect } from "react";

declare global {
  interface Window {
    renderMyWidget?: (
      containerId: string,
      widgetApiKey: string,
      redirectUrl: string
    ) => void;
  }
}

const Login = () => {
  useEffect(() => {
    const container = document.getElementById("kalp-wallet-container");

    if (!container) return;

    // prevent duplicate widget
    if (container.childNodes.length > 0) return;

    if (window.renderMyWidget) {
      window.renderMyWidget(
        "kalp-wallet-container",
       
        "d4d3f472f87499f50b6dfc537c00ca223d03f089b8afd4879c701cc5231a25a3",
        "/dashboard"
      );
    }
  }, []);

  return <div id="kalp-wallet-container"></div>;
};

export default Login;