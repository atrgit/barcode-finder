import { of, forkJoin, Observable  } from 'rxjs';
import { map, catchError, finalize, switchMap, tap } from 'rxjs/operators';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CloudAppRestService, CloudAppEventsService, Request, HttpMethod, 
  Entity, RestErrorResponse, AlertService } from '@exlibris/exl-cloudapp-angular-lib';
import { MatRadioChange } from '@angular/material/radio';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit, OnDestroy {
  bib_data     = null;
  holding_data = null;
  item_data    = null;
  link         = '';
  jsonOject    = JSON;

  loading = false;
  selectedEntity: Entity;
  apiResult: any;

  running = false;
  record: any;

  entities$: Observable<Entity[]> = this.eventsService.entities$
  .pipe(tap(() => this.clear()))

  constructor(
    private restService: CloudAppRestService,
    private eventsService: CloudAppEventsService,
    private alert: AlertService 
  ) { }

  ngOnInit() {
  }

  ngOnDestroy(): void {
  }

  entitySelected(event: MatRadioChange) {
    const value = event.value as Entity;
    this.loading = true;
    this.restService.call<any>(value.link)
    .pipe(finalize(()=>this.loading=false))
    .subscribe(
      result => this.apiResult = result,
      error => this.alert.error('Failed to retrieve entity: ' + error.message)
    );
  }

  clear() {
    this.apiResult = null;
    this.selectedEntity = null;
  }

  update(value: any) {
    const requestBody = this.tryParseJson(value)
    if (!requestBody) return this.alert.error('Failed to parse json');

    this.loading = true;
    let request: Request = {
      url: this.selectedEntity.link, 
      method: HttpMethod.PUT,
      requestBody
    };
    this.restService.call(request)
    .pipe(finalize(()=>this.loading=false))
    .subscribe({
      next: result => {
        this.apiResult = result;
        this.eventsService.refreshPage().subscribe(
          ()=>this.alert.success('Success!')
        );
      },
      error: (e: RestErrorResponse) => {
        this.alert.error('Failed to update data: ' + e.message);
        console.error(e);
      }
    });    
  }

  private tryParseJson(value: any) {
    try {
      return JSON.parse(value);
    } catch (e) {
      console.error(e);
    }
    return undefined;
  }

  search(identifier: string) {
    this.bib_data     = null;
    this.holding_data = null;
    this.item_data    = null;
    this.link         = null;

    this.loading = true;
    this.restService.call( `/almaws/v1/items?item_barcode=`+encodeURIComponent( identifier ) )
    .pipe(
      finalize(()=>this.loading=false)
    )
    .subscribe(
      result => this.getItem( result ),
      error => this.alert.error('Error al recuperar los datos: ' + error.message)
    );
  }

  addErrors(items: any[]) {
    console.log('items', items);
    return items;
  }

  getItem(item: any) {
    /**
    //console.log('item', item);
    console.log('bib_data', item.bib_data);
    console.log('holding_data', item.holding_data);
    console.log('item_data', item.item_data);
    console.log('link', item.link);
    console.log('Prototype', Object.getPrototypeOf(item));
    /**/

    this.bib_data     = item.bib_data;
    this.holding_data = item.holding_data;
    this.item_data    = item.item_data;
    this.link         = item.link;
  }

}