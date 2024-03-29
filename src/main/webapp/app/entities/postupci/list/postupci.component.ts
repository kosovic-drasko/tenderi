import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Data, ParamMap, Router } from '@angular/router';
import { combineLatest, filter, Observable, switchMap, tap } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { IPostupci } from '../postupci.model';
import { ASC, DESC, SORT, ITEM_DELETED_EVENT, DEFAULT_SORT_DATA } from 'app/config/navigation.constants';
import { EntityArrayResponseType, PostupciService } from '../service/postupci.service';
import { PostupciDeleteDialogComponent } from '../delete/postupci-delete-dialog.component';
import { SortService } from 'app/shared/sort/sort.service';
import { PostupciUpdateComponent } from '../update/postupci-update.component';
import dayjs from 'dayjs';

@Component({
  selector: 'jhi-postupci',
  templateUrl: './postupci.component.html',
  styleUrls: ['./postupci.scss'],
})
export class PostupciComponent implements OnInit {
  postupcis?: IPostupci[];
  isLoading = false;

  predicate = 'id';
  ascending = true;

  constructor(
    protected postupciService: PostupciService,
    protected activatedRoute: ActivatedRoute,
    public router: Router,
    protected sortService: SortService,
    protected modalService: NgbModal
  ) {}

  trackId = (_index: number, item: IPostupci): number => this.postupciService.getPostupciIdentifier(item);

  ngOnInit(): void {
    this.load();
  }

  delete(postupci: IPostupci): void {
    const modalRef = this.modalService.open(PostupciDeleteDialogComponent, { size: 'lg', backdrop: 'static' });
    modalRef.componentInstance.postupci = postupci;
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
    this.postupcis = this.refineData(dataFromBody);
  }

  protected refineData(data: IPostupci[]): IPostupci[] {
    return data.sort(this.sortService.startSort(this.predicate, this.ascending ? 1 : -1));
  }

  protected fillComponentAttributesFromResponseBody(data: IPostupci[] | null): IPostupci[] {
    return data ?? [];
  }

  protected queryBackend(predicate?: string, ascending?: boolean): Observable<EntityArrayResponseType> {
    this.isLoading = true;
    const queryObject = {
      sort: this.getSortQueryParam(predicate, ascending),
    };
    return this.postupciService.query(queryObject).pipe(tap(() => (this.isLoading = false)));
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
    sifraPostupka?: number,
    brojTendera?: string | null,
    opisPostupka?: string,
    vrstaPostupka?: string,
    datumObjave?: dayjs.Dayjs | null,
    datumOtvaranja?: dayjs.Dayjs | null,
    kriterijumCijena?: number,
    drugiKriterijum?: number
  ): void {
    const modalRef = this.modalService.open(PostupciUpdateComponent, { size: 'lg', backdrop: 'static' });
    modalRef.componentInstance.id = id;
    modalRef.componentInstance.sifraPostupka = sifraPostupka;
    modalRef.componentInstance.brojTendera = brojTendera;
    modalRef.componentInstance.opisPostupka = opisPostupka;
    modalRef.componentInstance.vrstaPostupka = vrstaPostupka;

    modalRef.componentInstance.datumObjave = datumObjave;
    modalRef.componentInstance.datumOtvaranja = datumOtvaranja;
    modalRef.componentInstance.kriterijumCijena = kriterijumCijena;
    modalRef.componentInstance.drugiKriterijum = drugiKriterijum;

    modalRef.closed.subscribe(() => {
      this.load();
    });
  }

  add(): void {
    const modalRef = this.modalService.open(PostupciUpdateComponent, { size: 'lg', backdrop: 'static' });
    modalRef.closed.subscribe(() => {
      this.load();
    });
  }
}
