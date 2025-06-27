"use client"

import * as React from "react"
import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table"
import { ArrowUpDown, PlusIcon, UploadIcon, SettingsIcon } from "lucide-react"
import { Link } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { 
  Dialog, 
  DialogContent, 
  DialogTrigger, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const data: Task[] = [
  {
    id: "1",
    name: "gpt-4o fine-tuning",
    description: "Fine-tuning gpt-4o with a custom dataset",
    model: "gpt-4o",
    dataset: "custom-dataset",
    dataset_size: 100,
    parameters: "{}",
    status: "pending",
    createdAt: "2021-01-01",
    updatedAt: "2021-01-01"
  },
  {
    id: "2",
    name: "qwen2.5-coder-32b-instruct",
    description: "Fine-tuning qwen2.5-coder-32b-instruct with a custom dataset",
    model: "qwen2.5-coder-32b-instruct",
    dataset: "custom-dataset",
    dataset_size: 100,
    parameters: "{}",
    status: "running",
    createdAt: "2021-01-01",
    updatedAt: "2021-01-01"
  },
  {
    id: "3",
    name: "llama3.1-8b-instruct",
    description: "Fine-tuning llama3.1-8b-instruct with a custom dataset",
    model: "llama3.1-8b-instruct",
    dataset: "custom-dataset",
    dataset_size: 100,
    parameters: "{}",
    status: "completed",
    createdAt: "2021-01-01",
    updatedAt: "2021-01-01"
  },
  {
    id: "4",
    name: "deepseek-r1-distill-qwen-32b",
    description: "Fine-tuning deepseek-r1-distill-qwen-32b with a custom dataset",
    model: "deepseek-r1-distill-qwen-32b",
    dataset: "custom-dataset",
    dataset_size: 100,
    parameters: "{}",
    status: "failed",
    createdAt: "2021-01-01",
    updatedAt: "2021-01-01"
  }
]

export type Task = {
  id: string
  name: string
  description: string
  model: string
  status: "pending" | "running" | "completed" | "failed"
  dataset: string
  dataset_size: number
  parameters: string
  createdAt: string
  updatedAt: string
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800 hover:bg-green-100"
    case "running":
      return "bg-blue-100 text-blue-800 hover:bg-blue-100"
    case "pending":
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
    case "failed":
      return "bg-red-100 text-red-800 hover:bg-red-100"
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-100"
  }
}

const columns: ColumnDef<Task>[] = [
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <div className="capitalize">
          <Badge variant="outline" className={`capitalize border-0 ${getStatusBadge(status)}`}>
            {status}
          </Badge>
        </div>
      )
    },
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown />
        </Button>
      )
    },
    cell: ({ row }) => <div className="lowercase">{row.getValue("name")}</div>,
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => {
      return <div className="font-medium">{row.getValue("description")}</div>
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
    const task = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="h-8 w-20 p-0">
              Actions
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(task.id)}
            >
              Copy task ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to={`/tasks/${task.id}`}>View task details</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>Delete task</DropdownMenuItem>
            <DropdownMenuItem>Cancel task</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

export function TasksList() {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [newTask, setNewTask] = React.useState({
    name: "",
    description: "",
    status: "pending" as const,
    model: "gpt-4o",
    dataset: "",
    dataset_size: 0,
    parameters: "{}"
  })
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      console.log("Selected file:", file)
    }
  }
  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter tasks..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
      <div className="flex items-center justify-center space-x-2 py-4">
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogTrigger asChild>
          <Button size="sm" className="w-32 font-semibold">
            New Task <PlusIcon className="w-4 h-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl w-1/2 h-2/3">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>
              Add a new fine-tuning task.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newTask.name}
                onChange={(e) => setNewTask(prev => ({ ...prev, name: e.target.value }))}
                className="col-span-2 h-8"
                placeholder="Task name"
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newTask.description}
                onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                className="col-span-2 h-16 resize-none"
                placeholder="Task description"
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="dataset">Dataset</Label>
              <Button variant="outline" className="col-span-2" onClick={handleUploadClick}>
                Upload Dataset
                <UploadIcon className="w-4 h-4" />
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json,.jsonl,.csv,.txt"
                className="hidden"
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="dataset">Choose a model</Label>
              <Select
                value={newTask.model}
                onValueChange={(value) => setNewTask(prev => ({ ...prev, model: value }))}
              >
                <SelectTrigger className="col-span-1">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                  <SelectItem value="qwen2.5">Qwen2.5</SelectItem>
                  <SelectItem value="llama3.1">Llama3.1</SelectItem>
                  <SelectItem value="deepseek-r1">DeepSeek-R1</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="col-span-1">Advanced Settings <SettingsIcon className="w-4 h-4" /></Button>
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsCreateOpen(false)
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                console.log("Creating task:", newTask)
                setIsCreateOpen(false)
                setNewTask({ name: newTask.name, description: newTask.description, status: "pending", model: newTask.model, dataset: newTask.dataset, dataset_size: newTask.dataset_size, parameters: newTask.parameters })
              }}
              disabled={!newTask.name.trim() || !newTask.description.trim()}
            >
              Create Task
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  )
}
