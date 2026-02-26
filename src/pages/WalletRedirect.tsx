import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const WalletRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);

    // TODO: adjust keys to whatever the widget actually sends
    const userIdentifier = params.get("userIdentifier") || "";
    const ownerAddress = params.get("ownerAddress") || "";
    const name = params.get("name") || "User";

    navigate("/dashboard", {
      state: {
        userIdentifier,
        ownerAddress,
        name,
      },
      replace: true,
    });
  }, [location.search, navigate]);

  return <div>Redirecting to your dashboard...</div>;
};

export default WalletRedirect;