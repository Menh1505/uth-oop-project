
import { createContext, useContext } from "react";
import type { Store } from "./AppStore";

export const Ctx = createContext<Store | null>(null);

export const useAppStore = () => useContext(Ctx)!;
