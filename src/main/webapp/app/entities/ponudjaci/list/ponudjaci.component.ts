import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Data, ParamMap, Router } from '@angular/router';
import { combineLatest, filter, Observable, switchMap, tap } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { IPonudjaci } from '../ponudjaci.model';
import { ASC, DESC, SORT, ITEM_DELETED_EVENT, DEFAULT_SORT_DATA } from 'app/config/navigation.constants';
import { EntityArrayResponseType, PonudjaciService } from '../service/ponudjaci.service';
import { PonudjaciDeleteDialogComponent } from '../delete/ponudjaci-delete-dialog.component';
import { SortService } from 'app/shared/sort/sort.service';
import { PonudjaciUpdateComponent } from '../update/ponudjaci-update.component';

@Component({
  selector: 'jhi-ponudjaci',
  templateUrl: './ponudjaci.component.html',
})
export class PonudjaciComponent implements OnInit {
  ponudjacis?: IPonudjaci[];
  isLoading = false;

  predicate = 'id';
  ascending = true;

  constructor(
    protected ponudjaciService: PonudjaciService,
    protected activatedRoute: ActivatedRoute,
    public router: Router,
    protected sortService: SortService,
    protected modalService: NgbModal
  ) {}

  trackId = (_index: number, item: IPonudjaci): number => this.ponudjaciService.getPonudjaciIdentifier(item);

  ngOnInit(): void {
    this.load();
  }

  delete(ponudjaci: IPonudjaci): void {
    const modalRef = this.modalService.open(PonudjaciDeleteDialogComponent, { size: 'lg', backdrop: 'static' });
    modalRef.componentInstance.ponudjaci = ponudjaci;
    // unsubscribe not needed because closed completes on modal close
    modalRef.closed
      .pipe(
        filter(reason => reason === ITEM_DELETED_EVENT),
        switchMap(() => this.loadFromBackendWithRouteInformations())
      )
      .subscribe({
        next: (res: EntityArrayResponseType) => {
          this.onResponseSuccess(res);
        },
      });
  }

  load(): void {
    this.loadFromBackendWithRouteInformations().subscribe({
      next: (res: EntityArrayResponseType) => {
        this.onResponseSuccess(res);
      },
    });
  }

  navigateToWithComponentValues(): void {
    this.handleNavigation(this.predicate, this.ascending);
  }

  protected loadFromBackendWithRouteInformations(): Observable<EntityArrayResponseType> {
    return combineLatest([this.activatedRoute.queryParamMap, this.activatedRoute.data]).pipe(
      tap(([params, data]) => this.fillComponentAttributeFromRoute(params, data)),
      switchMap(() => this.queryBackend(this.predicate, this.ascending))
    );
  }

  protected fillComponentAttributeFromRoute(params: ParamMap, data: Data): void {
    const sort = (params.get(SORT) ?? data[DEFAULT_SORT_DATA]).split(',');
    this.predicate = sort[0];
    this.ascending = sort[1] === ASC;
  }

  protected onResponseSuccess(response: EntityArrayResponseType): void {
    const dataFromBody = this.fillComponentAttributesFromResponseBody(response.body);
    this.ponudjacis = this.refineData(dataFromBody);
  }

  protected refineData(data: IPonudjaci[]): IPonudjaci[] {
    return data.sort(this.sortService.startSort(this.predicate, this.ascending ? 1 : -1));
  }

  protected fillComponentAttributesFromResponseBody(data: IPonudjaci[] | null): IPonudjaci[] {
    return data ?? [];
  }

  protected queryBackend(predicate?: string, ascending?: boolean): Observable<EntityArrayResponseType> {
    this.isLoading = true;
    const queryObject = {
      sort: this.getSortQueryParam(predicate, ascending),
    };
    return this.ponudjaciService.query(queryObject).pipe(tap(() => (this.isLoading = false)));
  }

  protected handleNavigation(predicate?: string, ascending?: boolean): void {
    const queryParamsObj = {
      sort: this.getSortQueryParam(predicate, ascending),
    };

    this.router.navigate(['./'], {
      relativeTo: this.activatedRoute,
      queryParams: queryParamsObj,
    });
  }

  protected getSortQueryParam(predicate = this.predicate, ascending = this.ascending): string[] {
    const ascendingQueryParam = ascending ? ASC : DESC;
    if (predicate === '') {
      return [];
    } else {
      return [predicate + ',' + ascendingQueryParam];
    }
  }

  update(
    id?: number,
    nazivPonudjaca?: string | null,
    odgovornoLice?: string | null,
    adresaPonudjaca?: string | null,
    bankaRacun?: string | null
  ): void {
    const modalRef = this.modalService.open(PonudjaciUpdateComponent, { size: 'lg', backdrop: 'static' });
    modalRef.componentInstance.id = id;
    modalRef.componentInstance.nazivPonudjaca = nazivPonudjaca;
    modalRef.componentInstance.odgovornoLice = odgovornoLice;
    modalRef.componentInstance.adresaPonudjaca = adresaPonudjaca;
    modalRef.componentInstance.bankaRacun = bankaRacun;

    modalRef.closed.subscribe(() => {
      this.load();
    });
  }
  add(): void {
    const modalRef = this.modalService.open(PonudjaciUpdateComponent, { size: 'lg', backdrop: 'static' });
    modalRef.closed.subscribe(() => {
      this.load();
    });
  }
}
