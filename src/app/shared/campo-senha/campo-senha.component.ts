import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MaterialIconComponent } from '../icons/material-icon.component';

@Component({
  selector: 'app-campo-senha',
  standalone: true,
  imports: [FormsModule, MaterialIconComponent],
  template: `
    <div class="campo-senha">
      <input
        [type]="mostrarSenha ? 'text' : 'password'"
        [id]="inputId"
        [name]="name"
        [ngModel]="valor"
        (ngModelChange)="valorChange.emit($event)"
        [placeholder]="placeholder"
        [autocomplete]="autocomplete"
        [disabled]="disabled"
        [required]="required"
      />
      <button
        type="button"
        class="toggle"
        (click)="alternarVisibilidade()"
        [attr.aria-label]="mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'"
        [disabled]="disabled"
      >
        <app-icon
          [nome]="mostrarSenha ? 'visibility_off' : 'visibility'"
          [tamanho]="20"
        />
      </button>
    </div>
  `,
  styles: [
    `
      .campo-senha {
        position: relative;
        display: flex;
        align-items: center;
      }

      input {
        width: 100%;
        padding: 10px 44px 10px 12px;
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        box-sizing: border-box;
      }

      .toggle {
        position: absolute;
        right: 8px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border: none;
        border-radius: 6px;
        background: transparent;
        color: #64748b;
        cursor: pointer;
      }

      .toggle:hover:not(:disabled) {
        background: #f1f5f9;
        color: #334155;
      }

      .toggle:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    `,
  ],
})
export class CampoSenhaComponent {
  @Input() valor = '';
  @Output() valorChange = new EventEmitter<string>();
  @Input() name = '';
  @Input() inputId = '';
  @Input() placeholder = '';
  @Input() autocomplete = 'current-password';
  @Input() disabled = false;
  @Input() required = false;

  mostrarSenha = false;

  alternarVisibilidade(): void {
    this.mostrarSenha = !this.mostrarSenha;
  }
}
