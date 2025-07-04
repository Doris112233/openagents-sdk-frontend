import { useLocation, Link } from "react-router-dom"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { useBreadcrumb } from "./breadcrumb-context"

interface BreadcrumbItem {
  label: string
  path: string
  isCurrentPage: boolean
}

export function DynamicBreadcrumb() {
  const location = useLocation()
  const { getBreadcrumbInfo } = useBreadcrumb()
  
  const generateBreadcrumbs = (pathname: string): BreadcrumbItem[] => {
    const segments = pathname.split('/').filter(segment => segment !== '')
    
    if (segments.length === 0) {
      return [{ label: 'Home', path: '/', isCurrentPage: true }]
    }
    
    const breadcrumbs: BreadcrumbItem[] = []
    let currentPath = ''
    
    // Add home as first item
    breadcrumbs.push({ label: 'OpenAgents SDK', path: '/', isCurrentPage: false })
    
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`
      
      // Convert segment to readable label
      let label = segment
      
      // Handle special cases
      if (segment === 'tasks') {
        label = 'Tasks'
      } else if (segment === 'models') {
        label = 'Models'
      } else if (segment === 'playground') {
        label = 'Playground'
      } else if (segment === 'home') {
        label = 'Home'
      } else if (segment === 'taskdetail') {
        label = 'Task Detail'
      } else {
        // Check if this is a task ID (UUID or numeric ID)
        if (segments[index - 1] === 'tasks' && /^[0-9a-f-]+$/i.test(segment)) {
          // Try to get the task name from context, fallback to ID
          const taskName = getBreadcrumbInfo(`task-${segment}`)
          label = taskName || `Task ${segment}`
        } else {
          // Capitalize first letter and replace hyphens/underscores with spaces
          label = segment
            .replace(/[-_]/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase())
        }
      }
      
      breadcrumbs.push({
        label,
        path: currentPath,
        isCurrentPage: index === segments.length - 1
      })
    })
    
    return breadcrumbs
  }
  
  const breadcrumbs = generateBreadcrumbs(location.pathname)
  
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((item, index) => (
          <div key={item.path} className="flex items-center">
            <BreadcrumbItem className="hidden md:block">
              {item.isCurrentPage ? (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link to={item.path}>{item.label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {index < breadcrumbs.length - 1 && (
              <BreadcrumbSeparator className="hidden md:block" />
            )}
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
} 