import { Routes } from '@angular/router';
import { Dashboard } from './pages/dashboard/dashboard';
import { Tasks } from './pages/tasks/tasks';
import { Projects } from './pages/projects/projects';
import { ProjectDetail } from './pages/project-detail/project-detail';
import { Planning } from './pages/planning/planning';
import { Collaborations } from './pages/collaborations/collaborations';
import { Files } from './pages/files/files';
import { Analytics } from './pages/analytics/analytics';
import { Documents } from './pages/documents/documents';
import { Resources } from './pages/resources/resources';
import { Integrations } from './pages/integrations/integrations';
import { Security } from './pages/security/security';
import { Support } from './pages/support/support';
import { Settings } from './pages/settings/settings';
import { LoginComponent } from './pages/login/login';
import { RegisterComponent } from './pages/register/register';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },
  { path: 'tasks', component: Tasks, canActivate: [authGuard] },
  { path: 'projects', component: Projects, canActivate: [authGuard] },
  { path: 'projects/:id', component: ProjectDetail, canActivate: [authGuard] },
  { path: 'planning', component: Planning, canActivate: [authGuard] },
  { path: 'collaborations', component: Collaborations, canActivate: [authGuard] },
  { path: 'files', component: Files, canActivate: [authGuard] },
  { path: 'analytics', component: Analytics, canActivate: [authGuard] },
  { path: 'documents', component: Documents, canActivate: [authGuard] },
  { path: 'resources', component: Resources, canActivate: [authGuard] },
  { path: 'integrations', component: Integrations, canActivate: [authGuard] },
  { path: 'security', component: Security, canActivate: [authGuard] },
  { path: 'support', component: Support, canActivate: [authGuard] },
  { path: 'settings', component: Settings, canActivate: [authGuard] }
];
