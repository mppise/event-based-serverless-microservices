import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class DataService {

  constructor(private http: HttpClient) { } // constructor

  loadProducts() {
    return this.http.post('https://product-bvjigbi2ja-uc.a.run.app/prepare', {}).toPromise();
  } // loadProducts

  emptyOrders() {
    return this.http.post('https://order-bvjigbi2ja-uc.a.run.app/prepare', {}).toPromise();
  } // emptyOrders

  getProducts() {
    return this.http.get('https://product-bvjigbi2ja-uc.a.run.app/').toPromise();
  } // getProducts

  getOrders() {
    return this.http.get('https://order-bvjigbi2ja-uc.a.run.app/').toPromise();
  } // getOrders

  submitOrder(order) {
    return this.http.post('https://order-bvjigbi2ja-uc.a.run.app/', order).toPromise();
  } // submitOrder

} // DataService
