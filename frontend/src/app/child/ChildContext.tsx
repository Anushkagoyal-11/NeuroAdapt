"use client";

import { createContext, useContext } from "react";

export interface UserProfile {
  id: number;
  child_id?: number | null;
  name: string;
  email: string;
  role: string;
  age?: number;
  assigned_pathways?: string[];
}

export interface ChildContextType {
  user: UserProfile | null;
  apiUrl: string;
  theme: "light" | "dark";
  setTheme: (t: "light" | "dark") => void;
  fontSize: "normal" | "large" | "xlarge";
  setFontSize: (s: "normal" | "large" | "xlarge") => void;
  activePathwayFilter: string;
  setActivePathwayFilter: (p: string) => void;
  refreshTrigger: number;
  triggerRefresh: () => void;
}

export const ChildContext = createContext<ChildContextType>({
  user: null,
  apiUrl: "",
  theme: "light",
  setTheme: () => {},
  fontSize: "normal",
  setFontSize: () => {},
  activePathwayFilter: "all",
  setActivePathwayFilter: () => {},
  refreshTrigger: 0,
  triggerRefresh: () => {},
});

export function useChildContext() {
  return useContext(ChildContext);
}
