import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, delay, filter, first, map, mergeAll, shareReplay, switchMap, tap } from 'rxjs/operators';
import { Product } from './product.interface';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private baseUrl = 'https://storerestservice.azurewebsites.net/api/products/';
  private productsSubject = new BehaviorSubject<Product[]>([]);
  products$: Observable<Product[]> = this.productsSubject.asObservable();
  mostExpensiveProduct$: Observable<Product>;
  productsToLoad = 10;

  constructor(private http: HttpClient) {
    this.initProducts();
    this.initMostExpensiveProduct();
  }

  resetList(): void {
    this.productsSubject.next([]);
    this.initProducts();
  }

  private initMostExpensiveProduct(): void {
    this.mostExpensiveProduct$ =
      this
      .products$
      .pipe(
        filter(products => products.length > 0),
        switchMap(
          products => of(products)
                      .pipe(
                        map(products => [...products].sort((p1, p2) => p1.price > p2.price ? -1 : 1)),
                        // [{}, {}, {}]
                        mergeAll(),
                        // {}, {}, {}
                        first()
                      )
        )
      )
  }

  // loadProducts(): Observable<Product[]> {
  //   return this.http.get<Product[]>(this.baseUrl);
  // }

  initProducts(skip = 0, take = this.productsToLoad): void {
    let url = this.baseUrl + `?$skip=${skip}&$top=${take}&$orderby=ModifiedDate%20desc`;

    this
      .http
      .get<Product[]>(url)
      .pipe(
        delay(1500), // pour la demo...
        tap(data => console.table(data)),
        shareReplay(),
        map(
          newProducts => {
            let currentProduts = this.productsSubject.value;
            return currentProduts.concat(newProducts);
          }
        )
      )
      .subscribe(
        fullProductList => this.productsSubject.next(fullProductList)
      );
  }

  insertProduct(newProduct: Product): Observable<Product> {
    return this.http.post<Product>(this.baseUrl, newProduct).pipe(delay(2000));
  }

  deleteProduct(id: number): Observable<any> {
    return this.http.delete(this.baseUrl + id);
  }
}
