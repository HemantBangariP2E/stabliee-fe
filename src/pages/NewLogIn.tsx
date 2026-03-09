import { useEffect } from "react";

const WIDGET_CONTAINER_ID = "kalp-wallet-container";
const WIDGET_API_KEY = "f44815a23b3363a00aa5fa6b3c8520f405ada4e60d7279749a1fd25a21a41c77";
const REDIRECT_URL = "/dashboard";


declare global {
  interface Window {
    renderMyWidget: (
      containerId: string,
      widgetApiKey: string,
      redirectUrl: string
    ) => void;
  }
}

const Login = () => {

  useEffect(() => {

    const waitForWidget = () => {

      const container = document.getElementById(WIDGET_CONTAINER_ID);

      if (container && window.renderMyWidget) {

        console.log("Rendering Kalp widget");

        window.renderMyWidget(
          WIDGET_CONTAINER_ID,
          WIDGET_API_KEY,
          REDIRECT_URL
        );

      } else {

        setTimeout(waitForWidget, 300);

      }

    };

    waitForWidget();

  }, []);

  return <div id={WIDGET_CONTAINER_ID}></div>;
};

export default Login;