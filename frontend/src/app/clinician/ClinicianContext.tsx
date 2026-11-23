"use client";

import { createContext, useContext } from "react";

export interface ClinicianProfile {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface ClinicianContextType {
  user: ClinicianProfile | null;
  apiUrl: string;
  refreshTrigger: number;
  triggerRefresh: () => void;
}

export const ClinicianContext = createContext<ClinicianContextType>({
  user: null,
  apiUrl: "",
  refreshTrigger: 0,
  triggerRefresh: () => {},
});

export function useClinicianContext() {
  return useContext(ClinicianContext);
}
