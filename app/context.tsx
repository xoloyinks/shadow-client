"use client"

import React, { useEffect, useState } from "react"
import { createContext } from "react"
export default function ShadowContext({ children }: {
    children: React.ReactNode,
}): React.ReactNode{
    const [auth, setAuth] = useState(false);
    
   return(
        <>
            <UserData.Provider value={[auth, setAuth]}>
                {children}
            </UserData.Provider>
        </>
   )
}

export const UserData = createContext<any>(null);