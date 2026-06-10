import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { TrabalhosService } from '../../../core/services/trabalhos.service';
import { AuthService } from '../../../core/services/auth.service';
import { TrabalhoListItem } from '../../../core/models/trabalho.model';
import { DisciplinaListItem } from '../../../core/models/disciplina.model';
import { mensagemErroHttp } from '../../../core/utils/http-error.util';

@Component({
  selector: 'app-aluno-trabalhos-list',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './aluno-trabalhos-list.component.html',
  styleUrl: './aluno-trabalhos-list.component.css',
})
export class AlunoTrabalhosListComponent implements OnInit {
  private readonly trabalhosService = inject(TrabalhosService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);

  disciplinaId: string | null = null;
  disciplina: DisciplinaListItem | null = null;
  trabalhos: TrabalhoListItem[] = [];
  loading = false;
  errorMessage = '';

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      void this.router.navigate(['/login']);
      return;
    }

    const id = this.route.snapshot.paramMap.get('disciplinaId');
    if (!id) {
      void this.router.navigate(['/dashboard']);
      return;
    }

    this.disciplinaId = id;
    this.disciplina =
      (history.state?.['disciplina'] as DisciplinaListItem | undefined) ?? null;

    this.carregar();
  }

  get tituloDisciplina(): string {
    return this.disciplina?.nome ?? `Disciplina #${this.disciplinaId}`;
  }

  carregar(): void {
    this.errorMessage = '';

    if (!this.authService.getToken() || !this.disciplinaId) {
      this.errorMessage = 'Sessão expirada. Faça login novamente.';
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    this.cdr.detectChanges();

    this.trabalhosService
      .listarPorDisciplina(this.disciplinaId)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (trabalhos) => {
          this.trabalhos = trabalhos ?? [];
        },
        error: (err: HttpErrorResponse) => {
          this.errorMessage = mensagemErroHttp(err, {
            temToken: !!this.authService.getToken(),
            contexto: 'listar',
            entidade: 'trabalhos',
          });
        },
      });
  }

  abrirEntrega(trabalho: TrabalhoListItem): void {
    if (trabalho.id == null || !this.disciplinaId) {
      this.errorMessage = 'Este trabalho não possui ID.';
      this.cdr.detectChanges();
      return;
    }

    this.router.navigate(
      [
        '/aluno/disciplinas',
        this.disciplinaId,
        'trabalhos',
        trabalho.id,
        'entrega',
      ],
      { state: { trabalho, disciplina: this.disciplina } },
    );
  }
}
