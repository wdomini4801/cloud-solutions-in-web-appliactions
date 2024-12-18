import React from "react";
import {BrowserRouter as Router, Route, Routes} from 'react-router-dom';
import Game from './Game/Game.jsx';
import Login from './Login/Login.jsx';
import Results from "./Game/Results.jsx";

const LoginWrapper = () => {
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
        return <Login />;
    }
    else {
        return <Game />;
    }
};

const App = () => {
  return (
      <Router>
        <Routes>
            <Route path="/" element={<LoginWrapper/>} />
            <Route path="/login" element={<LoginWrapper/>} />
            <Route path="/game" element={<Game />} />
            <Route path="/results" element={<Results />} />
        </Routes>
      </Router>
  );
};

export default App;
