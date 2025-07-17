import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type Message = {
  role: "user" | "assistant";
  content: string;
  id: string;
};

interface Task {
  created_at: string;
  updated_at: string;
  deployment_info: {
    created_at: string;
    status: string;
    updated_at: string;
  };
  description: string;
  fine_tune_info: {
    lora_name: string;
  };
  id: string;
  name: string;
}

export default function Playground() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadModels = () => {
    fetch("http://172.207.17.188:8003/api/tasks")
      .then((response) => response.json())
      .then((data: Task[]) => {
        const availableTasks = data.filter(
          (task) => task.deployment_info?.status == "success"
        );
        setTasks(availableTasks);
        if (availableTasks.length > 0) {
          setSelectedTask(availableTasks[0]);
        }
      });
  };

  useEffect(() => {
    loadModels();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      role: "user",
      content: input,
      id: Date.now().toString(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");

    if (!selectedTask) {
      console.error("No task selected");
      return;
    }

    const res = await fetch(
      `http://172.207.17.188:8003/api/tasks/${selectedTask.id}/v1/chat/completions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: selectedTask.fine_tune_info.lora_name,
          messages: newMessages,
          chat_template_kwargs: {
            enable_thinking: false,
          },
          stream: true,
        }),
      }
    );

    if (!res.body) {
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { value, done: doneReading } = await reader.read();
      if (doneReading) break;
      if (value) {
        const rawChunk = decoder.decode(value).trim();

        const dataChunks = rawChunk.split(/\r?\n/).map((line) => line.trim());

        for (const chunk of dataChunks) {
          try {
            if (chunk === "[DONE]") {
              console.log("Stream finished; exiting loop.");
              break;
            }

            if (chunk.startsWith("data:")) {
              const jsonChunk = JSON.parse(chunk.replace(/^data:\s*/, ""));
              const delta = jsonChunk.choices?.[0]?.delta || {};
              const content = delta.content;
              const finishReason = jsonChunk.choices?.[0]?.finish_reason;

              if (content !== undefined && content !== "") {
                setMessages((prevMessages) => {
                  const lastMessage = prevMessages[prevMessages.length - 1];

                  if (lastMessage.role === "user") {
                    const assistantMessage: Message = {
                      role: "assistant",
                      content: content,
                      id: `assistant-${Date.now()}`,
                    };
                    return [...prevMessages, assistantMessage];
                  } else if (lastMessage.role === "assistant") {
                    const updatedMessages = [...prevMessages];
                    updatedMessages[updatedMessages.length - 1] = {
                      ...lastMessage,
                      content: lastMessage.content + content,
                    };
                    return updatedMessages;
                  }
                  return prevMessages;
                });
              }

              if (finishReason === "stop") {
                break;
              }
            }
          } catch (error) {
            console.error("Failed to parse chunk:", error);
          }
        }
      }
    }
  };

  return (
    <div className="flex flex-col gap-4 h-full w-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`flex items-start max-w-3/4 ${
                message.role === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <Avatar className="mx-2">
                <AvatarFallback>
                  {message.role === "user" ? "U" : "A"}
                </AvatarFallback>
              </Avatar>
              <div
                className={`px-4 py-2 rounded-lg ${
                  message.role === "user"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-800"
                }`}
              >
                {message.role === "assistant" ? (
                  <div className="text-left">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                ) : (
                  message.content
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Select 
            value={selectedTask?.id || ""} 
            onValueChange={(value) => {
              const task = tasks.find(t => t.id === value);
              setSelectedTask(task || null);
            }}
          >
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent>
              {tasks.map((task) => (
                <SelectItem key={task.id} value={task.id}>
                  {task.fine_tune_info?.lora_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <Button onClick={handleSend}>Send</Button>
        </div>
      </div>
    </div>
  );
}
