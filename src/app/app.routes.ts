import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { adminGuard } from './core/auth/admin.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'lists',
    loadComponent: () => import('./features/grading-lists/grading-lists.component').then(m => m.GradingListsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'editor',
    loadComponent: () => import('./features/grade-editor/grade-editor.component').then(m => m.GradeEditorComponent),
    canActivate: [authGuard]
  },
  {
    path: 'editor/:id',
    loadComponent: () => import('./features/grade-editor/grade-editor.component').then(m => m.GradeEditorComponent),
    canActivate: [authGuard]
  },
  {
    path: 'explore',
    loadComponent: () => import('./features/public-view/public-view.component').then(m => m.PublicViewComponent),
    canActivate: [authGuard]
  },
  {
    path: 'list/:id',
    loadComponent: () => import('./features/public-view/list-detail.component').then(m => m.ListDetailComponent),
    canActivate: [authGuard]
  },
  {
    path: 'admin',
    loadComponent: () => import('./features/admin/admin.component').then(m => m.AdminComponent),
    canActivate: [authGuard, adminGuard]
  },
  { path: '**', redirectTo: '' }
];
