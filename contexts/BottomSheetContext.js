import React, { createContext, useContext } from 'react';

export const BottomSheetContext = createContext(null);

export const useBottomSheet = () => useContext(BottomSheetContext);
