import { getSubpathPath } from '@/lib/utils'
import * as React from 'react'
import { NavigateOptions, useNavigate, useParams } from 'react-router-dom'

export function useSubpathNavigate() {
  const navigate = useNavigate()
  const { serverSubpath } = useParams()

  return (path: string, options?: NavigateOptions) => {
    const subpathPath = getSubpathPath(serverSubpath, path)

    navigate(subpathPath, options)
  }
}
