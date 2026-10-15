import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { RequireAuth } from '@/routes/RequireAuth'
import { ThemeSync } from '@/components/layout/ThemeSync'
import { LoginPage } from '@/features/auth/LoginPage'
import { RegisterPage } from '@/features/auth/RegisterPage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { CoursesPage } from '@/features/courses/CoursesPage'
import { CourseDetailPage } from '@/features/courses/CourseDetailPage'
import { CalendarPage } from '@/features/calendar/CalendarPage'
import { TasksPage } from '@/features/tasks/TasksPage'
import { DocumentsPage } from '@/features/documents/DocumentsPage'
import { NotesPage } from '@/features/notes/NotesPage'
import { StatisticsPage } from '@/features/statistics/StatisticsPage'
import { SettingsPage } from '@/features/settings/SettingsPage'
import { FocusPage } from '@/features/focus/FocusPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

export function App() {
  return (
    <>
      <ThemeSync />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/courses/:courseId" element={<CourseDetailPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/statistics" element={<StatisticsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/focus" element={<FocusPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </>
  )
}
