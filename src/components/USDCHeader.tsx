import usdcLogo from "@/assets/usdc-logo.svg";

const USDCHeader = () => {
  return (
    <div className="flex items-center gap-2.5">
      <img src={usdcLogo} alt="USDC" className="w-8 h-8" />
      <div className="flex items-center gap-2">
        <span className="text-xl font-semibold text-foreground">USDC</span>
        <span className="text-muted-foreground">on</span>
        <span className="text-xl font-semibold text-[#0052FF]">Base</span>
      </div>
    </div>
  );
};

export default USDCHeader;