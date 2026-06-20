import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-confirmacao-exclusao',
  standalone: true,
  template: `
    @if (aberto) {
      <div class="overlay" (click)="cancelar.emit()">
        <div
          class="dialogo"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirmacao-titulo"
          (click)="$event.stopPropagation()"
        >
          <h2 id="confirmacao-titulo">{{ titulo }}</h2>
          <p class="mensagem">{{ mensagem }}</p>
          @if (detalhe) {
            <p class="detalhe">{{ detalhe }}</p>
          }
          <div class="acoes">
            <button type="button" class="secondary" (click)="cancelar.emit()">
              Cancelar
            </button>
            <button type="button" class="danger" (click)="confirmar.emit()">
              Excluir
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .overlay {
        position: fixed;
        inset: 0;
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        background: rgba(15, 23, 42, 0.45);
      }

      .dialogo {
        width: 100%;
        max-width: 420px;
        background: #fff;
        border-radius: 12px;
        padding: 24px;
        box-shadow: 0 20px 40px rgba(15, 23, 42, 0.18);
      }

      h2 {
        margin: 0 0 12px;
        font-size: 20px;
        color: #0f172a;
      }

      .mensagem {
        margin: 0;
        color: #334155;
        line-height: 1.5;
      }

      .detalhe {
        margin: 12px 0 0;
        padding: 12px;
        border-radius: 8px;
        background: #f8fafc;
        color: #475569;
        font-size: 14px;
      }

      .acoes {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 24px;
      }

      button {
        border: none;
        border-radius: 8px;
        padding: 10px 16px;
        font-weight: 600;
        cursor: pointer;
      }

      .secondary {
        background: #e2e8f0;
        color: #0f172a;
      }

      .secondary:hover {
        background: #cbd5e1;
      }

      .danger {
        background: #dc2626;
        color: #fff;
      }

      .danger:hover {
        background: #b91c1c;
      }
    `,
  ],
})
export class ConfirmacaoExclusaoComponent {
  @Input() aberto = false;
  @Input() titulo = 'Confirmar exclusão';
  @Input() mensagem = 'Deseja excluir esta funcionalidade?';
  @Input() detalhe = '';

  @Output() confirmar = new EventEmitter<void>();
  @Output() cancelar = new EventEmitter<void>();
}
