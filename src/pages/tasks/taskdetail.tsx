import { useParams } from "react-router-dom"
import { useEffect, useRef, useState } from "react"
import { type Task } from "./taskslist"
import { Button } from "@/components/ui/button"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useBreadcrumb } from "@/components/breadcrumb-context"

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
export default function TaskDetail() {
    const { id } = useParams()
    const [task, setTask] = useState<Task | null>(null)
    // const [samples, setSamples] = useState<string[]>([])
    const [documents, setDocuments] = useState<Array<{id: string, filename: string}>>([])
    const { setBreadcrumbInfo } = useBreadcrumb()

    const fileInputRef = useRef<HTMLInputElement>(null)

    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)
    const [fineTuning, setFineTuning] = useState(false)
    const [deploying, setDeploying] = useState(false)
    const [baseModel, setBaseModel] = useState<string>("")
    const [status, setStatus] = useState<string>("")
    const [currentStage, setCurrentStage] = useState<string>("")


    const loadTask = () => {
        fetch(`http://localhost:8000/tasks/${id}`)
        .then(response => response.json())
        .then(data => {
            setTask(data)
            setStatus(data.status)
            setCurrentStage(data.current_stage)
            // setBaseModel(data.base_model)
            if (id) {
                setBreadcrumbInfo({ [`task-${id}`]: data.name })
            }
        })
        .catch(error => {
            console.error("Error fetching task:", error)
        })
    }

    const loadDocuments = () => {
        fetch(`http://localhost:8000/tasks/${id}/documents`)
        .then(response => response.json())
        .then(data => setDocuments(data))
        .catch(error => {
            console.error("Error fetching documents:", error)
        })
    }

    const handleUpload = () => {
        if(!selectedFile || !id) return
        setUploading(true)
        const formData = new FormData()
        formData.append("file", selectedFile)
        fetch(`http://localhost:8000/tasks/${id}/samples`, {
            method: "POST",
            body: formData
        })
        .then(response => {
            console.log(response)
            loadTask()
            loadDocuments()
            setUploading(false)
        })
        .catch(error => {
            console.error("Error uploading file:", error)
            setUploading(false)
        })
    }

    const handleStartFineTune = () => {
        if(!id || !(currentStage == "generate_sample" && status == "success")) return
        setFineTuning(true)
        fetch(`http://localhost:8000/tasks/${id}/fine-tune`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "base_model": baseModel,
                "training_params": {
                    "learning_rate": 0.001,
                    "num_epochs": 5
                }
            })
        })
        .then(response => {
            if (!response.ok) throw new Error("Fine-tune failed")
            return response.json()
        })
        .then(data => {
            console.log(data)
            loadTask()
            setFineTuning(false)
        })
        .catch(error => {
            console.error("Error starting fine tune:", error)
            setFineTuning(false)
        })
    }

    const handleDeploy = () => {
        if(!id || !(currentStage == "fine_tune" && status == "success")) return
        setDeploying(true)
        fetch(`http://localhost:8000/tasks/${id}/deploy`, {
            method: "POST"
        })
        .then(response => {
            if (!response.ok) throw new Error("Deploy failed")
            return response.json()
        })
        .then(data => {
            console.log(data)
            loadTask()
            setDeploying(false)
        })
        .catch(error => {
            console.error("Error deploying:", error)
            setDeploying(false)
        })
    }

    useEffect(() => {
        if (!id) return
        loadTask()
        loadDocuments()
    }, [id])

    if (!task) return <div>Loading...</div>
    
    return (
        <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold">{task.name}</h2>
            <div className="flex flex-col items-start gap-4">
                <div><strong>Stage:</strong> {currentStage}</div>
                <div className="flex flex-row gap-2"><strong>Status:</strong> 
                    <Badge variant="outline" className={`capitalize border-0 ${getStatusBadge(status)}`}>
                        {status}
                    </Badge>
                </div>
                <div><strong>Model:</strong> {task.base_model || "Not selected"}</div>
                <div className="flex flex-row gap-2"><strong>Deploy Status:</strong> 
                    <Badge variant="outline" className={`capitalize border-0 ${getStatusBadge(task.deploy_status)}`}>
                        {task.deploy_status}
                    </Badge>
                </div>
                <div><strong>Created:</strong> {task.created_at.slice(0, 10)}, {task.created_at.slice(11, 16)}</div>
                <div><strong>Updated:</strong> {task.updated_at.slice(0, 10)}, {task.updated_at.slice(11, 16)}</div>
            </div>
            <div className="flex flex-row gap-4">
                <strong>Your documents</strong>
                <div className="flex flex-col gap-4">
                {documents.length > 0 ? (
                    <div className="flex flex-col gap-2">
                        {documents.map((document) => (
                        <div key={document.id} className="text-sm text-muted-foreground align-left">
                            📄 {document.filename}
                        </div>
                        ))}
                    </div>
                    ) : (
                    <div>No documents uploaded</div>
                    )}
                </div>
            </div>
            <div className="flex flex-row gap-4">
                <strong>Generate New Sample</strong>
                <div className="space-y-2">
                    <div className="flex gap-2 items-center">
                        <Button
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                        >
                        Select New Document
                        </Button>
                        {selectedFile && <span className="text-sm">{selectedFile.name}</span>}
                        <input
                            type="file"
                            accept=".pdf,.zip"
                            ref={fileInputRef}
                            onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) setSelectedFile(file)
                            }}
                            className="hidden"
                        />
                        <Button
                            size="sm"
                            onClick={handleUpload}
                            disabled={!selectedFile || uploading}
                        >
                            {uploading ? "Uploading..." : "Upload"}
                        </Button>
                    </div>
                    </div>

            </div>
            <div className="flex flex-row gap-4">
                <strong>Select Base Model</strong>
                <Select value={baseModel} onValueChange={setBaseModel}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select Base Model" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="gpt-4o">gpt-4o</SelectItem>
                        <SelectItem value="gpt-4o-mini">gpt-4o-mini</SelectItem>
                        <SelectItem value="llama-3.1-8b-instruct">llama-3.1-8b-instruct</SelectItem>
                        <SelectItem value="llama-3.1-70b-versatile">llama-3.1-70b-versatile</SelectItem>
                        <SelectItem value="qwen-3.5-72b-instruct">qwen-3.5-72b-instruct</SelectItem>
                        <SelectItem value="qwen-3.5-14b-instruct">qwen-3.5-14b-instruct</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="flex flex-row gap-4">
                <strong>Start Fine Tuning</strong>
                <Button size="sm" onClick={handleStartFineTune} disabled={fineTuning || !(status == "success" && currentStage == "generate_sample") || baseModel == ""}>{fineTuning ? "Fine Tuning..." : "Start Fine Tuning"}</Button>
            </div>
            <div className="flex flex-row gap-4">
                <strong>Deploy</strong>
                <Button size="sm" onClick={handleDeploy} disabled={deploying || !(status == "success" && currentStage == "fine_tune") || task.deploy_status == "deployed"}>{deploying ? "Deploying..." : "Deploy"}</Button>
            </div>
            
        </div>
    )
}