import { create } from 'zustand';

export type BillingBusy = 'purchase' | 'restore' | 'cancel' | 'resubscribe' | null;

export type BillingNotice = {
  tone: 'info' | 'success' | 'error';
  text: string;
  /** Replaced by a success notice as soon as the backend confirms access. */
  awaitingConfirmation?: boolean;
} | null;

type PurchaseFlowState = {
  /** The one store flow in progress (a second one cannot start while this is set). */
  busy: BillingBusy;
  notice: BillingNotice;
  setBusy: (busy: BillingBusy) => void;
  setNotice: (notice: BillingNotice) => void;
};

export const usePurchaseFlow = create<PurchaseFlowState>()((set) => ({
  busy: null,
  notice: null,
  setBusy: (busy) => set({ busy }),
  setNotice: (notice) => set({ notice }),
}));
