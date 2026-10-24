import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatPaise } from '@shop/types';
import { api, imageUrl } from '../api/client';
import { useAuth } from '../auth/AuthContext';

export function CatalogPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: api.categories });

  const { data, isLoading } = useQuery({
    queryKey: ['products', search, category],
    queryFn: () => api.products({ search, category }),
  });

  const addToCart = useMutation({
    mutationFn: (productId: number) => api.addToCart({ productId, quantity: 1 }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  });

  return (
    <section className="page" data-testid="catalog-page">
      <h1 data-testid="catalog-heading">Catalog</h1>

      <form
        className="filters"
        data-testid="catalog-filters"
        onSubmit={(e) => {
          e.preventDefault();
          setSearch(searchInput);
        }}
      >
        <input
          type="search"
          placeholder="Search products"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          data-testid="search-input"
        />
        <button type="submit" data-testid="search-button">
          Search
        </button>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          data-testid="category-select"
        >
          <option value="">All categories</option>
          {categories?.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <button
          type="button"
          data-testid="clear-filters-button"
          onClick={() => {
            setSearchInput('');
            setSearch('');
            setCategory('');
          }}
        >
          Clear
        </button>
      </form>

      {isLoading && <p data-testid="catalog-loading">Loading…</p>}

      <p data-testid="result-count">{data?.totalItems ?? 0} products</p>

      {data?.items?.length === 0 && <p data-testid="no-results">No products matched your search.</p>}

      <ul className="product-grid" data-testid="product-list">
        {data?.items?.map((p) => (
          <li key={p.id} className="product-card" data-testid={`product-card-${p.id}`}>
            <Link to={`/products/${p.id}`} data-testid={`product-link-${p.id}`}>
              <img
                className="product-image"
                src={imageUrl(p.imageUrl)}
                alt={p.name}
                loading="lazy"
                data-testid={`product-image-${p.id}`}
              />
              <h2 data-testid={`product-name-${p.id}`}>{p.name}</h2>
            </Link>
            <p data-testid={`product-category-${p.id}`}>{p.category}</p>
            <p data-testid={`product-price-${p.id}`}>{formatPaise(p.pricePaise ?? 0)}</p>
            <p data-testid={`product-stock-${p.id}`}>{p.inStock ? 'In stock' : 'Out of stock'}</p>

            <button
              type="button"
              data-testid={`add-to-cart-${p.id}`}
              disabled={!user || !p.inStock || addToCart.isPending}
              onClick={() => addToCart.mutate(p.id!)}
            >
              {user ? 'Add to cart' : 'Log in to buy'}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
