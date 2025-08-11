'use client'

import dynamic from 'next/dynamic'
import { ComponentType } from 'react'

function NoSSR<P extends object>({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

export default dynamic(() => Promise.resolve(NoSSR), {
  ssr: false,
})
