import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';

const BLANK = { label: '', recipient: '', line1: '', city: '', state: '', postalCode: '' };

export function AddressesPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(BLANK);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ['addresses'], queryFn: api.addresses });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['addresses'] });

  const save = useMutation({
    mutationFn: () => api.saveAddress(form),
    onSuccess: () => {
      setForm(BLANK);
      setError(null);
      invalidate();
    },
    onError: (e: unknown) => setError(e instanceof Error ? e.message : 'Could not save'),
  });

  const makeDefault = useMutation({
    mutationFn: (id: number) => api.makeAddressDefault(id),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: number) => api.deleteAddress(id),
    onSuccess: invalidate,
  });

  if (isLoading) return <p data-testid="addresses-loading">Loading&hellip;</p>;

  const addresses = data?.addresses ?? [];
  const field = (name: keyof typeof BLANK, label: string) => (
    <label>
      {label}
      <input
        data-testid={`address-${name}-input`}
        value={form[name]}
        onChange={(e) => setForm({ ...form, [name]: e.target.value })}
      />
    </label>
  );

  return (
    <section data-testid="addresses-page">
      <h1 data-testid="addresses-heading">Delivery addresses</h1>
      <p data-testid="addresses-count">{addresses.length} saved</p>

      {addresses.length === 0 ? (
        <p data-testid="addresses-empty">You have no saved addresses.</p>
      ) : (
        <ul data-testid="addresses-list">
          {addresses.map((a) => (
            <li key={a.id} data-testid={`address-row-${a.id}`}>
              <strong data-testid={`address-label-${a.id}`}>{a.label}</strong>
              <span data-testid={`address-formatted-${a.id}`}>{a.formatted}</span>
              {a.isDefault ? <span data-testid={`address-default-${a.id}`}>Default</span> : null}

              <button
                type="button"
                data-testid={`address-make-default-${a.id}`}
                disabled={a.isDefault || makeDefault.isPending}
                onClick={() => makeDefault.mutate(a.id!)}
              >
                Make default
              </button>
              <button
                type="button"
                data-testid={`address-delete-${a.id}`}
                disabled={remove.isPending}
                onClick={() => remove.mutate(a.id!)}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}

      <h2>Add an address</h2>
      <form
        data-testid="address-form"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        {field('label', 'Label')}
        {field('recipient', 'Recipient')}
        {field('line1', 'Address line')}
        {field('city', 'City')}
        {field('state', 'State')}
        {field('postalCode', 'Postal code')}

        {error ? <p data-testid="address-error">{error}</p> : null}
        <button type="submit" data-testid="address-save-button" disabled={save.isPending}>
          Save address
        </button>
      </form>
    </section>
  );
}
