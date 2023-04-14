import {
    combineReducers,
    createStore
} from "redux";
import throttle from "lodash.throttle";
import seed from "./seed";
import NunDb from 'nun-db';

window.conflictResolver = {};
const nunDb = new NunDb("ws://nun-db-1.localhost:3058", "trelo-real-time-arbiter", "trelo-real-time-pwd");
window.nunDb = nunDb;
const resolveQueue = {
    lastConflict: Promise.resolve(),
    pendingConflicts: new Map(),
};
function resolveConflict(e) {
    const conflictId = +(new Date());
    return new Promise(resolve => {
        resolveQueue.pendingConflicts.set(conflictId, resolve);
        store.dispatch({
            type: 'CONFLICT_RESOLUTION',
            conflictResolver: {
                conflict: e,
                conflictId,
            }
        });
    });
}
nunDb.becameArbiter((e) => {
    resolveQueue.lastConflict = resolveQueue.lastConflict.then(v => {
        return resolveConflict(e);
    });
    return resolveQueue.lastConflict;
});

const resolution = (state = {
    conflicted: false
}, action) => {
    switch (action.type) {
        case "CONFLICT_RESOLUTION":
            {
                return {
                    conflicted: true,
                    conflictResolver: action.conflictResolver,
                };
            }
        case "CONFLICT_RESOLUTION_RESOLVED":
            {
                const peddingResolve = resolveQueue.pendingConflicts.get(action.conflictId);
                peddingResolve({
                    id: action.conflictId,
                    value: action.value 
                });
                return {
                    conflicted: false,
                    conflictResolver: null,
                };
            }
        case "UPDATE_STATE":
            {
                return {
                    ...action.state.resolution,
                    conflictResolver: state.conflictResolver,
                };
            }
        default:
            return state;
    }

};

const changed = (state = { changed: false }, action) => {
    switch (action.type) {
        case "UPDATE_STATE":
        case "CONFLICT_RESOLUTION":
        case "CONFLICT_RESOLUTION_RESOLVED":
            {
                return {
                    changed: false
                };
            }
        default:
            return {
                changed: true
            };
    }

};

const board = (state = {
    lists: []
}, action) => {
    switch (action.type) {
        case "UPDATE_STATE":
            {
                return action.state.board;
            }
        case "ADD_LIST":
            {
                const {
                    listId
                } = action.payload;
                return {
                    lists: [...state.lists, listId]
                };
            }
        case "MOVE_LIST":
            {
                const {
                    oldListIndex,
                    newListIndex
                } = action.payload;
                const newLists = Array.from(state.lists);
                const [removedList] = newLists.splice(oldListIndex, 1);
                newLists.splice(newListIndex, 0, removedList);
                return {
                    lists: newLists
                };
            }
        case "DELETE_LIST":
            {
                const {
                    listId
                } = action.payload;
                const filterDeleted = tmpListId => tmpListId !== listId;
                const newLists = state.lists.filter(filterDeleted);
                return {
                    lists: newLists
                };
            }
        default:
            return state;
    }
};

const listsById = (state = {}, action) => {
    switch (action.type) {
        case "UPDATE_STATE":
            {
                return action.state.listsById;
            }
        case "ADD_LIST":
            {
                const {
                    listId,
                    listTitle
                } = action.payload;
                return {
                    ...state,
                    [listId]: {
                        _id: listId,
                        title: listTitle,
                        cards: []
                    }
                };
            }
        case "CHANGE_LIST_TITLE":
            {
                const {
                    listId,
                    listTitle
                } = action.payload;
                return {
                    ...state,
                    [listId]: { ...state[listId],
                        title: listTitle
                    }
                };
            }
        case "DELETE_LIST":
            {
                const {
                    listId
                } = action.payload;
                const {
                    [listId]: deletedList, ...restOfLists
                } = state;
                return restOfLists;
            }
        case "ADD_CARD":
            {
                const {
                    listId,
                    cardId
                } = action.payload;
                return {
                    ...state,
                    [listId]: { ...state[listId],
                        cards: [...state[listId].cards, cardId]
                    }
                };
            }
        case "MOVE_CARD":
            {
                const {
                    oldCardIndex,
                    newCardIndex,
                    sourceListId,
                    destListId
                } = action.payload;
                // Move within the same list
                if (sourceListId === destListId) {
                    const newCards = Array.from(state[sourceListId].cards);
                    const [removedCard] = newCards.splice(oldCardIndex, 1);
                    newCards.splice(newCardIndex, 0, removedCard);
                    return {
                        ...state,
                        [sourceListId]: { ...state[sourceListId],
                            cards: newCards
                        }
                    };
                }
                // Move card from one list to another
                const sourceCards = Array.from(state[sourceListId].cards);
                const [removedCard] = sourceCards.splice(oldCardIndex, 1);
                const destinationCards = Array.from(state[destListId].cards);
                destinationCards.splice(newCardIndex, 0, removedCard);
                return {
                    ...state,
                    [sourceListId]: { ...state[sourceListId],
                        cards: sourceCards
                    },
                    [destListId]: { ...state[destListId],
                        cards: destinationCards
                    }
                };
            }
        case "DELETE_CARD":
            {
                const {
                    cardId: deletedCardId,
                    listId
                } = action.payload;
                const filterDeleted = cardId => cardId !== deletedCardId;
                return {
                    ...state,
                    [listId]: {
                        ...state[listId],
                        cards: state[listId].cards.filter(filterDeleted)
                    }
                };
            }
        default:
            return state;
    }
};

const cardsById = (state = {}, action) => {
    switch (action.type) {
        case "UPDATE_STATE":
            {
                return action.state.cardsById;
            }
        case "ADD_CARD":
            {
                const {
                    cardText,
                    cardId
                } = action.payload;
                return { ...state,
                    [cardId]: {
                        text: cardText,
                        _id: cardId
                    }
                };
            }
        case "CHANGE_CARD_TEXT":
            {
                const {
                    cardText,
                    cardId
                } = action.payload;
                return { ...state,
                    [cardId]: { ...state[cardId],
                        text: cardText
                    }
                };
            }
        case "DELETE_CARD":
            {
                const {
                    cardId
                } = action.payload;
                const {
                    [cardId]: deletedCard, ...restOfCards
                } = state;
                return restOfCards;
            }
            // Find every card from the deleted list and remove it
        case "DELETE_LIST":
            {
                const {
                    cards: cardIds
                } = action.payload;
                return Object.keys(state)
                    .filter(cardId => !cardIds.includes(cardId))
                    .reduce(
                        (newState, cardId) => ({ ...newState,
                            [cardId]: state[cardId]
                        }), {}
                    );
            }
        default:
            return state;
    }
};

const reducers = combineReducers({
    board,
    listsById,
    cardsById,
    changed,
    resolution,
});

const saveState = state => {
    try {
        //localStorage.setItem("state", serializedState);
        nunDb.setValueSafe("state", state);
    } catch {
        // ignore write errors
    }
};

const loadState = () => {
    try {
        nunDb.watch("state", e => {
            if (e.value) {
                e.value.resolution.conflicted = e.version === -2;
                store.dispatch({
                    type: 'UPDATE_STATE',
                    state: e.value
                });
            }
        }, true);
    } catch (err) {
        return undefined;
    }
};

const persistedState = loadState();
const store = createStore(reducers, persistedState);

store.subscribe(
    throttle(() => {
        const state = store.getState();
        if (state.board.lists.length > 1 && state.changed.changed) {
            saveState(state);
        }
    }, 1000)
);

if (!store.getState().board.lists.length) {
    console.log("SEED");
    seed(store);
}

export default store;
