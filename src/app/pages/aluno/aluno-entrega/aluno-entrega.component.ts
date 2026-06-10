import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, finalize, forkJoin, of, switchMap } from 'rxjs';
import { EntregasService } from '../../../core/services/entregas.service';
import { AlunoContextService } from '../../../core/services/aluno-context.service';
import { AuthService } from '../../../core/services/auth.service';
import { TrabalhosService } from '../../../core/services/trabalhos.service';
import { DisciplinasService } from '../../../core/services/disciplinas.service';
import {
  EntregaCreateRequest,
  EntregaListItem,
  EntregaUpdateRequest,
  TrabalhoListItem,
} from '../../../core/models/trabalho.model';
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
  private readonly trabalhosService = inject(TrabalhosService);
  private readonly disciplinasService = inject(DisciplinasService);
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
    return !!this.entrega?.id;
  }

  get foiCorrigido(): boolean {
    return entregaFoiCorrigida(this.entrega);
  }


  get prazoExpirado(): boolean {
    if (!this.trabalho?.dataFim) {
      return false;
    }

    // Data atual (sem horas)
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    // Converter yyyy-MM-dd para Date local
    const [ano, mes, dia] = this.trabalho.dataFim
      .split('-')
      .map(Number);

    const prazo = new Date(ano, mes - 1, dia);
    prazo.setHours(23, 59, 59, 999);

    console.log('Hoje:', hoje);
    console.log('Prazo:', prazo);

    return hoje > prazo;
  }

  get podeEntregarOuEditar(): boolean {
    return !this.prazoExpirado && !this.foiCorrigido;
  }


  private aplicarEntregaCarregada(
    entrega: EntregaListItem | null,
  ): void {
    this.entrega = entrega;
    this.linkArquivo = entrega?.linkArquivo?.trim() ?? '';
    this.cdr.detectChanges();
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

    if (!this.trabalhoId || !this.disciplinaId) {
      return;
    }

    this.loadingDados = true;
    this.cdr.detectChanges();

    this.alunoContext
      .obterIdAluno()
      .pipe(
        switchMap((idAluno) => {
          this.alunoId = idAluno;

          return forkJoin({
            trabalho: this.trabalhosService
              .buscarPorId(this.trabalhoId!)
              .pipe(catchError(() => of(this.trabalho))),
            disciplina: this.disciplinasService
              .buscarPorId(this.disciplinaId!)
              .pipe(catchError(() => of(this.disciplina))),
            entrega: this.entregasService.buscarPorAlunoTrabalho(
              idAluno,
              this.trabalhoId!,
            ),
          });
        }),
        finalize(() => {
          this.loadingDados = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: ({ trabalho, disciplina, entrega }) => {
          if (trabalho) {
            this.trabalho = trabalho;
          }

          if (disciplina) {
            this.disciplina = disciplina;
          }

          this.aplicarEntregaCarregada(entrega);
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

    if (this.foiCorrigido) {
      this.errorMessage =
        'Esta entrega já foi corrigida pelo professor e não pode mais ser alterada.';
      this.cdr.detectChanges();
      return;
    }

    if (this.prazoExpirado) {
      this.errorMessage =
        'O prazo para entrega deste trabalho já foi encerrado.';
      this.cdr.detectChanges();
      return;
    }

    const link = this.linkArquivo.trim();

    if (!link) {
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

    // Formato: YYYY-MM-DD
    const dataEntrega = new Date().toISOString().split('T')[0];

    const payloadAtualizacao: EntregaUpdateRequest = {
      linkArquivo: link,
      dataEntrega: dataEntrega,
    };

    this.cdr.detectChanges();

    const salvarComId = (idAluno: number) => {
      const trabalhoIdNum = Number(this.trabalhoId);

      if (Number.isNaN(trabalhoIdNum)) {
        this.loading = false;
        this.errorMessage = 'ID do trabalho inválido.';
        this.cdr.detectChanges();
        return;
      }

      const payloadCadastro: EntregaCreateRequest = {
        linkArquivo: link,
        dataEntrega: dataEntrega,
        trabalhoId: trabalhoIdNum,
        alunoId: idAluno,
      };

      console.log('Já entregou:', this.jaEntregou);

      console.log(
        'Payload:',
        this.jaEntregou ? payloadAtualizacao : payloadCadastro,
      );

      const request$ = this.jaEntregou
        ? this.entregasService.atualizar(
          idAluno,
          trabalhoIdNum,
          payloadAtualizacao,
        )
        : this.entregasService.cadastrar(payloadCadastro);

      request$
        .pipe(
          finalize(() => {
            this.loading = false;
            this.cdr.detectChanges();
          }),
        )
        .subscribe({
          next: (entregaSalva) => {

            const estavaEditando = this.jaEntregou;

            this.aplicarEntregaCarregada(entregaSalva);

            this.successMessage = estavaEditando
              ? 'Entrega atualizada com sucesso!'
              : 'Entrega registrada com sucesso!';
          },

          error: (err: HttpErrorResponse) => {
            console.error('Status:', err.status);
            console.error('Erro:', err.error);

            if (err.status === 403) {
              this.errorMessage =
                'Esta entrega já foi corrigida pelo professor e não pode mais ser alterada.';
              this.carregar();
              return;
            }

            if (err.status === 409 && !this.jaEntregou) {
              this.entregasService
                .atualizar(
                  idAluno,
                  trabalhoIdNum,
                  payloadAtualizacao,
                )
                .subscribe({
                  next: (entregaSalva) => {

                    this.aplicarEntregaCarregada(entregaSalva);

                    this.successMessage =
                      'Entrega atualizada com sucesso!';
                  },

                  error: (putErr: HttpErrorResponse) => {
                    this.errorMessage = mensagemErroHttp(putErr, {
                      temToken: !!this.authService.getToken(),
                      contexto: 'salvar',
                      entidade: 'entrega',
                    });

                    this.carregar();
                  },
                });

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
