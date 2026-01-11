import Image from "next/image";
import logo from "@/assets/logo.png"

export const Logo = () => (
  <div className="flex items-center justify-center gap-3">
    <Image src={logo} alt="promptify logo" height={30} width={30} />
    <h1 className="font-bold">Promptify</h1>
  </div>
);
