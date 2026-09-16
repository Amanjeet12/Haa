import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';

import { authReducer } from './authSlice';
import { storageKeys } from '../config/app';
import { writeJson } from '../storage/storage';
import { setSelectedZone, zonesReducer } from './zonesSlice';
import { cartReducer } from './cartSlice';

const zoneListener = createListenerMiddleware();
zoneListener.startListening({
  actionCreator: setSelectedZone,
  effect: async action => {
    await writeJson(storageKeys.selectedZoneId, action.payload.zone_id);
  },
});

export const store = configureStore({
  reducer: { auth: authReducer, zones: zonesReducer, cart: cartReducer },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware().prepend(zoneListener.middleware),
});
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
