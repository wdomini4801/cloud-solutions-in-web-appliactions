import React from "react";
import {BrowserRouter as Router, Route, redirect, Routes} from 'react-router-dom';
import Game from './Game.jsx';
import Login from './Login.jsx';

const App = () => {
  return (
      <Router>
        <Routes>
            <Route path="/login" element={<Login/>} />
            <Route path="/game" element={<Game/>} />
        </Routes>
      </Router>
  );
};
export default App;
