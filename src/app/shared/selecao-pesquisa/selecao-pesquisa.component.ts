import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { OpcaoSelecao } from './opcao-selecao.model';

@Component({
  selector: 'app-selecao-pesquisa',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './selecao-pesquisa.component.html',
  styleUrl: './selecao-pesquisa.component.css',
})
export class SelecaoPesquisaComponent {
  @Input() rotulo = '';
  @Input() placeholder = 'Digite para pesquisar...';
  @Input() opcoes: OpcaoSelecao[] = [];
  @Input() selecionadoId: number | string | null = null;
  @Input() disabled = false;

  @Output() selecionadoIdChange = new EventEmitter<number | string | null>();

  pesquisa = '';
  listaAberta = false;

  get opcaoSelecionada(): OpcaoSelecao | null {
    if (this.selecionadoId == null) {
      return null;
    }

    return (
      this.opcoes.find((opcao) => String(opcao.id) === String(this.selecionadoId)) ??
      null
    );
  }

  get opcoesFiltradas(): OpcaoSelecao[] {
    const termo = this.pesquisa.trim().toLowerCase();

    if (!termo) {
      return this.opcoes;
    }

    return this.opcoes.filter((opcao) => {
      const titulo = opcao.titulo.toLowerCase();
      const subtitulo = opcao.subtitulo?.toLowerCase() ?? '';
      return titulo.includes(termo) || subtitulo.includes(termo);
    });
  }

  abrirLista(): void {
    if (this.disabled) {
      return;
    }

    this.listaAberta = true;
  }

  fecharLista(): void {
    setTimeout(() => {
      this.listaAberta = false;
    }, 150);
  }

  selecionar(opcao: OpcaoSelecao): void {
    this.selecionadoId = opcao.id;
    this.selecionadoIdChange.emit(opcao.id);
    this.pesquisa = '';
    this.listaAberta = false;
  }

  limparSelecao(): void {
    this.selecionadoId = null;
    this.selecionadoIdChange.emit(null);
    this.pesquisa = '';
    this.listaAberta = false;
  }
}
