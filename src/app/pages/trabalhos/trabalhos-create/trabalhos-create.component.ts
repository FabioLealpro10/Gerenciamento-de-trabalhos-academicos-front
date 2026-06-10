import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize, switchMap } from 'rxjs';
import { TrabalhosService } from '../../../core/services/trabalhos.service';
import { DisciplinasService } from '../../../core/services/disciplinas.service';
import { ProfessorContextService } from '../../../core/services/professor-context.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  TrabalhoFormFields,
  validarCadastroTrabalho,
  validarEdicaoTrabalho,
} from '../../../core/utils/trabalho-form.validation';
import { TrabalhoListItem } from '../../../core/models/trabalho.model';
import { DisciplinaListItem } from '../../../core/models/disciplina.model';
import { mensagemErroHttp } from '../../../core/utils/http-error.util';

@Component({
  selector: 'app-trabalhos-create',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './trabalhos-create.component.html',
  styleUrl: './trabalhos-create.component.css',
})
export class TrabalhosCreateComponent implements OnInit {
  private readonly trabalhosService = inject(TrabalhosService);
  private readonly disciplinasService = inject(DisciplinasService);
  private readonly professorContext = inject(ProfessorContextService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);

  form: TrabalhoFormFields = {
    titulo: '',
    descricao: '',
    linkArquivoTrabalho: '',
    dataInicio: '',
    dataFim: '',
    disciplinaId: null,
  };

  modoEdicao = false;
  modoProfessor = false;
  disciplinaIdRota: string | null = null;
  disciplinaRota: DisciplinaListItem | null = null;
  trabalhoId: string | null = null;
  disciplinas: DisciplinaListItem[] = [];
  loading = false;
  loadingDisciplinas = false;
  errorMessage = '';

  get linkVoltar(): string {
    if (this.modoProfessor && this.disciplinaIdRota) {
      return `/professor/disciplinas/${this.disciplinaIdRota}/trabalhos`;
    }
    if (this.authService.getTipoUsuario() === 'ADMIN') {
      return '/trabalhos';
    }
    return '/dashboard';
  }

  get disciplinaBloqueada(): boolean {
    return this.modoProfessor && !!this.disciplinaIdRota;
  }

  ngOnInit(): void {
    this.modoProfessor = this.router.url.includes('/professor/');
    this.disciplinaIdRota = this.route.snapshot.paramMap.get('disciplinaId');

    if (this.disciplinaIdRota) {
      this.form.disciplinaId = Number(this.disciplinaIdRota);
      this.disciplinaRota =
        (history.state?.['disciplina'] as DisciplinaListItem | undefined) ?? null;
    }

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.modoEdicao = true;
      this.trabalhoId = id;
    }

