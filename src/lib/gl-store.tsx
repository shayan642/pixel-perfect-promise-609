import { createContext, useContext, useState, type ReactNode } from "react";
import {
  DEFAULT_BUILDING,
  DEFAULT_VEHICLE,
  type BuildingInputs,
  type VehicleInputs,
} from "./greenledger";

interface Store {
  vehicle: VehicleInputs;
  building: BuildingInputs;
  setVehicle: (v: VehicleInputs) => void;
  setBuilding: (b: BuildingInputs) => void;
  reset: () => void;
}

const Ctx = createContext<Store | null>(null);

export function GLProvider({ children }: { children: ReactNode }) {
  const [vehicle, setVehicle] = useState(DEFAULT_VEHICLE);
  const [building, setBuilding] = useState(DEFAULT_BUILDING);
  return (
    <Ctx.Provider
      value={{
        vehicle,
        building,
        setVehicle,
        setBuilding,
        reset: () => {
          setVehicle(DEFAULT_VEHICLE);
          setBuilding(DEFAULT_BUILDING);
        },
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useGL() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useGL outside provider");
  return c;
}
