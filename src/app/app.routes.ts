import { Routes } from '@angular/router';
import { BdComponent } from './bd/bd.component';

export const routes: Routes = [
  {
    path: 'birthday/:id',
    component: BdComponent
  },
  {
    // id လုံးဝမပါဘဲ /birthday လို့ပဲလာရင်
    path: 'birthday',
    component: BdComponent 
  },
  {
    path: '',
    redirectTo: 'birthday',
    pathMatch: 'full'
  }
];