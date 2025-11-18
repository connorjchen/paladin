import { useCommunityStore } from '@/stores/community'
import { Feature, FeaturePlanConfigs } from '@paladin/shared'

/**
 * Hook to check feature availability based on community plan
 *
 * @example
 * ```tsx
 * const { isEnabled, getValue } = useFeature()
 *
 * // Check if support agent is enabled
 * const supportAgentEnabled = isEnabled(Feature.SUPPORT_AGENT)
 *
 * // Get max admins limit
 * const maxAdmins = getValue(Feature.MAX_ADMINS) as number
 * ```
 */
export function useFeature() {
  const { community } = useCommunityStore()

  const isEnabled = (feature: Feature): boolean => {
    if (!community) return false

    const config = FeaturePlanConfigs[feature]
    if (!config) return false

    const value = config[community.plan]
    if (value === undefined) return false

    return value as boolean
  }

  const getValue = (
    feature: Feature
  ): string | number | boolean | undefined => {
    if (!community) return undefined

    const config = FeaturePlanConfigs[feature]
    if (!config) return undefined

    return config[community.plan]
  }

  return {
    isEnabled,
    getValue,
  }
}
