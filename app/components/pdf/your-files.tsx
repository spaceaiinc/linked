import React, { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Button } from '@/app/components/ui/button'
import { TrashIcon } from '@radix-ui/react-icons'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/app/components/ui/pagination'

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/app/components/ui/dialog'

interface YourFilesProps {
  documents: any[]
}

const YourFiles: React.FC<YourFilesProps> = ({ documents }) => {
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [selectedDoc, setSelectedDoc] = useState<any>(null)
  const itemsPerPage = 5

  const sortedDocuments = [...documents].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  const totalPages = Math.ceil(sortedDocuments.length / itemsPerPage)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const currentDocuments = sortedDocuments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleDelete = async (documentId: string) => {
    const res = await fetch('/api/pdf/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentId }),
    })
    if (res.ok) {
      // Refresh the documents list or handle the UI update
      setSelectedDoc(null)
      // Assuming you have a way to refresh the documents list, e.g., refetching from the server
      window.location.reload()
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="space-y-2 mb-8">
        <h2 className="text-xl font-semibold tracking-tight">
          You have {documents.length} documents in your library
        </h2>
        <p className="text-base text-sm text-muted-foreground">
          You can view and delete your uploaded files here.
        </p>
      </div>

      {documents && (
        <div className="rounded-xl border border-border/40 bg-background shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-base font-medium text-sm text-muted-foreground">
                  File Name
                </TableHead>
                <TableHead className="text-base font-medium text-sm text-muted-foreground text-center">
                  Uploaded
                </TableHead>
                <TableHead className="text-base font-medium text-sm text-muted-foreground text-center hidden md:table-cell">
                  Size
                </TableHead>
                <TableHead className="w-[80px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentDocuments.map((doc: any) => (
                <TableRow
                  key={doc.id}
                  className="hover:bg-muted/40 transition-colors duration-200"
                >
                  <TableCell className="py-4">
                    <a
                      href={`/pdf/document/${doc.id}`}
                      className="text-primary hover:text-primary/80 font-medium transition-colors duration-200"
                    >
                      {doc.file_name}
                    </a>
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground">
                    {formatDistanceToNow(new Date(doc.created_at))} ago
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-center text-muted-foreground">
                    {doc.size ? `${doc.size} MB` : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          className="rounded-full size-9 p-0 hover:bg-destructive/10 hover:text-destructive transition-colors duration-200"
                          variant="ghost"
                          onClick={() => setSelectedDoc(doc)}
                        >
                          <TrashIcon className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogTitle>Confirm deletion</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to delete this document? This
                          action cannot be undone.
                        </DialogDescription>
                        <DialogFooter>
                          <Button
                            className="bg-red-500 text-white hover:bg-red-400"
                            onClick={() => handleDelete(selectedDoc.id)}
                          >
                            Delete
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="py-4 px-2 border-t border-border/40">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    className="hover:bg-muted/40 transition-colors duration-200"
                    onClick={() =>
                      handlePageChange(Math.max(1, currentPage - 1))
                    }
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink
                      href="#"
                      className="hover:bg-muted/40 transition-colors duration-200"
                      onClick={() => handlePageChange(i + 1)}
                      isActive={i + 1 === currentPage}
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    className="hover:bg-muted/40 transition-colors duration-200"
                    onClick={() =>
                      handlePageChange(Math.min(totalPages, currentPage + 1))
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      )}
    </div>
  )
}

export default YourFiles
