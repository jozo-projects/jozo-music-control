import React from "react";

interface SwitchProps {
  isChecked: boolean;
  onChange: () => void;
}

const Switch: React.FC<SwitchProps> = ({ isChecked, onChange }) => {
  return (
    <div
      className={`relative inline-block w-12 h-6 ${
        isChecked ? "bg-primary" : "bg-gray-400"
      } rounded-full cursor-pointer transition-colors`}
      onClick={onChange}
    >
      <div
        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
          isChecked ? "translate-x-6" : ""
        }`}
      ></div>
    </div>
  );
};

export default Switch;
