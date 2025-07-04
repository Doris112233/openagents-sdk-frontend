import React, { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

interface BreadcrumbContextType {
  setBreadcrumbInfo: (info: { [key: string]: string }) => void
  getBreadcrumbInfo: (key: string) => string | undefined
  clearBreadcrumbInfo: () => void
}

const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(undefined)

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [breadcrumbInfo, setBreadcrumbInfoState] = useState<{ [key: string]: string }>({})

  const setBreadcrumbInfo = (info: { [key: string]: string }) => {
    setBreadcrumbInfoState(prev => ({ ...prev, ...info }))
  }

  const getBreadcrumbInfo = (key: string) => {
    return breadcrumbInfo[key]
  }

  const clearBreadcrumbInfo = () => {
    setBreadcrumbInfoState({})
  }

  return (
    <BreadcrumbContext.Provider value={{ setBreadcrumbInfo, getBreadcrumbInfo, clearBreadcrumbInfo }}>
      {children}
    </BreadcrumbContext.Provider>
  )
}

export function useBreadcrumb() {
  const context = useContext(BreadcrumbContext)
  if (context === undefined) {
    throw new Error('useBreadcrumb must be used within a BreadcrumbProvider')
  }
  return context
} 