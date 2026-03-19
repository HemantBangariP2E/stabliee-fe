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
       
        "cce4c35335c02307321678e3a8374bd2cf477a188850d253ace283690a827919",
        "/dashboard"
      );
    }
  }, []);

  return <div id="kalp-wallet-container"></div>;
};

export default Login;