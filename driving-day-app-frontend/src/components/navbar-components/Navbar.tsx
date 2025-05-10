import React, {useContext} from "react";
import { Link } from "react-router-dom";
import logo from "../../assets/images/image.png";
import "./Navbar.css";
import AppDataContext from "../contexts/AppDataContext";
import { handleGoogleLogout } from "../../controllers/AuthController";

const Navbar = () => {

  const { currUserId, setCurrUserId } = useContext(AppDataContext);

  const performLogout = async () => {
    try{
      handleGoogleLogout();
      setCurrUserId(null);
    }
    catch(error){
      console.error(error);
    }
  }

  return (
    <div className="navbar-wrapper" style={{ backgroundColor: "#786C6C" }}>
      <div className="">
        <Link to="/">
          <img src={logo} alt="Logo" className="navbar-logo" />
        </Link>
      </div>
      <ul className="navbar-buttons">
        <li>
          <Link to="/home" className="navbar-link">
            Home
          </Link>
        </li>
        <li>
          <Link to="/upload-files" className="navbar-link">
            Upload Files
          </Link>
        </li>
        <li>
          <Link to="/run-data" className="navbar-link">
            Run Data
          </Link>
        </li>
        <li>
          <Link to="/drivers" className="navbar-link">
            Drivers
          </Link>
        </li>
        <li>
          <Link to="/issues" className="navbar-link">
            Issues
          </Link>
        </li>
        <li>
          <Link to="/my-account" className="navbar-link">
            My Account
          </Link>
        </li>
      </ul>
      {currUserId && 
      <div className="px-4 absolute bottom-4">
        <button
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          onClick={performLogout}
        >
          Logout
        </button>
      </div>     
      }
    </div>
  );
};

export default Navbar;
