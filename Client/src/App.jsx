import React from "react";
import {BrowserRouter as Router, Route, redirect, Routes, useSearchParams} from 'react-router-dom';
import Game from './Game/Game.jsx';
import Login from './Login/Login.jsx';
import LoggedIn from "./Login/LoggedIn.jsx";

const LoginWrapper = () => {
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
        console.log("No access token")
        return <Login />;
    }
    else {
        console.log("access token")
        return <LoggedIn />;
    }
};

const App = () => {
  return (
      <Router>
        <Routes>
            <Route path="/" element={<LoginWrapper/>} />
            <Route path="/login" element={<LoginWrapper/>} />
            <Route path="/game" element={<Game />} />
        </Routes>
      </Router>
  );
};

export default App;
