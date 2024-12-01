import React from "react";
import {BrowserRouter as Router, Route, redirect, Routes} from 'react-router-dom';
import Game from './Game';

const App = () => {
  return (
      <Router>
        <Routes>
          <Route path="/game" element={<Game />} />
        </Routes>
      </Router>
  );
};
export default App;
