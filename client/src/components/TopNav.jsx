import React from "react";
import { TbArrowsDiagonalMinimize2 } from "react-icons/tb";
import "./TopNav.css";

const TopNav = ({ isMini, setIsMini }) => {
  const toggleMini = () => {
    setIsMini(prev => !prev);
  };

  return (
    <div className={`topnav ${isMini ? "mini" : ""}`}>
      <div className="topnav-inner">
        <div className="title">Video Call</div>
        <div className="min-btn"  onClick={() => setIsMini(prev => !prev)}>
          <TbArrowsDiagonalMinimize2 />
        </div>
           
      </div>
       <div className="divider" />
    </div>
  );
};

export default TopNav;