    this.carregarDisciplinas(id);
  }

  salvar(): void {
    this.errorMessage = '';

    const validacao = this.modoEdicao
      ? validarEdicaoTrabalho(this.form)
      : validarCadastroTrabalho(this.form);

    if (validacao) {
      this.errorMessage = validacao;
      this.cdr.detectChanges();
      return;
    }

    if (!this.authService.getToken()) {
      this.errorMessage =
        'Token não encontrado. Faça logout, faça login novamente e tente de novo.';
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    this.cdr.detectChanges();

    const payload = {
      titulo: this.form.titulo.trim(),
      descricao: this.form.descricao.trim(),
      linkArquivoTrabalho: this.form.linkArquivoTrabalho.trim(),
      dataInicio: this.form.dataInicio,
      dataFim: this.form.dataFim,
      disciplinaId: this.form.disciplinaId!,
    };

    const request$ = this.modoEdicao
      ? this.trabalhosService.atualizar(this.trabalhoId!, payload)
      : this.trabalhosService.cadastrar(payload);

    request$
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: () => {
          const msg = this.modoEdicao ? 'edicao' : 'cadastro';
          const destino = this.obterDestinoAposSalvar();
          this.router.navigate([destino], { queryParams: { msg } });
        },
        error: (err: HttpErrorResponse) => {
          this.errorMessage = mensagemErroHttp(err, {
            temToken: !!this.authService.getToken(),
            contexto: 'salvar',
            entidade: 'trabalho',
            modoEdicao: this.modoEdicao,
          });
        },
      });
  }

  private obterDestinoAposSalvar(): string {
    if (this.modoProfessor && this.disciplinaIdRota) {
      return `/professor/disciplinas/${this.disciplinaIdRota}/trabalhos`;
    }
    if (this.authService.getTipoUsuario() === 'ADMIN') {
      return '/trabalhos';
    }
    return '/dashboard';
  }

  private preencherFormulario(trabalho: TrabalhoListItem): void {
    this.form = {
      titulo: trabalho.titulo,
      descricao: trabalho.descricao ?? '',
      linkArquivoTrabalho: trabalho.linkArquivoTrabalho ?? '',
      dataInicio: this.formatarDataInput(trabalho.dataInicio),
      dataFim: this.formatarDataInput(trabalho.dataFim),
      disciplinaId:
        trabalho.disciplinaId ??
        this.resolverDisciplinaIdPorNome(trabalho.disciplinaNome) ??
        (this.disciplinaIdRota ? Number(this.disciplinaIdRota) : null),
    };
  }

  private resolverDisciplinaIdPorNome(nome?: string): number | null {
    if (!nome?.trim()) {
      return null;
    }

    const disciplina = this.disciplinas.find(
      (d) => d.nome.trim().toLowerCase() === nome.trim().toLowerCase(),
    );

    return disciplina?.id != null ? Number(disciplina.id) : null;
  }

  private formatarDataInput(data?: string): string {
    if (!data) {
      return '';
    }
    return data.length >= 10 ? data.slice(0, 10) : data;
  }

  private carregarDisciplinas(trabalhoId: string | null): void {
    if (!this.authService.getToken()) {
      this.errorMessage =
        'Token não encontrado. Faça login para continuar.';
      this.cdr.detectChanges();
      return;
    }

    this.loadingDisciplinas = true;
    this.cdr.detectChanges();

    const disciplinas$ = this.modoProfessor
      ? this.professorContext.obterIdProfessor().pipe(
          switchMap((idProfessor) =>
            this.disciplinasService.listarPorProfessor(idProfessor),
          ),
        )
      : this.disciplinasService.listar();

    disciplinas$
      .pipe(
        finalize(() => {
          this.loadingDisciplinas = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (disciplinas) => {
          this.disciplinas = disciplinas.filter((d) => d.id != null);

          if (this.modoEdicao && trabalhoId) {
            const trabalho = history.state?.['trabalho'] as
              | TrabalhoListItem
              | undefined;

            if (trabalho) {
              this.preencherFormulario(trabalho);
            } else {
              this.carregarTrabalho(trabalhoId);
            }
          } else if (this.disciplinaIdRota) {
            this.form.disciplinaId = Number(this.disciplinaIdRota);
          }

          if (this.disciplinas.length === 0) {
            this.errorMessage = this.modoProfessor
              ? 'Nenhuma disciplina vinculada ao seu perfil.'
              : 'Nenhuma disciplina cadastrada. Cadastre uma disciplina antes de continuar.';
          }
        },
        error: (err: unknown) => {
          if (err instanceof Error && !(err instanceof HttpErrorResponse)) {
            this.errorMessage = err.message;
            return;
          }

          this.errorMessage = mensagemErroHttp(err as HttpErrorResponse, {
            temToken: !!this.authService.getToken(),
            contexto: 'listar',
            entidade: 'disciplinas',
          });
        },
      });
  }

  private carregarTrabalho(id: string): void {
    this.trabalhosService.buscarPorId(id).subscribe({
      next: (trabalho) => {
        this.preencherFormulario(trabalho);
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Erro ao carregar dados do trabalho para edição.';
        this.cdr.detectChanges();
      },
    });
  }
}
