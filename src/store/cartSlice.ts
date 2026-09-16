import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { LabTestItem } from '../api/labTests';

export type CartTest = {
  labTest: LabTestItem;
  beneficiaryIds: string[];
};

export type CartBeneficiary = {
  id: string;
  name: string;
  detail: string;
  profilePhoto?: string | null;
};

type CartState = {
  labId: number | null;
  labName: string | null;
  items: CartTest[];
  beneficiaries: CartBeneficiary[];
  targetBeneficiaryId: string | null;
  familyInitialized: boolean;
};

const initialState: CartState = {
  labId: null,
  labName: null,
  items: [],
  beneficiaries: [],
  targetBeneficiaryId: null,
  familyInitialized: false,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addTestToCart(
      state,
      action: PayloadAction<{ labName: string; test: LabTestItem }>,
    ) {
      const { labName, test } = action.payload;
      if (state.labId !== null && state.labId !== test.lab_id) {
        state.items = [];
      }
      state.labId = test.lab_id;
      state.labName = labName;
      const existing = state.items.find(
        item => item.labTest.lab_test_id === test.lab_test_id,
      );
      if (existing && state.targetBeneficiaryId) {
        if (!existing.beneficiaryIds.includes(state.targetBeneficiaryId)) {
          existing.beneficiaryIds.push(state.targetBeneficiaryId);
        }
      } else if (!existing) {
        state.items.push({
          labTest: test,
          beneficiaryIds: state.targetBeneficiaryId
            ? [state.targetBeneficiaryId]
            : [],
        });
      }
    },
    removeTestFromCart(state, action: PayloadAction<number>) {
      state.items = state.items.filter(
        item => item.labTest.lab_test_id !== action.payload,
      );
      if (!state.items.length) {
        state.labId = null;
        state.labName = null;
      }
    },
    assignTestBeneficiaries(
      state,
      action: PayloadAction<{ labTestId: number; beneficiaryIds: string[] }>,
    ) {
      const item = state.items.find(
        candidate => candidate.labTest.lab_test_id === action.payload.labTestId,
      );
      if (item)
        item.beneficiaryIds = [...new Set(action.payload.beneficiaryIds)];
    },
    upsertCartBeneficiary(state, action: PayloadAction<CartBeneficiary>) {
      const index = state.beneficiaries.findIndex(
        beneficiary => beneficiary.id === action.payload.id,
      );
      if (index >= 0) state.beneficiaries[index] = action.payload;
      else state.beneficiaries.push(action.payload);
    },
    initializeCartFamilyMember(
      state,
      action: PayloadAction<{ beneficiary: CartBeneficiary; legacyId: string }>,
    ) {
      if (state.familyInitialized) return;
      const { beneficiary, legacyId } = action.payload;
      state.beneficiaries = [
        beneficiary,
        ...state.beneficiaries.filter(
          item => item.id !== legacyId && item.id !== beneficiary.id,
        ),
      ];
      state.items.forEach(item => {
        const migratedIds = item.beneficiaryIds.map(id =>
          id === legacyId ? beneficiary.id : id,
        );
        item.beneficiaryIds = [
          ...new Set(migratedIds.length ? migratedIds : [beneficiary.id]),
        ];
      });
      state.targetBeneficiaryId = beneficiary.id;
      state.familyInitialized = true;
    },
    setCartBeneficiaryTarget(state, action: PayloadAction<string>) {
      state.targetBeneficiaryId = action.payload;
    },
    removeTestForBeneficiary(
      state,
      action: PayloadAction<{ labTestId: number; beneficiaryId: string }>,
    ) {
      const item = state.items.find(
        entry => entry.labTest.lab_test_id === action.payload.labTestId,
      );
      if (item) {
        item.beneficiaryIds = item.beneficiaryIds.filter(
          id => id !== action.payload.beneficiaryId,
        );
        if (!item.beneficiaryIds.length) {
          state.items = state.items.filter(
            entry => entry.labTest.lab_test_id !== action.payload.labTestId,
          );
        }
      }
    },
    removeCartBeneficiary(state, action: PayloadAction<string>) {
      state.beneficiaries = state.beneficiaries.filter(
        beneficiary => beneficiary.id !== action.payload,
      );
      state.items.forEach(item => {
        item.beneficiaryIds = item.beneficiaryIds.filter(
          id => id !== action.payload,
        );
      });
      state.items = state.items.filter(item => item.beneficiaryIds.length);
      if (state.targetBeneficiaryId === action.payload) {
        state.targetBeneficiaryId = state.beneficiaries[0]?.id ?? null;
      }
    },
    switchCartLab(
      state,
      action: PayloadAction<{ labName: string; tests: LabTestItem[] }>,
    ) {
      const beneficiariesByTestId = new Map<number, string[]>();
      state.items.forEach(item => {
        const existing = beneficiariesByTestId.get(item.labTest.test_id) ?? [];
        beneficiariesByTestId.set(item.labTest.test_id, [
          ...new Set([...existing, ...item.beneficiaryIds]),
        ]);
      });
      state.items = action.payload.tests.map(test => ({
        labTest: test,
        beneficiaryIds: beneficiariesByTestId.get(test.test_id) ?? [],
      }));
      state.labId = action.payload.tests[0]?.lab_id ?? null;
      state.labName = action.payload.labName;
    },
    clearCart() {
      return initialState;
    },
  },
});

export const {
  addTestToCart,
  assignTestBeneficiaries,
  clearCart,
  initializeCartFamilyMember,
  removeTestFromCart,
  removeTestForBeneficiary,
  removeCartBeneficiary,
  setCartBeneficiaryTarget,
  switchCartLab,
  upsertCartBeneficiary,
} = cartSlice.actions;
export const cartReducer = cartSlice.reducer;
