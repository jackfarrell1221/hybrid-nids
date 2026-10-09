// context/SimulationContext.tsx — Tracks simulation mode and activity state.

import React, { createContext, useContext, useState } from 'react';

interface SimulationContextType {
  isSimulating: boolean;
  setIsSimulating: (s: boolean) => void;
  simulationActive: boolean;
  setSimulationActive: (a: boolean) => void;
  lastScenario: string | null;
  setLastScenario: (sc: string | null) => void;
}

const SimulationContext = createContext<SimulationContextType>({
  isSimulating: false,
  setIsSimulating: () => {},
  simulationActive: false,
  setSimulationActive: () => {},
  lastScenario: null,
  setLastScenario: () => {},
});

export const SimulationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationActive, setSimulationActive] = useState(false);
  const [lastScenario, setLastScenario] = useState<string | null>(null);

  return (
    <SimulationContext.Provider
      value={{
        isSimulating,
        setIsSimulating,
        simulationActive,
        setSimulationActive,
        lastScenario,
        setLastScenario,
      }}
    >
      {children}
    </SimulationContext.Provider>
  );
};

export const useSimulation = () => useContext(SimulationContext);
