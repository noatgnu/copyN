import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { ScatterPlot } from './components/scatter-plot/scatter-plot';
import { BarChart } from './components/bar-chart/bar-chart';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: Home },
  { path: 'scatter-plot', component: ScatterPlot },
  { path: 'bar-chart', component: BarChart },
];
