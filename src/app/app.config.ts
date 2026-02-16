import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { PlotlyService } from 'angular-plotly.js';
import * as PlotlyJS from 'plotly.js-dist-min';

import { routes } from './app.routes';

PlotlyService.setPlotly(PlotlyJS);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withHashLocation()),
    provideHttpClient(),
  ],
};
