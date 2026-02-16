import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DataService } from '../../services/data';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  private readonly dataService = inject(DataService);

  readonly cellLines = this.dataService.availableCellLines;
  readonly loading = this.dataService.loading;

  ngOnInit(): void {
    this.dataService.loadData();
  }
}
