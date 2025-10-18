import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

export const fetchTrails = createAsyncThunk(
    'trails/fetchTrails',
    async ({ searchState }) => {
        const response = await fetch(
            `https://developer.nps.gov/api/v1/parks?
            stateCode=${searchState}
            &q=hiking
            &api_key=${process.env.REACT_APP_API_KEY}`
        );

        if(!response.ok) {
            return Promise.reject('Oops! Something went wrong: ' + response.status);
        }
        const data = await response.json();
        console.log('success', data.data);
        return data.data;
    }
);

const initialState = {
    trailsArray: [],
    isLoading: false,
    errMsg: ''
};

const trailsSlice = createSlice({
    name: 'trails',
    initialState,
    reducers: {},
    extraReducers: {
        [fetchTrails.pending]: (state) => {
            state.isLoading = true;
        },
        [fetchTrails.fulfilled]: (state, action) => {
            state.isLoading = false;
            state.errMsg = '';
            state.trailsArray = action.payload;
        },
        [fetchTrails.rejected]: (state, action) => {
            state.isLoading = false;
            state.errMsg = action.error ? action.error.message : 'Fetch Failed';
        }
    }
});

export const trailsReducer = trailsSlice.reducer;

export const selectAllTrails = (state) => state.trails.trailsArray;

export const selectTrailById = (id) => (state) => {
    const trail = state.trails.trailsArray.find((trail) => trail.id === id);
    return trail || null;
};

export const selectRandomTrails = (count) => (state) => {
    const filteredTrails = [...state.trails.trailsArray]; // Create a copy of the array

    const randomTrails = [];
    const numTrails = Math.min(count, filteredTrails.length);

    while (randomTrails.length < numTrails) {
        const randomIndex = Math.floor(Math.random() * filteredTrails.length);
        const randomTrail = filteredTrails[randomIndex];
        randomTrails.push(randomTrail);
        filteredTrails.splice(randomIndex, 1);
    }

    return randomTrails;
};