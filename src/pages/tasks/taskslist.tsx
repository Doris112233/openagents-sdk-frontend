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
} from "@tanstack/react-table"
import { ArrowUpDown, PlusIcon } from "lucide-react"
import { Link } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
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

import { useEffect, useState } from "react"

const getStatusBadge = (status: string) => {
  switch (status) {
    case "success":
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

export function TasksList() {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true)

  const loadTasks = () => {
    fetch("http://172.207.17.188:8003/api/tasks")
    .then(response => response.json())
    .then(data => {
      setTasks(data)
      console.log("Tasks fetched:", data)
      setLoading(false)
    })
    .catch(error => {
      console.error("Error fetching tasks:", error)
    })
  }

  useEffect(() => {
    loadTasks()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewTask(prev => ({ ...prev, name: e.target.value}))
  }

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewTask(prev => ({ ...prev, description: e.target.value}))
  }

  const handleCreateTask = () => {
    console.log("Creating task:", newTask)
    setIsCreateOpen(false)
    fetch("http://172.207.17.188:8003/api/tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: newTask.name,
        description: newTask.description,
      })
    }).then(response => response.json())
    .then(data => {
      console.log("Task created:", data)
      loadTasks()
    })
    .catch(error => {
      console.error("Error creating task:", error)
    })
  }

  const handleDeleteTask = (id: string) => {
    fetch(`http://172.207.17.188:8003/api/tasks/${id}`, {
      method: "DELETE"
    })
    .then(data => {
      console.log("Task deleted:", data)
      loadTasks()
    })
    .catch(error => {
      console.error("Error deleting task:", error)
    })
  }

  const [deleteTarget, setDeleteTarget] = useState<any | null>(null)

  const [newTask, setNewTask] = useState({name: "", description: ""})

  const handleDeploy = (id: string) => {
    fetch(`http://172.207.17.188:8003/api/tasks/${id}/deployments`, {
      method: "POST"
    })
    .then(data => {
      console.log("Task deployed:", data)
      loadTasks()
    })
    .catch(error => {
      console.error("Error deploying task:", error)
    })
  }

  const handleUndeploy = (id: string) => {
    fetch(`http://172.207.17.188:8003/api/tasks/${id}/deployments`, {
      method: "DELETE"
    })
    .then(data => {
      console.log("Task undeployed:", data)
      loadTasks()
    })
    .catch(error => {
      console.error("Error undeploying task:", error)
    })
  }

  const getStatusByStage = (task: any) => {
    switch (task.stage) {
      case "extract_content":
        return task.documents_info?.status || "Not uploaded";
      case "generate_sample":
        return task.samples_info?.status || "Not generated";
      case "fine_tune":
        return task.fine_tune_info?.status || "Not fine-tuned";
      case "deploy":
        return task.deployment_info?.status || "Not deployed";
      case "created":
        return "success";
      default:
        return "Unknown stage"
    }
  }

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "stage",
      header: "Current Stage",
      cell: ({ row }) => {
        const stage = row.getValue("stage") as string
        return <div className="capitalize">{stage}</div>
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = getStatusByStage(row.original)
        return (
          <div className="capitalize flex gap-2">
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
      accessorKey: "created_at",
      header: "Created At",
      cell: ({ row }) => {
        const created_at = row.getValue("created_at") as string
        return <div>{created_at.slice(0, 10)} {created_at.slice(11, 16)}</div>
      },
    },
    {
      accessorKey: "updated_at",
      header: "Updated At",
      cell: ({ row }) => {
        const updated_at = row.getValue("updated_at") as string
        return <div>{updated_at.slice(0, 10)} {updated_at.slice(11, 16)}</div>
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
              <DropdownMenuItem>
              <Link to={`/tasks/${task.id}`}>Edit task</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setDeleteTarget(task)}>Delete task</DropdownMenuItem>
              {task.stage === "deploy" && (
                <DropdownMenuItem onClick={() => handleUndeploy(task.id)}>Stop Deployment</DropdownMenuItem>
              )}
              {((task.stage === "deploy" && task.deployment_info?.status !== "success") || (task.stage === "fine_tune" && task.fine_tune_info?.status === "success")) && (
                <DropdownMenuItem onClick={() => handleDeploy(task.id)}>Deploy</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const table = useReactTable({
    data: tasks,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters
    },
  })

  if (loading) return <Spinner show={true} size="large" className="justify-center items-center h-screen"/>

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
      <div>
        <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Delete Task</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete task <strong>{deleteTarget?.name}</strong>?
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  if (deleteTarget) {
                    handleDeleteTask(deleteTarget.id);
                    setDeleteTarget(null);
                  }
                }}
              >
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
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
        <DialogContent className="max-w-4xl w-1/3 h-1/2">
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
                onChange={handleInputChange}
                className="col-span-2 h-8"
                placeholder="Task name"
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={newTask.description}
                onChange={handleDescriptionChange}
                className="col-span-2 h-8"
                placeholder="Task description"
              />
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
              onClick={handleCreateTask}
              disabled={!newTask.name.trim()}
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
