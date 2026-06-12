import { Pipe, PipeTransform } from '@angular/core';
import { formatarDataBr } from '../../core/utils/date.util';

/** Exibe datas da API (yyyy-MM-dd) no formato brasileiro dd/MM/yyyy. */
@Pipe({
  name: 'dataBr',
  standalone: true,
})
export class DataBrPipe implements PipeTransform {
  transform(valor?: string | null): string {
    return formatarDataBr(valor ?? undefined);
  }
}
