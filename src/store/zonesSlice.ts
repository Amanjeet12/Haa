import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

import { getCustomerZones, Zone } from '../api/zones';
import { storageKeys } from '../config/app';
import { readJson, writeJson } from '../storage/storage';

type ZonesState = {
  items: Zone[];
  selected: Zone | null;
  status: 'idle' | 'loading' | 'ready' | 'error';
  error: string | null;
};

const initialState: ZonesState = {
  items: [],
  selected: null,
  status: 'idle',
  error: null,
};

export const fetchZones = createAsyncThunk(
  'zones/fetch',
  async (
    coordinates: { lat: number; lng: number } | undefined,
    { rejectWithValue },
  ) => {
    try {
      const [items, storedZoneId] = await Promise.all([
        getCustomerZones(coordinates),
        readJson<number>(storageKeys.selectedZoneId),
      ]);
      const coordinateZone = items.find(item => item.is_coordinate_in_zone);
      if (coordinateZone) {
        try {
          await writeJson(storageKeys.selectedZoneId, coordinateZone.zone_id);
        } catch {
          // Storage failure must not prevent zone availability from loading.
        }
      }
      return { items, storedZoneId };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Unable to load locations.',
      );
    }
  },
);

const zonesSlice = createSlice({
  name: 'zones',
  initialState,
  reducers: {
    setSelectedZone(state, action: PayloadAction<Zone>) {
      state.selected = action.payload;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchZones.pending, state => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchZones.fulfilled, (state, action) => {
        state.items = action.payload.items;
        const coordinateZone = state.items.find(
          item => item.is_coordinate_in_zone,
        );
        state.selected =
          coordinateZone ??
          state.items.find(item => item.zone_id === state.selected?.zone_id) ??
          state.items.find(
            item => item.zone_id === action.payload.storedZoneId,
          ) ??
          state.items[0] ??
          null;
        state.status = 'ready';
      })
      .addCase(fetchZones.rejected, (state, action) => {
        state.status = 'error';
        state.error =
          typeof action.payload === 'string'
            ? action.payload
            : 'Unable to load locations.';
      });
  },
});

export const { setSelectedZone } = zonesSlice.actions;
export const zonesReducer = zonesSlice.reducer;
