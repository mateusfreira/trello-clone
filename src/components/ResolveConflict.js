import React from "react";
import { connect } from "react-redux";
import "../styles/EditButtons.css";

const ResolveConflict = ({ resolution, dispatch }) => {
  const handleSeeV1 = ()=> {
    resolution.conflictResolver.finalState = resolution.conflictResolver.conflict.values.at(0).value;
    resolution.conflictResolver.finalState.resolution.conflicted = true;
    dispatch({
      type: 'newState',
      state: resolution.conflictResolver.finalState
    });
  };
  const handleSeeV2 = ()=>{
    resolution.conflictResolver.finalState = resolution.conflictResolver.conflict.values.at(1).value;
    resolution.conflictResolver.finalState.resolution.conflicted = true;
    dispatch({
      type: 'newState',
      state: resolution.conflictResolver.finalState
    });
  };
  const handleChoose = ()=> {
    if(resolution.conflictResolver.finalState) {
      resolution.conflictResolver.finalState.resolution.conflicted = false;
      dispatch({
        type: "conflictReolutionResolved",
        id: new Date().getTime(),
        conflictId: resolution.conflictResolver.conflictId,
        value: resolution.conflictResolver.finalState
      });
    } else {
      alert("Chose a version!");
    }
  };
  if (!resolution.conflicted) {
    return <span></span>
  } else {
    return (
        <span>
            <h2> A Conflict has happened! Please chose one version!</h2><br/>
          <div className="Edit-Buttons">
            <div
              tabIndex="0"
              className="Edit-Button"
              style={{ backgroundColor: "#5aac44" }}
              onClick={handleSeeV1}
            >
              See V1
            </div>
            <div
                tabIndex="0"
                className="Edit-Button"
                style={{ backgroundColor: "#EA2525", marginLeft: 0 }}
                onClick={handleSeeV2}
              >
                See V2
            </div>

          </div>
          <div
              tabIndex="0"
              className="Edit-Button"
              style={{ backgroundColor: "orange", floating: "left" }}
              onClick={handleChoose}
            >
              Done!
            </div>
        </span>
      );
  }
};
const mapStateToProps = state => {
  return ({ board: state.board, resolution: state.resolution });
}

export default connect(mapStateToProps)(ResolveConflict);
