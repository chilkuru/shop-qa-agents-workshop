package com.shop.api.services;

import io.qameta.allure.Step;
import io.restassured.response.Response;

public class CatalogApi extends BaseService {

    @Step("List products (search={search}, category={category})")
    public Response products(String search, String category, int size) {
        var spec = request().queryParam("size", size);
        if (search != null && !search.isBlank()) {
            spec = spec.queryParam("search", search);
        }
        if (category != null && !category.isBlank()) {
            spec = spec.queryParam("category", category);
        }
        return spec.get("/api/products");
    }

    @Step("Get product {id}")
    public Response product(long id) {
        return request().get("/api/products/{id}", id);
    }

    @Step("List categories")
    public Response categories() {
        return request().get("/api/categories");
    }
}
