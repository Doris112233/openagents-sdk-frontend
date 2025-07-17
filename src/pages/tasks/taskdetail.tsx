import { useParams } from "react-router-dom"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useBreadcrumb } from "@/components/breadcrumb-context"
import { Spinner } from "@/components/ui/spinner"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { RefreshCcw, Upload } from "lucide-react"

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
    const [task, setTask] = useState<any | null>(null)
    // const [samples, setSamples] = useState<string[]>([])
    const [loading, setLoading] = useState(true)
    const [loadingDocuments, setLoadingDocuments] = useState(true)
    const [documents, setDocuments] = useState<Array<{id: string, filename: string}>>([])
    const { setBreadcrumbInfo } = useBreadcrumb()

    const fileInputRef = useRef<HTMLInputElement>(null)

    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    // const [fineTuning, setFineTuning] = useState(false)
    const [deploying, setDeploying] = useState(false)
    const [baseModel, setBaseModel] = useState<string>("")
    const [status, setStatus] = useState<string>("")
    const [stage, setStage] = useState<string>("")
    const [baseModels, setBaseModels] = useState<any[]>([])

    const getBaseModels = () => {
        fetch(`http://172.207.17.188:8003/api/base-models`)
        .then(response => response.json())
        .then(data => {
            setBaseModels(data)
            console.log(data)
        })
        .catch(error => {
            console.error("Error fetching base models:", error)
        })
    }


    const loadTask = () => {
        fetch(`http://172.207.17.188:8003/api/tasks/${id}`)
        .then(response => response.json())
        .then(data => {
            setTask(data)
            setStage(data.stage)
            setStatus(getStatusByStage(data))
            if (data.fine_tune_info?.base_model) {
                setBaseModel(data.fine_tune_info.base_model)
            } else {
                setBaseModel("")
            }
            if (id) {
                setBreadcrumbInfo({ [`task-${id}`]: data.name })
            }
            setLoading(false)
        })
        .catch(error => {
            console.error("Error fetching task:", error)
        })
    }

    const loadDocuments = () => {
        fetch(`http://172.207.17.188:8003/api/tasks/${id}/documents`)
        .then(response => response.json())
        .then(data => {
            setDocuments(data)
            setLoadingDocuments(false)
        })
        .catch(error => {
            console.error("Error fetching documents:", error)
        })
    }

    const handleUpload = () => {
        if(!selectedFile || !id) return
        // setUploading(true)
        const formData = new FormData()
        formData.append("file", selectedFile)
        fetch(`http://172.207.17.188:8003/api/tasks/${id}/samples`, {
            method: "POST",
            body: formData
        })
        .then(response => {
            console.log(response)
            loadTask()
            loadDocuments()
            // setUploading(false)
        })
        .catch(error => {
            console.error("Error uploading file:", error)
            // setUploading(false)
        })
    }

    const handleStartFineTune = () => {
        fetch(`http://172.207.17.188:8003/api/tasks/${id}/fine_tunes?base_model=${encodeURIComponent(baseModel)}`, {
            method: "POST"
        })
        .then(response => {
            if (!response.ok) throw new Error("Fine-tune failed");
            return response.json();
        })
        .then(data => {
            console.log(data);
            loadTask();
        })
        .catch(error => {
            console.error("Error starting fine tune:", error);
        });
    }

    const handleDeploy = () => {
        setDeploying(true)
        fetch(`http://172.207.17.188:8003/api/tasks/${id}/deployments`, {
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
    const getProgressByStage = (task: any) => {
        switch (task.stage) {
            case "extract_content":
                return task.documents_info?.progress || 0;
            case "generate_sample":
                return task.samples_info?.progress || 0;
            case "fine_tune":
                return task.fine_tune_info?.progress || 0;
            case "deploy":
                return task.deployment_info?.progress || 0;
            default:
                return 0;
        }
    }


    useEffect(() => {
        if (!id) return
        loadTask()
        loadDocuments()
        getBaseModels()
    }, [id])

    if (loading) return <Spinner show={true} size="large" className="justify-center items-center h-screen"/>
    
    return (
        <div className="flex flex-col gap-4 justify-center items-center h-full w-full">
            <div className="flex flex-row w-full justify-start pr-8 pt-4">
                <Button size="sm" variant="outline" onClick={() => { loadTask(); loadDocuments(); }}>
                    <RefreshCcw className="h-4 w-4 mr-1" />
                    Refresh
                </Button>
            </div>
            {/* <h2 className="text-2xl font-bold">{task.name}</h2> */}
            <div className="flex flex-row gap-6 w-full">
                <div className="flex flex-col items-start gap-4 w-1/3 rounded-lg shadow p-6 h-fit">
                    <div className="flex flex-row justify-between w-full">
                        <label className="font-bold text-gray-500">Description</label>
                        <div className="text-md">{task.description}</div>
                    </div>
                    <Separator />
                    <div className="flex flex-row justify-between w-full">
                        <label className="font-bold text-gray-500 capitalize">{stage}</label> 
                        {/* <div className="text-md capitalize">{stage}</div> */}
                        <Badge variant="outline" className={`capitalize border-0 ${getStatusBadge(status)}`}>
                            {status}
                        </Badge>
                    </div>
                    {(stage === "extract_content" || stage === "generate_sample") && (
                        <div className="flex flex-row justify-between w-full items-center">
                            <Progress value={getProgressByStage(task)} className="w-2/3"/>
                            <div className="text-sm text-gray-500">{getProgressByStage(task)}%</div>
                        </div>
                    )}
                    <Separator />
                    <div className="flex flex-row justify-between w-full">
                        <label className="font-bold text-gray-500">Created</label>
                        <div className="text-md">{task.created_at.slice(0, 10)}, {task.created_at.slice(11, 16)}</div>
                    </div>
                    <Separator />
                    <div className="flex flex-row justify-between w-full">
                        <label className="font-bold text-gray-500">Updated</label>
                        <div className="text-md">{task.updated_at.slice(0, 10)}, {task.updated_at.slice(11, 16)}</div>
                    </div>
                </div>
                <div className="flex flex-col items-start gap-4 w-2/3 rounded-lg shadow p-6 h-fit">
                    <div className="flex flex-row justify-between w-full">
                        <label className="font-bold text-gray-500">Your documents</label>
                        <div className="flex flex-col gap-4">
                        {documents.length > 0 && !loadingDocuments ? (
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
                    <Separator />
                    <div className="flex flex-row justify-between w-full">
                        <label className="font-bold text-gray-500">Generate New Sample</label>
                        <div className="space-y-2">
                            <div className="flex gap-2 items-center">
                                <Button
                                    variant="outline"
                                    onClick={() => fileInputRef.current?.click()}
                                    // disabled={uploading}
                                >
                                    <Upload className="w-4 h-4 mr-2" />
                                    Select New Document
                                </Button>
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
                                    className="justify-end"
                                    onClick={handleUpload}
                                    disabled={!selectedFile}
                                >
                                    Upload
                                </Button>
                            </div>
                            {selectedFile && <span className="text-sm w-full text-end">{selectedFile.name}</span>}
                            </div>
                    </div>
                    
                    {stage === "generate_sample" && status === "success" && (
                        <>
                            <Separator />
                            <div className="flex flex-row justify-between w-full">
                                <label className="font-bold text-gray-500">Select Base Model</label>
                                <Select value={baseModel} onValueChange={setBaseModel}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Base Model" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {baseModels.map((model, index) => (
                                            <SelectItem key={index} value={model}>{model}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button size="sm" onClick={handleStartFineTune} disabled={baseModel === ""}>Start Fine Tune</Button>
                            </div>
                        </>
                    )}
                    {((stage === "fine_tune" && status === "success") || (stage === "deploy" && status !== "success")) && (
                        <>
                            <Separator />
                            <div className="flex flex-row justify-between w-full">
                                <label className="font-bold text-gray-500">Deploy</label>
                                <Button size="sm" onClick={handleDeploy}>{deploying ? "Deploying..." : "Deploy"}</Button>
                            </div>
                        </>
                    )}
                </div>
            </div>
            
        </div>
    )
}