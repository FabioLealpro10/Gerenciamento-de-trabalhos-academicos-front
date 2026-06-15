import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { DisciplinasService } from '../../../core/services/disciplinas.service';
import { ProfessoresService } from '../../../core/services/professores.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  DisciplinaFormFields,
  validarCadastroDisciplina,
  validarEdicaoDisciplina,
} from '../../../core/utils/disciplina-form.validation';
import { DisciplinaListItem } from '../../../core/models/disciplina.model';
import { ProfessorListItem } from '../../../core/models/professor.model';
import { PAGINA_INICIAL } from '../../../core/models/page.model';
import { mensagemErroHttp } from '../../../core/utils/http-error.util';
import { SelecaoPesquisaComponent } from '../../../shared/selecao-pesquisa/selecao-pesquisa.component';
import { OpcaoSelecao } from '../../../shared/selecao-pesquisa/opcao-selecao.model';

@Component({
  selector: 'app-disciplinas-create',
  standalone: true,
  imports: [FormsModule, RouterLink, SelecaoPesquisaComponent],
  templateUrl: './disciplinas-create.component.html',
  styleUrl: './disciplinas-create.component.css',
})
export class DisciplinasCreateComponent implements OnInit {
  private readonly disciplinasService = inject(DisciplinasService);
  private readonly professoresService = inject(ProfessoresService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);

  form: DisciplinaFormFields = {
    nome: '',
    dataInicio: '',
    dataFim: '',
    idProfessor: null,
  };

  modoEdicao = false;
  disciplinaId: string | null = null;
  professores: ProfessorListItem[] = [];
  loading = false;
  loadingProfessores = false;
  errorMessage = '';
  successMessage = '';

  get opcoesProfessores(): OpcaoSelecao[] {
    return this.professores.map((professor) => ({
      id: professor.id!,
      titulo: professor.nome,
      subtitulo: professor.email,
    }));
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.modoEdicao = true;
      this.disciplinaId = id;
    }

    this.carregarProfessores(id);
  }

  salvar(): void {
    this.errorMessage = '';
    this.successMessage = '';

    const validacao = this.modoEdicao
      ? validarEdicaoDisciplina(this.form)
      : validarCadastroDisciplina(this.form);

    if (validacao) {
      this.errorMessage = validacao;
      this.cdr.detectChanges();
      return;
    }

    if (!this.authService.getToken()) {
      this.errorMessage = 'Sessão expirada. Faça login novamente para continuar.';
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    this.cdr.detectChanges();

    const payload = {
      nome: this.form.nome.trim(),
      dataInicio: this.form.dataInicio,
      dataFim: this.form.dataFim,
      idProfessor: this.form.idProfessor!,
    };

    const request$ = this.modoEdicao
      ? this.disciplinasService.atualizar(this.disciplinaId!, payload)
      : this.disciplinasService.cadastrar(payload);

    request$
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: () => {
          if (this.modoEdicao) {
            this.router.navigate(['/disciplinas'], { queryParams: { msg: 'edicao' } });
            return;
          }

          this.successMessage = 'Cadastro realizado com sucesso!';
          this.limparFormulario();
        },
        error: (err: HttpErrorResponse) => {
          this.errorMessage = mensagemErroHttp(err, {
            temToken: !!this.authService.getToken(),
            contexto: 'salvar',
            entidade: 'disciplina',
            modoEdicao: this.modoEdicao,
          });
        },
      });
  }

  private limparFormulario(): void {
    this.form = {
      nome: '',
      dataInicio: '',
      dataFim: '',
      idProfessor: null,
    };
  }

  private preencherFormulario(disciplina: DisciplinaListItem): void {
    this.form = {
      nome: disciplina.nome,
      dataInicio: this.formatarDataInput(disciplina.dataInicio),
      dataFim: this.formatarDataInput(disciplina.dataFim),
      idProfessor:
        disciplina.idProfessor ??
        this.resolverIdProfessorPorNome(disciplina.professor),
    };
  }

  private resolverIdProfessorPorNome(nome?: string): number | null {
    if (!nome?.trim()) {
      return null;
    }

    const professor = this.professores.find(
      (p) => p.nome.trim().toLowerCase() === nome.trim().toLowerCase(),
    );

    return professor?.id != null ? Number(professor.id) : null;
  }

  private formatarDataInput(data?: string): string {
    if (!data) {
      return '';
    }
    return data.length >= 10 ? data.slice(0, 10) : data;
  }

  private carregarProfessores(disciplinaId: string | null): void {
    if (!this.authService.getToken()) {
      this.errorMessage =
        'Token não encontrado. Faça login como ADMIN para continuar.';
      this.cdr.detectChanges();
      return;
    }

    this.loadingProfessores = true;
    this.cdr.detectChanges();

    this.professoresService
      .listarPagina({ ...PAGINA_INICIAL, size: 100 })
      .pipe(
        finalize(() => {
          this.loadingProfessores = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (pagina) => {
          this.professores = pagina.itens.filter((p) => p.id != null);

          if (this.modoEdicao && disciplinaId) {
            const disciplina = history.state?.['disciplina'] as
              | DisciplinaListItem
              | undefined;

            if (disciplina) {
              this.preencherFormulario(disciplina);
            } else {
              this.carregarDisciplinaDaLista(disciplinaId);
            }
          }

          if (this.professores.length === 0) {
            this.errorMessage =
              'Nenhum professor cadastrado. Cadastre um professor antes de continuar.';
          }
        },
        error: (err: HttpErrorResponse) => {
          this.errorMessage = mensagemErroHttp(err, {
            temToken: !!this.authService.getToken(),
            contexto: 'listar',
            entidade: 'professores',
          });
        },
      });
  }

  private carregarDisciplinaDaLista(id: string): void {
    this.disciplinasService.buscarPorId(id).subscribe({
      next: (disciplina) => {
        this.preencherFormulario(disciplina);
      },
      error: () => {
        this.errorMessage = 'Erro ao carregar dados da disciplina para edição.';
      },
    });
  }
}
