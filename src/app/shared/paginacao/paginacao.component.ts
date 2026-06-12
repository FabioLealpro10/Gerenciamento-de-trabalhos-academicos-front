import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TAMANHOS_PAGINA } from '../../core/models/page.model';

/**
 * Barra de paginação reutilizável: navegação entre páginas e
 * seleção da quantidade de itens por página.
 */
@Component({
  selector: 'app-paginacao',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './paginacao.component.html',
  styleUrl: './paginacao.component.css',
})
export class PaginacaoComponent {
  @Input() page = 0;
  @Input() size = 10;
  @Input() totalPages = 0;
  @Input() totalElements = 0;
  @Input() disabled = false;

  @Output() pageChange = new EventEmitter<number>();
  @Output() sizeChange = new EventEmitter<number>();

  readonly tamanhos = TAMANHOS_PAGINA;

  get paginaAtualExibicao(): number {
    return this.totalPages === 0 ? 0 : this.page + 1;
  }

  get podeVoltar(): boolean {
    return !this.disabled && this.page > 0;
  }

  get podeAvancar(): boolean {
    return !this.disabled && this.page < this.totalPages - 1;
  }

  irParaPrimeira(): void {
    if (this.podeVoltar) {
      this.pageChange.emit(0);
    }
  }

  voltar(): void {
    if (this.podeVoltar) {
      this.pageChange.emit(this.page - 1);
    }
  }

  avancar(): void {
    if (this.podeAvancar) {
      this.pageChange.emit(this.page + 1);
    }
  }

  irParaUltima(): void {
    if (this.podeAvancar) {
      this.pageChange.emit(this.totalPages - 1);
    }
  }

  aoMudarTamanho(novoTamanho: number): void {
    this.sizeChange.emit(Number(novoTamanho));
  }
}
