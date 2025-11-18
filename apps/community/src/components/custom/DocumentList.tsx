import { useState, useEffect } from 'react'
import { File, ExternalLink, Trash2Icon } from 'lucide-react'
import { VFlex } from './VFlex'
import { HFlex } from './HFlex'
import { Pagination } from './Pagination'
import { Card } from '../ui/card'
import { ButtonIcon } from './ButtonIcon'
import { BasicDocument } from '@paladin/shared'
import { useDocumentStore } from '@/stores/document'
import { Loading } from './Loading'
import { getR2Url } from '@/lib/utils'
import { H3, P1, P2 } from './Text'

interface DocumentListProps {
  fetchDocuments: () => Promise<void>
  documents: BasicDocument[]
  loading: boolean
}

export function DocumentList({
  fetchDocuments,
  documents,
  loading,
}: DocumentListProps) {
  const { deleteDocument } = useDocumentStore()
  const [currentPage, setCurrentPage] = useState(1)
  const documentsPerPage = 20

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  return (
    <VFlex className="gap-4">
      <VFlex className="gap-4">
        <HFlex className="justify-between">
          <H3>All Documents</H3>
          <P2 muted>{documents.length} documents total (max 100)</P2>
        </HFlex>

        {loading ? (
          <Loading />
        ) : documents.length === 0 ? (
          <VFlex className="items-center gap-2">
            <File className="text-muted-foreground h-12 w-12" />
            <P2 muted>No documents found</P2>
          </VFlex>
        ) : (
          <VFlex className="gap-2">
            {documents.map((document) => (
              <Card
                key={document.id}
                className="flex items-center justify-between p-4"
              >
                <P1>{document.name}</P1>
                <HFlex className="items-center gap-2">
                  <ButtonIcon
                    variant="ghost"
                    onClick={() => {
                      window.open(getR2Url(document.r2Key), '_blank')
                    }}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </ButtonIcon>
                  <ButtonIcon
                    variant="ghost"
                    onClick={async () => {
                      await deleteDocument(document.id)
                      // DEBT: Refresh document data (not ideal, but it works for now)
                      await fetchDocuments()
                    }}
                  >
                    <Trash2Icon className="h-4 w-4" />
                  </ButtonIcon>
                </HFlex>
              </Card>
            ))}
          </VFlex>
        )}
      </VFlex>

      <Pagination
        currentPage={currentPage}
        totalItems={documents.length}
        itemsPerPage={documentsPerPage}
        onPageChange={setCurrentPage}
      />
    </VFlex>
  )
}
