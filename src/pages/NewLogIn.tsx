import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    renderMyWidget: (
      containerId: string,
      widgetApiKey: string, // your auth API key
      redirectUrl: string // URL on which the app should be redirected after login
    ) => void;
  }
}

const WIDGET_SCRIPT_SRC = "https://qa-kalp-embedded-wallet.p2eppl.com/my-widget.js";
const WIDGET_CONTAINER_ID = "kalp-wallet-container";
const WIDGET_API_KEY = "cce4c35335c02307321678e3a8374bd2cf477a188850d253ace283690a827919";
const REDIRECT_URL = "/dashboard";

const renderWidget = () => {
  if (typeof window.renderMyWidget === "function") {
    window.renderMyWidget(WIDGET_CONTAINER_ID, WIDGET_API_KEY, REDIRECT_URL);
  }
};

const Login = () => {
  const scriptLoaded = useRef(false);

  useEffect(() => {
    if (scriptLoaded.current) return;
    scriptLoaded.current = true;

    const scriptAlreadyInPage = document.querySelector(`script[src="${WIDGET_SCRIPT_SRC}"]`);

    if (scriptAlreadyInPage) {
      // Script already loaded (e.g. by App or from previous visit) – ensure widget renders into this page's container
      if (typeof window.renderMyWidget === "function") {
        renderWidget();
      } else {
        scriptAlreadyInPage.addEventListener("load", renderWidget);
        return () => scriptAlreadyInPage.removeEventListener("load", renderWidget);
      }
      return;
    }

    const script = document.createElement("script");
    script.src = WIDGET_SCRIPT_SRC;
    script.async = true;
    script.onload = renderWidget;
    document.body.appendChild(script);

    return () => {
      script.remove();
    };
  }, []);

  return <div id={WIDGET_CONTAINER_ID} />;
};

export default Login;