import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-icon',
  standalone: true,
  template: `<span class="material-icons" [style.fontSize.px]="tamanho">{{ nome }}</span>`,
  styles: [
    `
      :host {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        vertical-align: middle;
        line-height: 1;
      }

      .material-icons {
        line-height: 1;
      }
    `,
  ],
})
export class MaterialIconComponent {
  @Input({ required: true }) nome!: string;
  @Input() tamanho = 24;
}
