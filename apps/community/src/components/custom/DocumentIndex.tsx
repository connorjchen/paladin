import { VFlex } from './VFlex'
import { DocumentUpload } from './DocumentUpload'
import { DocumentList } from './DocumentList'
import { useCallback, useState } from 'react'
import { BasicDocument } from '@paladin/shared'
import { useDocumentStore } from '@/stores/document'
import { H2, P2 } from './Text'

export function DocumentIndex() {
  const { getDocuments } = useDocumentStore()
  const [documents, setDocuments] = useState<BasicDocument[]>([])
  const [loading, setLoading] = useState(false)

  const fetchDocuments = useCallback(async () => {
    setLoading(true)
    const result = await getDocuments()
    if (result.data) {
      setDocuments(result.data.documents)
    }
    setLoading(false)
  }, [getDocuments])

  return (
    <VFlex className="gap-4">
      <VFlex className="gap-2">
        <H2>Document Index</H2>
        <P2 muted>
          Uploaded documents help train the AI agent. They will be indexed and
          used to enhance the agent's knowledge and responses for this
          community.
        </P2>
      </VFlex>

      <DocumentUpload
        fetchDocuments={fetchDocuments}
        totalItems={documents.length}
      />
      <DocumentList
        fetchDocuments={fetchDocuments}
        documents={documents}
        loading={loading}
      />
    </VFlex>
  )
}
