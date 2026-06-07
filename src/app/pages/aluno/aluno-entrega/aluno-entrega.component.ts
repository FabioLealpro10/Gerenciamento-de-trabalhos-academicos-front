import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize, switchMap } from 'rxjs';
import { EntregasService } from '../../../core/services/entregas.service';
import { AlunoContextService } from '../../../core/services/aluno-context.service';
import { AuthService } from '../../../core/services/auth.service';
import { EntregaListItem, TrabalhoListItem } from '../../../core/models/trabalho.model';
import { DisciplinaListItem } from '../../../core/models/disciplina.model';
import { dataEntregaHoje, formatarDataBr } from '../../../core/utils/date.util';
import { entregaFoiCorrigida } from '../../../core/utils/entrega.util';
import { mensagemErroHttp } from '../../../core/utils/http-error.util';

@Component({
  selector: 'app-aluno-entrega',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './aluno-entrega.component.html',
  styleUrl: './aluno-entrega.component.css',
})
export class AlunoEntregaComponent implements OnInit {
  private readonly entregasService = inject(EntregasService);
  private readonly alunoContext = inject(AlunoContextService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);

  disciplinaId: string | null = null;
  trabalhoId: string | null = null;
  alunoId: number | null = null;
  trabalho: TrabalhoListItem | null = null;
  disciplina: DisciplinaListItem | null = null;
  entrega: EntregaListItem | null = null;

  linkArquivo = '';
  dataEntregaAutomatica = dataEntregaHoje();

  loading = false;
  loadingDados = false;
  errorMessage = '';
  successMessage = '';

  readonly formatarDataBr = formatarDataBr;

  get linkVoltar(): string {
    return this.disciplinaId
      ? `/aluno/disciplinas/${this.disciplinaId}/trabalhos`
      : '/dashboard';
  }

  get tituloTrabalho(): string {
    return this.trabalho?.titulo ?? this.entrega?.trabalhoTitulo ?? 'Trabalho';
  }

  get jaEntregou(): boolean {
    return this.entrega != null;
  }

  get foiCorrigido(): boolean {
    return entregaFoiCorrigida(this.entrega);
  }

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      void this.router.navigate(['/login']);
      return;
    }

    this.disciplinaId = this.route.snapshot.paramMap.get('disciplinaId');
    this.trabalhoId = this.route.snapshot.paramMap.get('trabalhoId');

    if (!this.disciplinaId || !this.trabalhoId) {
      void this.router.navigate(['/dashboard']);
      return;
    }

    this.trabalho =
      (history.state?.['trabalho'] as TrabalhoListItem | undefined) ?? null;
    this.disciplina =
      (history.state?.['disciplina'] as DisciplinaListItem | undefined) ?? null;

    this.dataEntregaAutomatica = dataEntregaHoje();
    this.carregar();
  }

  carregar(): void {
    this.errorMessage = '';

    if (!this.authService.getToken()) {
      this.errorMessage =
        'Token não encontrado. Faça logout, login como ALUNO e acesse novamente.';
      this.cdr.detectChanges();
      return;
    }

    if (!this.trabalhoId) {
      return;
    }

    this.loadingDados = true;
    this.cdr.detectChanges();

    this.alunoContext
      .obterIdAluno()
      .pipe(
        switchMap((idAluno) => {
          this.alunoId = idAluno;
          return this.entregasService.buscarPorAlunoTrabalho(
            idAluno,
            this.trabalhoId!,
          );
        }),
        finalize(() => {
          this.loadingDados = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (entrega) => {
          this.entrega = entrega;
          if (entrega?.linkArquivo) {
            this.linkArquivo = entrega.linkArquivo;
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
            entidade: 'entrega',
          });
        },
      });
  }

  salvar(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.jaEntregou && this.foiCorrigido) {
      this.errorMessage =
        'Esta entrega já foi corrigida pelo professor e não pode mais ser alterada.';
      this.cdr.detectChanges();
      return;
    }

    if (!this.linkArquivo.trim()) {
      this.errorMessage = 'Informe o link do arquivo da entrega.';
      this.cdr.detectChanges();
      return;
    }

    if (!this.authService.getToken()) {
      this.errorMessage =
        'Token não encontrado. Faça logout, login como ALUNO e tente novamente.';
      this.cdr.detectChanges();
      return;
    }

    if (!this.trabalhoId) {
      this.errorMessage = 'Trabalho não identificado.';
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    this.dataEntregaAutomatica = dataEntregaHoje();
    this.cdr.detectChanges();

    const payloadAtualizacao = {
      linkArquivo: this.linkArquivo.trim(),
      dataEntrega: this.dataEntregaAutomatica,
    };

    const salvarComId = (idAluno: number) => {
      const request$ = this.jaEntregou
        ? this.entregasService.atualizar(
            idAluno,
            this.trabalhoId!,
            payloadAtualizacao,
          )
        : this.entregasService.cadastrar({
            ...payloadAtualizacao,
            trabalhoId: Number(this.trabalhoId),
            alunoId: idAluno,
          });

      request$
        .pipe(
          finalize(() => {
            this.loading = false;
            this.cdr.detectChanges();
          }),
        )
        .subscribe({
          next: () => {
            this.successMessage = this.jaEntregou
              ? 'Entrega atualizada com sucesso!'
              : 'Entrega registrada com sucesso!';
            this.carregar();
          },
          error: (err: HttpErrorResponse) => {
            if (err.status === 403) {
              this.errorMessage =
                'Esta entrega já foi corrigida pelo professor e não pode mais ser alterada.';
              this.carregar();
              return;
            }

            if (err.status === 409 && !this.jaEntregou) {
              this.errorMessage = 'Este trabalho já foi entregue.';
              this.carregar();
              return;
            }

            this.errorMessage = mensagemErroHttp(err, {
              temToken: !!this.authService.getToken(),
              contexto: 'salvar',
              entidade: 'entrega',
            });
          },
        });
    };

    if (this.alunoId != null) {
      salvarComId(this.alunoId);
      return;
    }

    this.alunoContext.obterIdAluno().subscribe({
      next: (idAluno) => {
        this.alunoId = idAluno;
        salvarComId(idAluno);
      },
      error: (err: unknown) => {
        this.loading = false;
        this.errorMessage =
          err instanceof Error
            ? err.message
            : 'Não foi possível identificar o aluno logado.';
        this.cdr.detectChanges();
      },
    });
  }
}
