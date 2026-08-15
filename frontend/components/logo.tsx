import Image from "next/image";
import logo from "@/assets/logo-icon.png";

export const Logo = () => (
  <div className="flex items-center gap-3">
    <Image src={logo} alt="Promptify" width={28} height={28} className="object-contain" />
    <span className="font-semibold text-base tracking-tight">Promptify</span>
  </div>
);
