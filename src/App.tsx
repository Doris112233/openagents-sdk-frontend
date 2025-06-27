import './App.css'
import './index.css'
import Layout from "./layout"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import Home from "@/pages/home"
import { TasksList } from "@/pages/tasks/taskslist"
import TaskDetail from "@/pages/tasks/taskdetail"
import Models from "@/pages/models"
import Flows from "@/pages/flows"
import Settings from "@/pages/settings"
import Playground from "@/pages/playground"

function App() {

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/playground" element={<Playground />} />
          <Route path="/tasks" element={<TasksList />} />
          <Route path="/tasks/:id" element={<TaskDetail />} />
          <Route path="/models" element={<Models />} />
          <Route path="/flows" element={<Flows />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App
