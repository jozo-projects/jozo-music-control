import React, { type ReactNode } from "react";

type FooterProps = {
  children: ReactNode;
};

/** Chân layout: padding tối thiểu cho tablet, nội dung (ControlBar) gọn bên trong */
const Footer: React.FC<FooterProps> = ({ children }) => {
  return (
    <footer className="shrink-0 px-2 pb-1.5 pt-0.5">{children}</footer>
  );
};

export default Footer;
