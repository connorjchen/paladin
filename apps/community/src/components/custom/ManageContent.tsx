import { ManageExternalResources } from './ManageExternalResources'
import { ManagePageSettings } from './ManagePageSettings'
import { ManagePostTags } from './ManagePostTags'
import { H2 } from './Text'
import { VFlex } from './VFlex'

export function ManageContent() {
  return (
    <VFlex className="gap-4">
      <H2>Manage Content</H2>
      <ManagePageSettings />
      <ManageExternalResources />
      <ManagePostTags />
    </VFlex>
  )
}
