import "../styles/App.css";

import React, { Component } from "react";
import Board from "./Board";
import ResolveConflict from "./ResolveConflict";

class App extends Component {
  render() {
    return (
      <div className="App">
        <div className="Header">React Trello Clone</div>
        <ResolveConflict/>
        <Board />
      </div>
    );
  }
}

export default App;
