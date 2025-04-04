
import React, { createContext, useContext, useState } from 'react';
import { modifiedWeights, resetModifiedFlags } from '@/types/optimization';

interface ModifiedFlagsContextType {
  modifiedFlags: boolean[];
  setModifiedFlag: (index: number, value: boolean) => void;
  resetFlags: () => void;
}

const defaultState: ModifiedFlagsContextType = {
  modifiedFlags: Array(Object.keys(modifiedWeights).length).fill(false),
  setModifiedFlag: () => {},
  resetFlags: () => {}
};

const ModifiedFlagsContext = createContext<ModifiedFlagsContextType>(defaultState);

export const useModifiedFlags = () => useContext(ModifiedFlagsContext);

export const ModifiedFlagsProvider = ({ children }: { children: React.ReactNode }) => {
  const [modifiedFlags, setModifiedFlags] = useState<boolean[]>(
    Array(Object.keys(modifiedWeights).length).fill(false)
  );

  const setModifiedFlag = (index: number, value: boolean) => {
    const newFlags = [...modifiedFlags];
    newFlags[index] = value;
    setModifiedFlags(newFlags);
  };

  const resetFlags = () => {
    setModifiedFlags(Array(Object.keys(modifiedWeights).length).fill(false));
    resetModifiedFlags();
  };

  return (
    <ModifiedFlagsContext.Provider value={{ modifiedFlags, setModifiedFlag, resetFlags }}>
      {children}
    </ModifiedFlagsContext.Provider>
  );
};
