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

const Login = () => {
  const scriptLoaded = useRef(false);

  useEffect(() => {
    if (scriptLoaded.current) return;
    scriptLoaded.current = true;

    if (document.querySelector('script[src="http://localhost:3001/my-widget.js"]')) {
      return;
    }

    const script = document.createElement("script");
    script.src = "http://localhost:3001/my-widget.js";
    script.async = true;
    script.onload = () => {
      if (window.renderMyWidget) {
        console.log("Rendering Widget");
        window.renderMyWidget(
          "kalp-wallet-container",
          "8bfcfa2aa2d525b1ba196c6f553cda6146a73df68fd59bc3ec6ad368ab7e7237", // API key
          "/dashboard" // Replace with your redirect URL
        );
      } else {
        console.error("SDK not loaded yet");
      }
    };
    document.body.appendChild(script);

    return () => {
      script.remove();
    };
  }, []);

  return (
    <div id='kalp-wallet-container'></div>
  );
};

export default Login;